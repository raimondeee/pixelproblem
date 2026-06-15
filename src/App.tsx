import { useCallback, useState } from 'react';
import type { AppScreen } from '@/game/data/players';
import { playerSession } from '@/game/session/PlayerSession';
import { BattleOverlay } from '@/components/battle/BattleOverlay';
import { GameCanvas } from '@/components/game/GameCanvas';
import { LoadingScreen } from '@/components/menu/LoadingScreen';
import { PlayerSelectScreen } from '@/components/menu/PlayerSelectScreen';
import './App.css';

function App() {
  const [screen, setScreen] = useState<AppScreen>('loading');

  const handleLoadingComplete = useCallback(() => {
    setScreen('player-select');
  }, []);

  const handlePlayerConfirmed = useCallback(() => {
    setScreen('game');
  }, []);

  if (screen === 'loading') {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  if (screen === 'player-select') {
    return <PlayerSelectScreen onConfirm={handlePlayerConfirmed} />;
  }

  const hero = playerSession.getSelectedCharacter();

  return (
    <main className="app">
      <header className="app__header">
        <h1>Pixel Problems</h1>
        <p>
          {hero
            ? `${hero.name} the ${hero.title} — explore the map and walk into the red zone to battle.`
            : 'Explore the map. Walk into the red zone to start a battle.'}
        </p>
      </header>

      <section className="app__stage">
        <GameCanvas />
        <BattleOverlay />
      </section>

      <footer className="app__hint">
        Move with arrow keys or WASD. Touch controls can be layered on in Phase 1+.
      </footer>
    </main>
  );
}

export default App;
