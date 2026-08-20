export const GameConfig = {
  version: (import.meta.env.VITE_POLLI_VERSION as 'standard' | 'polli') ?? 'standard',
  width: 1280,
  height: 720,
  tileSize: 32,
  chunkSize: 64,
  maxEntities: 200,
  fixedTimestep: 1000 / 60,
  atlasKey: 'main',
  dataPath: 'assets/data/',
  LATEST_SAVE_VERSION: 1,
} as const;
