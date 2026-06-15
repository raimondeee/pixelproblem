import { NUMBER_LINE_MAX, NUMBER_LINE_MIN } from './constants';

interface ScratchPadOverlaysProps {
  showGrid: boolean;
  showDots: boolean;
  showNumberLine: boolean;
}

export function ScratchPadOverlays({
  showGrid,
  showDots,
  showNumberLine,
}: ScratchPadOverlaysProps) {
  const ticks = Array.from(
    { length: NUMBER_LINE_MAX - NUMBER_LINE_MIN + 1 },
    (_, index) => NUMBER_LINE_MIN + index,
  );

  return (
    <div
      className={`scratch-overlays ${showGrid || showDots ? 'scratch-overlays--patterned' : ''}`}
      aria-hidden="true"
    >
      {showGrid ? <div className="scratch-overlays__grid" /> : null}
      {showDots ? <div className="scratch-overlays__dots" /> : null}

      {showNumberLine ? (
        <div className="scratch-overlays__number-line">
          <div className="scratch-overlays__number-line-axis" />
          <div className="scratch-overlays__number-line-ticks">
            {ticks.map((value) => (
              <div key={value} className="scratch-overlays__number-line-tick">
                <span className="scratch-overlays__number-line-mark" />
                <span className="scratch-overlays__number-line-label">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
