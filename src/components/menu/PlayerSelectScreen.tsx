import { useState, type CSSProperties } from 'react';
import {
  LOADING_SCREEN_URL,
  PLAYER_ROSTER,
  type PlayableCharacter,
} from '@/game/data/players';
import { playerSession } from '@/game/session/PlayerSession';
import './PlayerSelectScreen.css';

interface PlayerSelectScreenProps {
  onConfirm: () => void;
}

export function PlayerSelectScreen({ onConfirm }: PlayerSelectScreenProps) {
  const [selectedId, setSelectedId] = useState(PLAYER_ROSTER[0].id);
  const selected = PLAYER_ROSTER.find((character) => character.id === selectedId)!;

  const handleConfirm = () => {
    playerSession.selectCharacter(selected);
    onConfirm();
  };

  return (
    <div className="player-select">
      <img
        className="player-select__backdrop"
        src={LOADING_SCREEN_URL}
        alt=""
        aria-hidden="true"
      />

      <div className="player-select__panel">
        <header className="player-select__header">
          <p className="player-select__eyebrow">Choose Your Hero</p>
          <h1>Select a Character</h1>
          <p>Pick a mage to explore the forest and battle wild pets.</p>
        </header>

        <div className="player-select__layout">
          <section className="player-select__preview" aria-live="polite">
            <img
              className="player-select__portrait"
              src={selected.spriteUrl}
              alt={selected.name}
              draggable={false}
            />
            <div className="player-select__details">
              <h2>{selected.name}</h2>
              <p className="player-select__title">{selected.title}</p>
              <p className="player-select__description">{selected.description}</p>
            </div>
          </section>

          <section className="player-select__grid" aria-label="Character roster">
            {PLAYER_ROSTER.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                isSelected={character.id === selectedId}
                onSelect={() => setSelectedId(character.id)}
              />
            ))}
          </section>
        </div>

        <footer className="player-select__footer">
          <button type="button" className="player-select__confirm" onClick={handleConfirm}>
            Begin Adventure as {selected.name}
          </button>
        </footer>
      </div>
    </div>
  );
}

function CharacterCard({
  character,
  isSelected,
  onSelect,
}: {
  character: PlayableCharacter;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`character-card ${isSelected ? 'is-selected' : ''}`}
      style={{ '--accent': character.accentColor } as CSSProperties}
      onClick={onSelect}
      aria-pressed={isSelected}
    >
      <img
        className="character-card__sprite"
        src={character.spriteUrl}
        alt=""
        draggable={false}
      />
      <span className="character-card__name">{character.name}</span>
    </button>
  );
}
