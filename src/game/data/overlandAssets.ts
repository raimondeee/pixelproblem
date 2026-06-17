import { assetUrl } from '@/utils/assetUrl';

export interface OverlandMapImage {
  id: string;
  name: string;
  url: string;
}

export const OVERLAND_MAP_IMAGES: OverlandMapImage[] = [
  {
    id: 'maptiles-test0',
    name: 'Maptiles Test 0',
    url: assetUrl('assets/overland/maptiles-test0.png'),
  },
  {
    id: 'maptiles-test1',
    name: 'Maptiles Test 1',
    url: assetUrl('assets/overland/maptiles-test1.png'),
  },
  {
    id: 'maptiles-test2',
    name: 'Maptiles Test 2',
    url: assetUrl('assets/overland/maptiles-test2.png'),
  },
  {
    id: 'maptiles-test3',
    name: 'Maptiles Test 3',
    url: assetUrl('assets/overland/maptiles-test3.png'),
  },
];

export function getOverlandImageById(id: string): OverlandMapImage | undefined {
  return OVERLAND_MAP_IMAGES.find((image) => image.id === id);
}
