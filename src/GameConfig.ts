const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const touchPoints = typeof navigator !== 'undefined' ? (navigator.maxTouchPoints ?? 0) : 0;
const smallSide = typeof window !== 'undefined' ? Math.min(window.innerWidth, window.innerHeight) : 1280;

/** Auto-detect phones/tablets: mobile UA, or multi-touch + small screen. */
export const IS_MOBILE =
  /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(ua) ||
  (touchPoints >= 1 && smallSide < 820);

export const GameConfig = {
  version: (import.meta.env.VITE_POLLI_VERSION as 'standard' | 'polli') ?? 'standard',
  // portrait for touch devices, landscape for desktop
  width: IS_MOBILE ? 720 : 1280,
  height: IS_MOBILE ? 1280 : 720,
  tileSize: 32,
  chunkSize: 64,
  maxEntities: 200,
  fixedTimestep: 1000 / 60,
  atlasKey: 'main',
  dataPath: 'assets/data/',
  LATEST_SAVE_VERSION: 1,
} as const;
