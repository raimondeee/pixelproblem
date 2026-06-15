import { useEffect, useRef } from 'react';
import { gameEngine } from '@/game/GameEngine';
import { gameEvents } from '@/game/events/GameEventBus';
import './GameCanvas.css';

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    gameEngine.mount(container);

    return () => {
      gameEngine.destroy();
    };
  }, []);

  useEffect(() => {
    return gameEvents.on('mode-changed', (mode) => {
      if (mode === 'BATTLE') {
        gameEngine.pause();
      } else {
        gameEngine.resume();
      }
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="game-canvas"
      aria-label="Game world"
    />
  );
}
