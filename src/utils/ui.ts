import { IS_MOBILE } from '@/GameConfig';

const FACTOR = IS_MOBILE ? 1.35 : 1;
/** Scale a UI metric (font px, button size) up on mobile for readability. */
export function ui(n: number): number {
  return Math.round(n * FACTOR);
}
