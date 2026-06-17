import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapCanvas } from '@/components/mapEditor/MapCanvas';
import { OVERLAND_MAP_IMAGES } from '@/game/data/overlandAssets';
import {
  loadOverlandMapData,
  normalizeOverlandMapData,
  saveOverlandMapData,
} from '@/game/data/overlandMapStore';
import type {
  MapDirection,
  MapEditorTool,
  OverlandMapData,
  OverlandScreen,
  ScreenConnection,
} from '@/game/types/overlandMap';
import {
  COLLISION_CELL_SIZE,
  DEFAULT_BRUSH_RADIUS_PX,
  DIRECTION_LABELS,
  MAP_DIRECTIONS,
  MAX_BRUSH_RADIUS_PX,
  MIN_BRUSH_RADIUS_PX,
} from '@/game/types/overlandMap';
import {
  createGridForImage,
  createScreenId,
  paintCircleOnGrid,
  paintStrokeOnGrid,
} from '@/logic/overlandCollision';
import {
  createRandomEncounterZone,
  getEncounterSpriteUrl,
  rerollEncounterZoneMonster,
} from '@/logic/encounterZones';
import { flipMapScreenHorizontally } from '@/logic/mapFlip';
import { textureEntryToVisual, updateScreenConnection } from '@/logic/mapConnections';
import './MapEditor.css';

function createDefaultScreen(imageUrl: string, imageWidth: number, imageHeight: number): OverlandScreen {
  return {
    id: createScreenId(),
    name: 'New Screen',
    backgroundUrl: imageUrl,
    imageWidth,
    imageHeight,
    collisionGrid: createGridForImage(imageWidth, imageHeight),
    foregroundGrid: createGridForImage(imageWidth, imageHeight),
    collisionCellSize: COLLISION_CELL_SIZE,
    playerStart: { x: 0.5, y: 0.5 },
    connections: {},
    encounterZones: [],
  };
}

interface MapEditorProps {
  onExit?: () => void;
}

export function MapEditor({ onExit }: MapEditorProps) {
  const [mapData, setMapData] = useState<OverlandMapData>(loadOverlandMapData);
  const [activeScreenId, setActiveScreenId] = useState(mapData.startScreenId);
  const [tool, setTool] = useState<MapEditorTool>('block');
  const [brushRadius, setBrushRadius] = useState(DEFAULT_BRUSH_RADIUS_PX);
  const lastPaintPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastForegroundPointRef = useRef<{ x: number; y: number } | null>(null);
  const [showCollision, setShowCollision] = useState(true);
  const [showForeground, setShowForeground] = useState(true);
  const [grayscaleMap, setGrayscaleMap] = useState(false);
  const [showEncounterZones, setShowEncounterZones] = useState(true);
  const [pendingConnection, setPendingConnection] = useState<{
    sourceScreenId: string;
    direction: MapDirection;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeScreen = useMemo(
    () => mapData.screens.find((screen) => screen.id === activeScreenId) ?? mapData.screens[0],
    [activeScreenId, mapData.screens],
  );

  useEffect(() => {
    saveOverlandMapData(mapData);
  }, [mapData]);

  const updateScreen = useCallback((screenId: string, updater: (screen: OverlandScreen) => OverlandScreen) => {
    setMapData((prev) => ({
      ...prev,
      screens: prev.screens.map((screen) => (screen.id === screenId ? updater(screen) : screen)),
    }));
  }, []);

  const handlePaintAt = useCallback(
    (imageX: number, imageY: number, value: 0 | 1) => {
      if (!activeScreen) return;

      updateScreen(activeScreen.id, (screen) => {
        const last = lastPaintPointRef.current;
        const collisionGrid = last
          ? paintStrokeOnGrid(
              screen.collisionGrid,
              last.x,
              last.y,
              imageX,
              imageY,
              brushRadius,
              screen.collisionCellSize,
              value,
            )
          : paintCircleOnGrid(
              screen.collisionGrid,
              imageX,
              imageY,
              brushRadius,
              screen.collisionCellSize,
              value,
            );

        return { ...screen, collisionGrid };
      });

      lastPaintPointRef.current = { x: imageX, y: imageY };
    },
    [activeScreen, brushRadius, updateScreen],
  );

  const handlePaintForegroundAt = useCallback(
    (imageX: number, imageY: number, value: 0 | 1) => {
      if (!activeScreen) return;

      updateScreen(activeScreen.id, (screen) => {
        const last = lastForegroundPointRef.current;
        const foregroundGrid = last
          ? paintStrokeOnGrid(
              screen.foregroundGrid,
              last.x,
              last.y,
              imageX,
              imageY,
              brushRadius,
              screen.collisionCellSize,
              value,
            )
          : paintCircleOnGrid(
              screen.foregroundGrid,
              imageX,
              imageY,
              brushRadius,
              screen.collisionCellSize,
              value,
            );

        return { ...screen, foregroundGrid };
      });

      lastForegroundPointRef.current = { x: imageX, y: imageY };
    },
    [activeScreen, brushRadius, updateScreen],
  );

  const handleStrokeEnd = useCallback(() => {
    lastPaintPointRef.current = null;
    lastForegroundPointRef.current = null;
  }, []);

  const handleBackgroundChange = async (imageId: string) => {
    const image = OVERLAND_MAP_IMAGES.find((entry) => entry.id === imageId);
    if (!image || !activeScreen) return;

    const dimensions = await loadImageDimensions(image.url);
    updateScreen(activeScreen.id, (screen) => ({
      ...screen,
      backgroundUrl: image.url,
      imageWidth: dimensions.width,
      imageHeight: dimensions.height,
      collisionGrid: createGridForImage(dimensions.width, dimensions.height),
      foregroundGrid: createGridForImage(dimensions.width, dimensions.height),
    }));
  };

  const handleAddScreen = async () => {
    const image = OVERLAND_MAP_IMAGES[0];
    const dimensions = await loadImageDimensions(image.url);
    const screen = createDefaultScreen(image.url, dimensions.width, dimensions.height);
    screen.name = `Screen ${mapData.screens.length + 1}`;

    setMapData((prev) => ({
      ...prev,
      screens: [...prev.screens, screen],
    }));
    setActiveScreenId(screen.id);
  };

  const handleDeleteScreen = () => {
    if (mapData.screens.length <= 1 || !activeScreen) return;

    const remaining = mapData.screens.filter((screen) => screen.id !== activeScreen.id);
    const cleaned = remaining.map((screen) => ({
      ...screen,
      connections: Object.fromEntries(
        Object.entries(screen.connections).filter(([, connection]) => connection.targetScreenId !== activeScreen.id),
      ) as OverlandScreen['connections'],
    }));

    const nextStartId =
      mapData.startScreenId === activeScreen.id ? cleaned[0].id : mapData.startScreenId;

    setMapData({
      ...mapData,
      screens: cleaned,
      startScreenId: nextStartId,
    });
    setActiveScreenId(cleaned[0].id);
  };

  const handleConnectionTargetChange = (direction: MapDirection, targetScreenId: string) => {
    if (!activeScreen) return;

    setMapData((prev) => ({
      ...prev,
      screens: updateScreenConnection(
        prev.screens,
        activeScreen.id,
        direction,
        targetScreenId || null,
      ),
    }));
  };

  const handleConnectionEntry = (point: { x: number; y: number }) => {
    if (!pendingConnection || !activeScreen) return;

    const sourceScreen = mapData.screens.find((screen) => screen.id === pendingConnection.sourceScreenId);
    const connection = sourceScreen?.connections[pendingConnection.direction];
    if (!sourceScreen || !connection) return;

    const visualPoint = textureEntryToVisual(point, activeScreen.flipHorizontal ?? false);

    updateScreen(sourceScreen.id, (screen) => ({
      ...screen,
      connections: {
        ...screen.connections,
        [pendingConnection.direction]: {
          ...connection,
          entryPoint: visualPoint,
        },
      },
    }));
  };

  const beginEntryPlacement = (direction: MapDirection, connection: ScreenConnection) => {
    setPendingConnection({ sourceScreenId: activeScreen!.id, direction });
    setActiveScreenId(connection.targetScreenId);
    setTool('connection');
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(mapData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'overland-map.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as OverlandMapData;
        if (parsed.version === 1 && parsed.screens.length > 0) {
          setMapData(normalizeOverlandMapData(parsed));
          setActiveScreenId(parsed.startScreenId);
        }
      } catch {
        window.alert('Could not read map file.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleClearCollision = () => {
    if (!activeScreen) return;
    updateScreen(activeScreen.id, (screen) => ({
      ...screen,
      collisionGrid: createGridForImage(screen.imageWidth, screen.imageHeight),
    }));
  };

  const handleClearForeground = () => {
    if (!activeScreen) return;
    updateScreen(activeScreen.id, (screen) => ({
      ...screen,
      foregroundGrid: createGridForImage(screen.imageWidth, screen.imageHeight),
    }));
  };

  const handleFillBlocked = () => {
    if (!activeScreen) return;
    updateScreen(activeScreen.id, (screen) => ({
      ...screen,
      collisionGrid: screen.collisionGrid.map((row) => row.map(() => 1 as const)),
    }));
  };

  const handlePlaceEncounter = (point: { x: number; y: number }) => {
    if (!activeScreen) return;
    const zone = createRandomEncounterZone(point);
    updateScreen(activeScreen.id, (screen) => ({
      ...screen,
      encounterZones: [...screen.encounterZones, zone],
    }));
  };

  const handleRemoveEncounter = (zoneId: string) => {
    if (!activeScreen) return;
    updateScreen(activeScreen.id, (screen) => ({
      ...screen,
      encounterZones: screen.encounterZones.filter((zone) => zone.id !== zoneId),
    }));
  };

  const handleRerollEncounter = (zoneId: string) => {
    if (!activeScreen) return;
    updateScreen(activeScreen.id, (screen) => ({
      ...screen,
      encounterZones: screen.encounterZones.map((zone) =>
        zone.id === zoneId ? rerollEncounterZoneMonster(zone) : zone,
      ),
    }));
  };

  const handleFlipHorizontal = () => {
    if (!activeScreen) return;
    setMapData((prev) => flipMapScreenHorizontally(prev, activeScreen.id));
  };

  const otherScreens = mapData.screens.filter((screen) => screen.id !== activeScreen?.id);

  const entryPointMarkers = useMemo(() => {
    if (!activeScreen) return [];

    const markers: { x: number; y: number; label: string }[] = [];

    for (const screen of mapData.screens) {
      for (const [direction, connection] of Object.entries(screen.connections)) {
        if (connection?.targetScreenId === activeScreen.id) {
          markers.push({
            x: connection.entryPoint.x,
            y: connection.entryPoint.y,
            label: `Entry from ${screen.name} (${direction})`,
          });
        }
      }
    }

    return markers;
  }, [activeScreen, mapData.screens]);

  const placementBanner = useMemo(() => {
    if (!pendingConnection || !activeScreen) return null;

    const sourceScreen = mapData.screens.find((screen) => screen.id === pendingConnection.sourceScreenId);
    if (!sourceScreen) return null;

    const connection = sourceScreen.connections[pendingConnection.direction];
    if (connection?.targetScreenId !== activeScreen.id) return null;

    return `Click to set entry point for ${sourceScreen.name} → ${DIRECTION_LABELS[pendingConnection.direction]}`;
  }, [activeScreen, mapData.screens, pendingConnection]);

  return (
    <div className="map-editor">
      <header className="map-editor__header">
        <div>
          <h1>Overland Map Editor</h1>
          <p>Paint blocked areas, link screens by edge, and export when ready.</p>
        </div>
        <div className="map-editor__header-actions">
          <button type="button" onClick={handleExport}>
            Export JSON
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={handleImport}
          />
          {onExit ? (
            <button type="button" className="map-editor__exit" onClick={onExit}>
              Back to Game
            </button>
          ) : null}
        </div>
      </header>

      <div className="map-editor__body">
        <aside className="map-editor__sidebar">
          <section>
            <h2>Screens</h2>
            <div className="map-editor__screen-list">
              {mapData.screens.map((screen) => (
                <button
                  key={screen.id}
                  type="button"
                  className={screen.id === activeScreen?.id ? 'is-active' : ''}
                  onClick={() => setActiveScreenId(screen.id)}
                >
                  {screen.name}
                  {screen.id === mapData.startScreenId ? ' ★' : ''}
                </button>
              ))}
            </div>
            <div className="map-editor__row">
              <button type="button" onClick={handleAddScreen}>
                + Add Screen
              </button>
              <button type="button" onClick={handleDeleteScreen} disabled={mapData.screens.length <= 1}>
                Delete
              </button>
            </div>
          </section>

          {activeScreen ? (
            <>
              <section>
                <h2>Screen Settings</h2>
                <label className="map-editor__field">
                  Name
                  <input
                    type="text"
                    value={activeScreen.name}
                    onChange={(event) =>
                      updateScreen(activeScreen.id, (screen) => ({
                        ...screen,
                        name: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="map-editor__field">
                  Background
                  <select
                    value={
                      OVERLAND_MAP_IMAGES.find((image) => image.url === activeScreen.backgroundUrl)?.id ??
                      OVERLAND_MAP_IMAGES[0].id
                    }
                    onChange={(event) => handleBackgroundChange(event.target.value)}
                  >
                    {OVERLAND_MAP_IMAGES.map((image) => (
                      <option key={image.id} value={image.id}>
                        {image.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="map-editor__checkbox">
                  <input
                    type="checkbox"
                    checked={mapData.startScreenId === activeScreen.id}
                    onChange={() =>
                      setMapData((prev) => ({ ...prev, startScreenId: activeScreen.id }))
                    }
                  />
                  Starting screen
                </label>

                <div className="map-editor__row">
                  <button type="button" onClick={handleFlipHorizontal}>
                    {activeScreen.flipHorizontal ? 'Unflip Horizontal' : 'Flip Horizontal'}
                  </button>
                </div>
                <p className="map-editor__hint">
                  Mirrors the map image left-to-right. Entry points and connections stay on the
                  same screen edges — flip again to restore.
                </p>
              </section>

              <section>
                <h2>Tools</h2>
                <div className="map-editor__tool-grid">
                  <button
                    type="button"
                    className={tool === 'block' ? 'is-active' : ''}
                    onClick={() => setTool('block')}
                  >
                    Block Brush
                  </button>
                  <button
                    type="button"
                    className={tool === 'walk' ? 'is-active' : ''}
                    onClick={() => setTool('walk')}
                  >
                    Walk Brush
                  </button>
                  <button
                    type="button"
                    className={tool === 'foreground' ? 'is-active' : ''}
                    onClick={() => setTool('foreground')}
                  >
                    Above Player
                  </button>
                  <button
                    type="button"
                    className={tool === 'clearForeground' ? 'is-active' : ''}
                    onClick={() => setTool('clearForeground')}
                  >
                    Clear Above
                  </button>
                  <button
                    type="button"
                    className={tool === 'playerStart' ? 'is-active' : ''}
                    onClick={() => setTool('playerStart')}
                  >
                    Player Start
                  </button>
                  <button
                    type="button"
                    className={tool === 'connection' ? 'is-active' : ''}
                    onClick={() => setTool('connection')}
                  >
                    Set Entry Point
                  </button>
                  <button
                    type="button"
                    className={tool === 'encounter' ? 'is-active' : ''}
                    onClick={() => setTool('encounter')}
                  >
                    Add Encounter
                  </button>
                  <button
                    type="button"
                    className={tool === 'removeEncounter' ? 'is-active' : ''}
                    onClick={() => setTool('removeEncounter')}
                  >
                    Remove Encounter
                  </button>
                </div>

                <label className="map-editor__checkbox map-editor__checkbox--tools">
                  <input
                    type="checkbox"
                    checked={grayscaleMap}
                    onChange={(event) => setGrayscaleMap(event.target.checked)}
                  />
                  Grayscale map (highlighter walk &amp; above brushes)
                </label>

                <p className="map-editor__hint">
                  Paint bright yellow blocked areas and hot pink &quot;Above Player&quot; over tree
                  tops, arches, and roofs so the hero walks underneath them in-game.
                </p>

                <label className="map-editor__field">
                  Brush size ({brushRadius}px)
                  <input
                    type="range"
                    min={MIN_BRUSH_RADIUS_PX}
                    max={MAX_BRUSH_RADIUS_PX}
                    step={4}
                    value={brushRadius}
                    onChange={(event) => setBrushRadius(Number(event.target.value))}
                  />
                </label>

                <label className="map-editor__checkbox">
                  <input
                    type="checkbox"
                    checked={showCollision}
                    onChange={(event) => setShowCollision(event.target.checked)}
                  />
                  Show blocked overlay
                </label>

                <label className="map-editor__checkbox">
                  <input
                    type="checkbox"
                    checked={showForeground}
                    onChange={(event) => setShowForeground(event.target.checked)}
                  />
                  Show above-player overlay
                </label>

                <label className="map-editor__checkbox">
                  <input
                    type="checkbox"
                    checked={showEncounterZones}
                    onChange={(event) => setShowEncounterZones(event.target.checked)}
                  />
                  Show encounter markers
                </label>

                <div className="map-editor__row">
                  <button type="button" onClick={handleClearCollision}>
                    Clear Blocks
                  </button>
                  <button type="button" onClick={handleClearForeground}>
                    Clear Above
                  </button>
                </div>

                <div className="map-editor__row">
                  <button type="button" onClick={handleFillBlocked}>
                    Fill Blocked
                  </button>
                </div>
              </section>

              <section>
                <h2>Encounters</h2>
                <p className="map-editor__hint">
                  Use Add Encounter to place a zone with a random monster sprite. Battles use a
                  random party of enemies when the player walks through the zone.
                </p>
                {activeScreen.encounterZones.length === 0 ? (
                  <p className="map-editor__hint">No encounter zones on this screen.</p>
                ) : (
                  <ul className="map-editor__encounter-list">
                    {activeScreen.encounterZones.map((zone) => (
                      <li key={zone.id} className="map-editor__encounter-item">
                        <img src={getEncounterSpriteUrl(zone)} alt="" />
                        <span>
                          {zone.element} #{zone.variant}
                        </span>
                        <button type="button" onClick={() => handleRerollEncounter(zone.id)}>
                          Reroll
                        </button>
                        <button type="button" onClick={() => handleRemoveEncounter(zone.id)}>
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h2>Connections</h2>
                <p className="map-editor__hint">
                  To leave right and enter the next map: set <strong>East →</strong> to the next
                  screen. The reciprocal <strong>West ←</strong> link is added automatically. Entry
                  points use screen directions (left/right), so they stay correct when a map is
                  flipped.
                </p>
                {MAP_DIRECTIONS.map((direction) => {
                  const connection: ScreenConnection | undefined = activeScreen.connections[direction];
                  return (
                    <div key={direction} className="map-editor__connection">
                      <label className="map-editor__field">
                        {DIRECTION_LABELS[direction]}
                        <select
                          value={connection?.targetScreenId ?? ''}
                          onChange={(event) =>
                            handleConnectionTargetChange(direction, event.target.value)
                          }
                        >
                          <option value="">None</option>
                          {otherScreens.map((screen) => (
                            <option key={screen.id} value={screen.id}>
                              {screen.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      {connection ? (
                        <button
                          type="button"
                          className={
                            pendingConnection?.sourceScreenId === activeScreen.id &&
                            pendingConnection.direction === direction &&
                            tool === 'connection'
                              ? 'is-active'
                              : ''
                          }
                          onClick={() => beginEntryPlacement(direction, connection)}
                        >
                          Place entry on target ({Math.round(connection.entryPoint.x * 100)}%,{' '}
                          {Math.round(connection.entryPoint.y * 100)}%)
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </section>
            </>
          ) : null}
        </aside>

        <main className="map-editor__canvas-area">
          {placementBanner ? (
            <div className="map-editor__placement-banner">{placementBanner}</div>
          ) : null}
          {activeScreen ? (
            <MapCanvas
              backgroundUrl={activeScreen.backgroundUrl}
              imageWidth={activeScreen.imageWidth}
              imageHeight={activeScreen.imageHeight}
              flipHorizontal={activeScreen.flipHorizontal}
              collisionGrid={activeScreen.collisionGrid}
              foregroundGrid={activeScreen.foregroundGrid}
              collisionCellSize={activeScreen.collisionCellSize}
              tool={tool}
              brushRadius={brushRadius}
              playerStart={activeScreen.playerStart}
              connections={activeScreen.connections}
              entryPointMarkers={entryPointMarkers}
              encounterZones={activeScreen.encounterZones}
              showEncounterZones={showEncounterZones}
              showCollision={showCollision}
              showForeground={showForeground}
              grayscaleMap={grayscaleMap}
              activeConnectionDirection={pendingConnection ? pendingConnection.direction : null}
              onPaintAt={handlePaintAt}
              onPaintForegroundAt={handlePaintForegroundAt}
              onStrokeEnd={handleStrokeEnd}
              onSetPlayerStart={(point) =>
                updateScreen(activeScreen.id, (screen) => ({ ...screen, playerStart: point }))
              }
              onSetConnectionEntry={handleConnectionEntry}
              onPlaceEncounter={handlePlaceEncounter}
              onRemoveEncounter={handleRemoveEncounter}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

function loadImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });
}
