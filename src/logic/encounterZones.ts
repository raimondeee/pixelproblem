import type { SpellElement } from '@/game/types';
import { getEnemySpriteUrl } from '@/game/types';
import type { EncounterZone } from '@/game/types/overlandMap';

const ELEMENTS: SpellElement[] = ['fire', 'water', 'earth', 'wind'];

export const DEFAULT_ENCOUNTER_RADIUS = 0.035;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandomElement(): SpellElement {
  return ELEMENTS[randomInt(0, ELEMENTS.length - 1)];
}

export function createEncounterZoneId(): string {
  return `encounter-${crypto.randomUUID().slice(0, 8)}`;
}

export function getEncounterSpriteUrl(zone: EncounterZone): string {
  return getEnemySpriteUrl(zone.element, zone.variant);
}

export function createRandomEncounterZone(position: { x: number; y: number }): EncounterZone {
  return {
    id: createEncounterZoneId(),
    position,
    radius: DEFAULT_ENCOUNTER_RADIUS,
    element: pickRandomElement(),
    variant: randomInt(1, 6),
  };
}

export function rerollEncounterZoneMonster(zone: EncounterZone): EncounterZone {
  return {
    ...zone,
    element: pickRandomElement(),
    variant: randomInt(1, 6),
  };
}

export function getEncounterZoneAt(
  zones: EncounterZone[] | undefined,
  imageX: number,
  imageY: number,
  imageWidth: number,
  imageHeight: number,
): EncounterZone | undefined {
  if (!zones?.length) {
    return undefined;
  }

  const scale = Math.min(imageWidth, imageHeight);

  for (const zone of zones) {
    const centerX = zone.position.x * imageWidth;
    const centerY = zone.position.y * imageHeight;
    const radius = zone.radius * scale;
    const dx = imageX - centerX;
    const dy = imageY - centerY;

    if (dx * dx + dy * dy <= radius * radius) {
      return zone;
    }
  }

  return undefined;
}

export function isPlayerInEncounterZone(
  zones: EncounterZone[] | undefined,
  imageX: number,
  imageY: number,
  imageWidth: number,
  imageHeight: number,
): boolean {
  return getEncounterZoneAt(zones, imageX, imageY, imageWidth, imageHeight) !== undefined;
}
