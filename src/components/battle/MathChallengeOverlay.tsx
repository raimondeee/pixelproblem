import { useState, type FormEvent, type KeyboardEvent } from 'react';
import type { MathEquation, Spell } from '@/game/types';
import { ELEMENT_LABELS } from '@/logic/elements';
import { gameSettings } from '@/game/settings/gameSettings';
import { useGameSettings } from '@/hooks/useGameSettings';
import { DrawingBoard } from '@/components/battle/DrawingBoard';
import './MathChallengeOverlay.css';

interface MathChallengeOverlayProps {
  spell: Spell;
  equation: MathEquation;
  feedback: string | null;
  onSubmit: (answer: string) => void;
  onCancel: () => void;
}

export function MathChallengeOverlay({
  spell,
  equation,
  feedback,
  onSubmit,
  onCancel,
}: MathChallengeOverlayProps) {
  const settings = useGameSettings();
  const [answer, setAnswer] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const canSubmit = answer.trim().length > 0;

  const submitAnswer = () => {
    onSubmit(answer);
    setAnswer('');
    setShowConfirmDialog(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    if (settings.requireConfirmAnswer) {
      setShowConfirmDialog(true);
      return;
    }

    submitAnswer();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      if (showConfirmDialog) {
        setShowConfirmDialog(false);
        return;
      }
      onCancel();
    }
  };

  return (
    <div className="math-overlay" role="dialog" aria-modal="true" aria-label="Math challenge">
      <div className="math-overlay__backdrop" />

      <div className="math-overlay__panel">
        <header className="math-overlay__top">
          <section className="math-overlay__question" aria-live="polite">
            <p className="math-overlay__casting">
              Casting{' '}
              <span style={{ color: spell.color }}>
                {spell.name}
              </span>{' '}
              ({ELEMENT_LABELS[spell.element]})
            </p>
            <h2 className="math-overlay__prompt">{equation.prompt}</h2>
            <p className="math-overlay__meta">Difficulty {equation.difficulty}</p>
            {feedback ? <p className="math-overlay__feedback">{feedback}</p> : null}
          </section>

          <section className="math-overlay__scratch">
            <DrawingBoard variant="overlay" />
          </section>
        </header>

        <form className="math-overlay__answer-bar" onSubmit={handleSubmit}>
          <label className="math-overlay__answer-label" htmlFor="spell-answer">
            Your answer
          </label>
          <input
            id="spell-answer"
            className="math-overlay__answer-input"
            type="number"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            placeholder="?"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="math-overlay__actions">
            <button type="button" className="math-overlay__cancel" onClick={onCancel}>
              Cancel
            </button>
            <label className="math-overlay__setting">
              <input
                type="checkbox"
                checked={settings.requireConfirmAnswer}
                onChange={(event) =>
                  gameSettings.setSetting('requireConfirmAnswer', event.target.checked)
                }
              />
              <span>Confirm before casting</span>
            </label>
            <button type="submit" className="math-overlay__submit" disabled={!canSubmit}>
              Cast Spell
            </button>
          </div>
        </form>
      </div>

      {showConfirmDialog ? (
        <div
          className="math-overlay__confirm-dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="math-confirm-title"
          aria-describedby="math-confirm-body"
        >
          <div className="math-overlay__confirm-card">
            <h3 id="math-confirm-title" className="math-overlay__confirm-title">
              Confirm your answer
            </h3>
            <p id="math-confirm-body" className="math-overlay__confirm-body">
              Cast <strong>{spell.name}</strong> with answer <strong>{answer}</strong>?
            </p>
            <div className="math-overlay__confirm-actions">
              <button
                type="button"
                className="math-overlay__confirm-back"
                onClick={() => setShowConfirmDialog(false)}
              >
                Go back
              </button>
              <button
                type="button"
                className="math-overlay__confirm-cast"
                onClick={submitAnswer}
              >
                Yes, cast spell
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
