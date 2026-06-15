import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ReactSketchCanvas, type ReactSketchCanvasRef } from 'react-sketch-canvas';
import { ScratchPadOverlays } from '@/components/battle/scratchPad/ScratchPadOverlays';
import { UnitCubeStacks } from '@/components/battle/scratchPad/UnitCubeStacks';
import {
  MAX_CUBE_STACK,
  SCRATCH_COLORS,
  type ScratchPoint,
  type ScratchTool,
} from '@/components/battle/scratchPad/constants';
import './DrawingBoard.css';

interface DrawingBoardProps {
  disabled?: boolean;
  variant?: 'default' | 'overlay';
}

interface CubeState {
  stacks: number[];
  activeIndex: number;
}

const EMPTY_CUBE_STATE: CubeState = { stacks: [], activeIndex: 0 };

function getPointFromEvent(event: React.PointerEvent, element: HTMLElement): ScratchPoint {
  const rect = element.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

export function DrawingBoard({ disabled = false, variant = 'default' }: DrawingBoardProps) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const [strokeColor, setStrokeColor] = useState<string>(SCRATCH_COLORS[0].value);
  const [activeTool, setActiveTool] = useState<ScratchTool>('pen');
  const [showGrid, setShowGrid] = useState(false);
  const [showDots, setShowDots] = useState(false);
  const [showNumberLine, setShowNumberLine] = useState(false);
  const [cubeState, setCubeState] = useState<CubeState>(EMPTY_CUBE_STATE);
  const [rulerStart, setRulerStart] = useState<ScratchPoint | null>(null);
  const [rulerPreview, setRulerPreview] = useState<ScratchPoint | null>(null);

  useEffect(() => {
    canvasRef.current?.eraseMode(activeTool === 'eraser');
  }, [activeTool]);

  const handleClear = () => {
    void canvasRef.current?.clearCanvas();
    setCubeState(EMPTY_CUBE_STATE);
    setRulerStart(null);
    setRulerPreview(null);
  };

  const handleUndo = () => {
    void canvasRef.current?.undo();
  };

  const handleAddCube = useCallback(() => {
    setCubeState(({ stacks, activeIndex }) => {
      const next = [...stacks];

      while (next.length <= activeIndex) {
        next.push(0);
      }

      if (next[activeIndex] >= MAX_CUBE_STACK) {
        const newIndex = activeIndex + 1;
        next.push(1);
        return { stacks: next, activeIndex: newIndex };
      }

      next[activeIndex] += 1;
      const newIndex = next[activeIndex] >= MAX_CUBE_STACK ? activeIndex + 1 : activeIndex;
      return { stacks: next, activeIndex: newIndex };
    });
  }, []);

  const handleAddStack = useCallback(() => {
    setCubeState(({ stacks, activeIndex }) => {
      const next = [...stacks];

      while (next.length <= activeIndex) {
        next.push(0);
      }

      next[activeIndex] = MAX_CUBE_STACK;
      return { stacks: next, activeIndex: activeIndex + 1 };
    });
  }, []);

  const handleRemoveCube = useCallback((stackIndex: number) => {
    setCubeState(({ stacks, activeIndex }) => {
      if (stackIndex < 0 || stackIndex >= stacks.length || stacks[stackIndex] <= 0) {
        return { stacks, activeIndex };
      }

      const next = stacks.map((count, index) =>
        index === stackIndex ? Math.max(count - 1, 0) : count,
      );
      const compact = next.filter((count) => count > 0);
      const newActiveIndex = Math.min(activeIndex, Math.max(compact.length, 0));

      return { stacks: compact, activeIndex: newActiveIndex };
    });
  }, []);

  const commitRulerLine = useCallback(
    async (start: ScratchPoint, end: ScratchPoint) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const paths = await canvas.exportPaths();
      canvas.loadPaths([
        ...paths,
        {
          paths: [start, end],
          strokeWidth: 3,
          strokeColor,
          drawMode: true,
        },
      ]);
    },
    [strokeColor],
  );

  const handleWorkspacePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || activeTool !== 'ruler' || !workspaceRef.current) {
      return;
    }

    event.preventDefault();
    const point = getPointFromEvent(event, workspaceRef.current);
    setRulerStart(point);
    setRulerPreview(point);
    workspaceRef.current.setPointerCapture(event.pointerId);
  };

  const handleWorkspacePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || activeTool !== 'ruler' || !rulerStart || !workspaceRef.current) {
      return;
    }

    setRulerPreview(getPointFromEvent(event, workspaceRef.current));
  };

  const handleWorkspacePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || activeTool !== 'ruler' || !rulerStart || !workspaceRef.current) {
      return;
    }

    const end = getPointFromEvent(event, workspaceRef.current);
    const distance = Math.hypot(end.x - rulerStart.x, end.y - rulerStart.y);
    if (distance > 4) {
      void commitRulerLine(rulerStart, end);
    }

    setRulerStart(null);
    setRulerPreview(null);
    workspaceRef.current.releasePointerCapture(event.pointerId);
  };

  const canvasInteractive = !disabled && (activeTool === 'pen' || activeTool === 'eraser');
  const rulerActive = !disabled && activeTool === 'ruler';
  const cubesActive = !disabled && activeTool === 'cubes';

  return (
    <div
      className={`drawing-board drawing-board--${variant} ${disabled ? 'is-disabled' : ''}`}
    >
      <div className="drawing-board__toolbar">
        <span className="drawing-board__title">Scratch Paper</span>

        <div className="drawing-board__tool-row">
          <div className="drawing-board__colors" role="group" aria-label="Pen colors">
            {SCRATCH_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                className={`drawing-board__color ${strokeColor === color.value ? 'is-active' : ''}`}
                style={{ '--swatch-color': color.value } as CSSProperties}
                aria-label={color.label}
                aria-pressed={strokeColor === color.value}
                disabled={disabled}
                onClick={() => {
                  setStrokeColor(color.value);
                  setActiveTool('pen');
                }}
              />
            ))}
          </div>

          <div className="drawing-board__tools" role="group" aria-label="Drawing tools">
            <button
              type="button"
              className={activeTool === 'pen' ? 'is-active' : ''}
              disabled={disabled}
              aria-pressed={activeTool === 'pen'}
              onClick={() => setActiveTool('pen')}
            >
              Pen
            </button>
            <button
              type="button"
              className={activeTool === 'eraser' ? 'is-active' : ''}
              disabled={disabled}
              aria-pressed={activeTool === 'eraser'}
              onClick={() => setActiveTool('eraser')}
            >
              Eraser
            </button>
            <button
              type="button"
              className={activeTool === 'ruler' ? 'is-active' : ''}
              disabled={disabled}
              aria-pressed={activeTool === 'ruler'}
              onClick={() => setActiveTool('ruler')}
            >
              Ruler
            </button>
            <button
              type="button"
              className={activeTool === 'cubes' ? 'is-active' : ''}
              disabled={disabled}
              aria-pressed={activeTool === 'cubes'}
              onClick={() => setActiveTool('cubes')}
            >
              Unit Cubes
            </button>
            {cubesActive ? (
              <>
                <button
                  type="button"
                  className="drawing-board__cube-btn"
                  disabled={disabled}
                  onClick={handleAddCube}
                  aria-label="Add one unit cube"
                >
                  +1
                </button>
                <button
                  type="button"
                  className="drawing-board__cube-btn"
                  disabled={disabled}
                  onClick={handleAddStack}
                  aria-label="Add a full stack of ten cubes"
                >
                  +10
                </button>
              </>
            ) : null}
          </div>

          <div className="drawing-board__overlays" role="group" aria-label="Paper overlays">
            <button
              type="button"
              className={showGrid ? 'is-active' : ''}
              disabled={disabled}
              aria-pressed={showGrid}
              onClick={() => setShowGrid((value) => !value)}
            >
              Grid
            </button>
            <button
              type="button"
              className={showDots ? 'is-active' : ''}
              disabled={disabled}
              aria-pressed={showDots}
              onClick={() => setShowDots((value) => !value)}
            >
              Dots
            </button>
            <button
              type="button"
              className={showNumberLine ? 'is-active' : ''}
              disabled={disabled}
              aria-pressed={showNumberLine}
              onClick={() => setShowNumberLine((value) => !value)}
            >
              Number Line
            </button>
          </div>

          <div className="drawing-board__actions">
            <button type="button" onClick={handleUndo} disabled={disabled}>
              Undo
            </button>
            <button type="button" onClick={handleClear} disabled={disabled}>
              Clear
            </button>
          </div>
        </div>
      </div>

      <div
        ref={workspaceRef}
        className={`drawing-board__workspace ${rulerActive ? 'is-ruler-mode' : ''} ${cubesActive ? 'is-cube-mode' : ''}`}
        onPointerDown={handleWorkspacePointerDown}
        onPointerMove={handleWorkspacePointerMove}
        onPointerUp={handleWorkspacePointerUp}
        onPointerCancel={handleWorkspacePointerUp}
      >
        <ScratchPadOverlays
          showGrid={showGrid}
          showDots={showDots}
          showNumberLine={showNumberLine}
        />

        <UnitCubeStacks
          stacks={cubeState.stacks}
          active={cubesActive}
          onRemoveCube={handleRemoveCube}
        />

        {rulerPreview && rulerStart ? (
          <svg className="drawing-board__ruler-preview" aria-hidden="true">
            <line
              x1={rulerStart.x}
              y1={rulerStart.y}
              x2={rulerPreview.x}
              y2={rulerPreview.y}
              stroke={strokeColor}
              strokeWidth={3}
              strokeLinecap="round"
            />
          </svg>
        ) : null}

        <ReactSketchCanvas
          ref={canvasRef}
          className={`drawing-board__canvas ${canvasInteractive ? '' : 'is-inactive'}`}
          strokeWidth={activeTool === 'eraser' ? 12 : 3}
          strokeColor={activeTool === 'eraser' ? '#fefae0' : strokeColor}
          canvasColor="transparent"
          allowOnlyPointerType="all"
        />
      </div>
    </div>
  );
}
