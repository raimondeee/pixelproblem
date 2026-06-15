export type FormationRow = 'back' | 'mid' | 'front';

export const FORMATION_ROW_ORDER: FormationRow[] = ['back', 'mid', 'front'];

export const DEPTH_SCALE: Record<FormationRow, number> = {
  back: 1,
  mid: 1.5,
  front: 2,
};

export const DEPTH_LABELS: Record<FormationRow, string> = {
  back: 'Back',
  mid: 'Mid',
  front: 'Front',
};

export function cycleFormationRow(row: FormationRow): FormationRow {
  const index = FORMATION_ROW_ORDER.indexOf(row);
  return FORMATION_ROW_ORDER[(index + 1) % FORMATION_ROW_ORDER.length];
}

export function depthClassForRow(row: FormationRow): 'far' | 'mid' | 'near' {
  switch (row) {
    case 'back':
      return 'far';
    case 'mid':
      return 'mid';
    case 'front':
      return 'near';
  }
}
