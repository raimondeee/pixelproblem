import { useEffect, useState } from 'react';
import { LOADING_SCREEN_URL } from '@/game/data/players';
import { preloadGameAssets } from '@/logic/assetPreloader';
import './LoadingScreen.css';

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Summoning sprites…');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        await preloadGameAssets((value) => {
          if (!cancelled) {
            setProgress(value);
            if (value < 35) setStatus('Summoning sprites…');
            else if (value < 70) setStatus('Loading spells & pets…');
            else setStatus('Preparing the forest…');
          }
        });
      } finally {
        if (!cancelled) {
          onComplete();
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [onComplete]);

  return (
    <div className="loading-screen">
      <img
        className="loading-screen__art"
        src={LOADING_SCREEN_URL}
        alt="Pixel Problems loading artwork"
      />

      <div className="loading-screen__overlay">
        <div className="loading-screen__brand">
          <p className="loading-screen__eyebrow">Pixel Problems</p>
          <h1 className="loading-screen__title">Adventure Awaits</h1>
        </div>

        <div className="loading-screen__progress-wrap">
          <div className="loading-screen__progress-track" aria-hidden="true">
            <span
              className="loading-screen__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="loading-screen__status">
            {status} {progress}%
          </p>
        </div>
      </div>
    </div>
  );
}
