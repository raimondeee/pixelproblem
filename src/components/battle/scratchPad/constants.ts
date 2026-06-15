export const SCRATCH_COLORS = [
  { id: 'ink', value: '#1a1a2e', label: 'Black' },
  { id: 'red', value: '#e63946', label: 'Red' },
  { id: 'blue', value: '#2563eb', label: 'Blue' },
  { id: 'green', value: '#16a34a', label: 'Green' },
  { id: 'orange', value: '#f97316', label: 'Orange' },
  { id: 'purple', value: '#9333ea', label: 'Purple' },
  { id: 'brown', value: '#854d0e', label: 'Brown' },
  { id: 'pink', value: '#ec4899', label: 'Pink' },
] as const;

export const MAX_CUBE_STACK = 10;

export const NUMBER_LINE_MIN = 0;
export const NUMBER_LINE_MAX = 20;

export type ScratchTool = 'pen' | 'eraser' | 'ruler' | 'cubes';

export interface ScratchPoint {
  x: number;
  y: number;
}
