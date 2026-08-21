import { openDB } from 'idb';
import { SaveDataSchema, type SaveData } from '@/data/schemas';
import { GameConfig } from '@/GameConfig';

const LS_KEY = 'flail_save';
const DB_NAME = 'flail';
const STORE = 'saves';

export class SaveManager {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  get current(): SaveData {
    return this.data;
  }

  /** localStorage is primary (sync); IndexedDB is the durable mirror. */
  private load(): SaveData {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(LS_KEY);
    } catch {
      /* private mode */
    }
    if (!raw) return this.defaults();
    try {
      const parsed = SaveDataSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) return this.defaults();
      return this.migrate(parsed.data);
    } catch {
      return this.defaults();
    }
  }

  /** ponytail: single-step migration; add vN→vN+1 cases as schema evolves */
  private migrate(data: SaveData): SaveData {
    if (data.version >= GameConfig.LATEST_SAVE_VERSION) return data;
    // v1 -> v2: introduce meta progression
    if (!data.meta) {
      data.meta = { coins: 0, upgrades: {}, beatenMaps: [] };
    }
    data.version = GameConfig.LATEST_SAVE_VERSION;
    return data;
  }

  private defaults(): SaveData {
    return SaveDataSchema.parse({
      version: GameConfig.LATEST_SAVE_VERSION,
      unlockedChars: ['adept'],
      achievements: {},
      meta: { coins: 0, upgrades: {}, beatenMaps: [] },
      settings: {
        masterVolume: 1, sfxVolume: 1, musicVolume: 1,
        autoEvolve: false, analyticsOptIn: false,
        accessibility: {
          colorBlind: 'none', reducedMotion: false, highContrast: false,
          keyMap: { up: 'W', down: 'S', left: 'A', right: 'D' },
        },
      },
    });
  }

  save(): void {
    const json = JSON.stringify(this.data);
    try {
      localStorage.setItem(LS_KEY, json);
    } catch {
      /* quota/private mode — IDB mirror still runs */
    }
    void this.mirror(json);
  }

  private async mirror(json: string): Promise<void> {
    try {
      const db = await openDB(DB_NAME, 1, {
        upgrade(d) { d.createObjectStore(STORE); },
      });
      await db.put(STORE, json, 'latest');
    } catch {
      /* IDB unavailable — localStorage already holds the truth */
    }
  }

  /** Restore from the IDB mirror when localStorage was lost (e.g. cleared). */
  async restoreFromIdb(): Promise<boolean> {
    try {
      const db = await openDB(DB_NAME, 1, {
        upgrade(d) { d.createObjectStore(STORE); },
      });
      const json = await db.get(STORE, 'latest');
      if (!json || typeof json !== 'string') return false;
      const parsed = SaveDataSchema.safeParse(JSON.parse(json));
      if (!parsed.success) return false;
      this.data = this.migrate(parsed.data);
      this.save();
      return true;
    } catch {
      return false;
    }
  }
}
