import type { SaveData } from '@/data/schemas';

const DEFAULT_SETTINGS: SaveData['settings'] = {
  masterVolume: 1,
  sfxVolume: 1,
  musicVolume: 1,
  autoEvolve: false,
  analyticsOptIn: false,
  accessibility: {
    colorBlind: 'none',
    reducedMotion: false,
    highContrast: false,
    keyMap: {
      up: 'W',
      down: 'S',
      left: 'A',
      right: 'D',
    },
  },
};

export class SettingsManager {
  private settings: SaveData['settings'];

  constructor(saved?: Partial<SaveData['settings']>) {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...saved,
      accessibility: {
        ...DEFAULT_SETTINGS.accessibility,
        ...saved?.accessibility,
        keyMap: {
          ...DEFAULT_SETTINGS.accessibility.keyMap,
          ...saved?.accessibility?.keyMap,
        },
      },
    };
  }

  get<K extends keyof SaveData['settings']>(key: K): SaveData['settings'][K] {
    return this.settings[key];
  }

  set<K extends keyof SaveData['settings']>(key: K, value: SaveData['settings'][K]): void {
    this.settings[key] = value;
  }

  getAll(): SaveData['settings'] {
    return JSON.parse(JSON.stringify(this.settings));
  }
}
