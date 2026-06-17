import { useCallback, useState } from 'react';
import type { AppScreen } from '@/game/data/players';
import { playerSession } from '@/game/session/PlayerSession';
import { BattleOverlay } from '@/components/battle/BattleOverlay';
import { GameCanvas } from '@/components/game/GameCanvas';
import { LoadingScreen } from '@/components/menu/LoadingScreen';
import { PlayerSelectScreen } from '@/components/menu/PlayerSelectScreen';
import { MapEditor } from '@/components/mapEditor/MapEditor';
import './App.css';

function getInitialScreen(): AppScreen {
  const params = new URLSearchParams(window.location.search);
  if (params.get('editor') === 'map') {
    return 'map-editor';
  }
  return 'loading';
}

function App() {
  const [screen, setScreen] = useState<AppScreen>(getInitialScreen);
  const [showHud, setShowHud] = useState(false);

  const handleLoadingComplete = useCallback(() => {
    setScreen('player-select');
  }, []);

  const handlePlayerConfirmed = useCallback(() => {
    setScreen('game');
  }, []);

  const handleOpenMapEditor = useCallback(() => {
    setScreen('map-editor');
  }, []);

  const handleExitMapEditor = useCallback(() => {
    setScreen('game');
  }, []);

  if (screen === 'map-editor') {
    return <MapEditor onExit={handleExitMapEditor} />;
  }

  if (screen === 'loading') {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  if (screen === 'player-select') {
    return <PlayerSelectScreen onConfirm={handlePlayerConfirmed} />;
  }

  const hero = playerSession.getSelectedCharacter();

  return (
    <main className="app app--overland">
      <section className="app__stage app__stage--fullscreen">
        <GameCanvas />
        <BattleOverlay />

        <div className={`app__hud ${showHud ? 'is-open' : ''}`}>
          <button
            type="button"
            className="app__hud-toggle"
            onClick={() => setShowHud((open) => !open)}
            aria-expanded={showHud}
            aria-label="Toggle game menu"
          >
            ☰
          </button>
          {showHud ? (
            <div className="app__hud-panel">
              <p className="app__hud-title">Pixel Problems</p>
              <p className="app__hud-subtitle">
                {hero ? `${hero.name} the ${hero.title}` : 'Overland exploration'}
              </p>
              <p className="app__hud-hint">WASD / arrow keys to move</p>
              <button type="button" className="app__hud-link" onClick={handleOpenMapEditor}>
                Open Map Editor
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default App;
