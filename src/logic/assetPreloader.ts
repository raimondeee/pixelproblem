import { LOADING_SCREEN_URL, PLAYER_ROSTER } from '@/game/data/players';
import { BATTLE_MAP_URL } from '@/game/data/assets';
import { SPELL_CATALOG } from '@/game/data/spells';
import { getEnemySpriteUrl } from '@/game/types';

const MIN_LOADING_MS = 2200;

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Failed to load ${url}`));
    image.src = url;
  });
}

function collectAssetUrls(): string[] {
  const urls = new Set<string>([LOADING_SCREEN_URL]);

  PLAYER_ROSTER.forEach((character) => urls.add(character.spriteUrl));

  SPELL_CATALOG.forEach((spell) => {
    urls.add(spell.cardUrl);
    urls.add(spell.projectileUrl);
  });

  urls.add(BATTLE_MAP_URL);

  for (const element of ['fire', 'water', 'earth', 'wind'] as const) {
    for (let variant = 1; variant <= 6; variant += 1) {
      urls.add(getEnemySpriteUrl(element, variant));
    }
  }

  return [...urls];
}

export async function preloadGameAssets(
  onProgress: (progress: number) => void,
): Promise<void> {
  const urls = collectAssetUrls();
  let loaded = 0;

  const loadPromise = Promise.all(
    urls.map(async (url) => {
      try {
        await preloadImage(url);
      } catch {
        // Continue loading even if an optional asset fails.
      } finally {
        loaded += 1;
        onProgress(Math.round((loaded / urls.length) * 100));
      }
    }),
  );

  const minDelay = new Promise<void>((resolve) => {
    window.setTimeout(resolve, MIN_LOADING_MS);
  });

  await Promise.all([loadPromise, minDelay]);
  onProgress(100);
}
