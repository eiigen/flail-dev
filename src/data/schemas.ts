import { z } from 'zod';
import { StatsSchema, ItemReqSchema } from '@/components/types';

export const CharacterDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  backstory: z.string(),
  spriteKey: z.string(),
  baseStats: StatsSchema,
  startingWeaponId: z.string(),
  passives: z.array(z.object({ id: z.string(), params: z.record(z.unknown()) })),
  actives: z.array(z.object({ id: z.string(), cooldown: z.number(), params: z.record(z.unknown()) })),
  traits: z.array(z.object({ id: z.string(), params: z.record(z.unknown()) })),
  unlockReq: z.object({
    type: z.enum(['kill_enemies', 'reach_wave', 'evolve_weapon', 'find_secret', 'default']),
    target: z.string(),
    count: z.number().int().nonnegative(),
  }),
});
export type CharacterDef = z.infer<typeof CharacterDefSchema>;

export const WeaponDefSchema = z.object({
  id: z.string(),
  type: z.enum(['projectile', 'aoe', 'beam', 'summon', 'melee']),
  name: z.string(),
  projectileKey: z.string().optional(),
  damage: z.number(),
  cooldown: z.number(),
  range: z.number(),
  count: z.number().int().positive(),
  spread: z.number(),
  pierce: z.number().int().nonnegative(),
  speed: z.number(),
  areaRadius: z.number().optional(),
  duration: z.number().optional(),
  evolutionRecipeId: z.string().optional(),
});
export type WeaponDef = z.infer<typeof WeaponDefSchema>;

export const RecipeSchema = z.object({
  id: z.string(),
  tier: z.number().int().min(1).max(4),
  requires: z.array(ItemReqSchema),
  result: z.string(),
  resultName: z.string(),
  autoUnlock: z.boolean().optional(),
});
export type Recipe = z.infer<typeof RecipeSchema>;

export const EnemyDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  spriteKey: z.string(),
  hp: z.number(),
  dmg: z.number(),
  speed: z.number(),
  xp: z.number(),
  lootTable: z.array(z.string()),
  aiType: z.enum(['melee', 'ranged', 'boss']),
  animations: z.record(z.string(), z.object({ frames: z.number(), frameRate: z.number() })),
});
export type EnemyDef = z.infer<typeof EnemyDefSchema>;

export const BossDialogueSchema = z.object({
  id: z.string(),
  name: z.string(),
  variants: z.array(z.string()).length(5),
});
export type BossDialogue = z.infer<typeof BossDialogueSchema>;

export const BiomeDefSchema = z.object({
  name: z.string(),
  tileKey: z.string(),
  enemyTable: z.array(z.string()),
  ambientTrack: z.string(),
  colorGrade: z.string(),
  regionName: z.string(),
});
export type BiomeDef = z.infer<typeof BiomeDefSchema>;

export const WaveDefSchema = z.object({
  index: z.number().int().nonnegative(),
  enemyCounts: z.record(z.string(), z.number().int().nonnegative()),
  eliteChance: z.number().min(0).max(1),
  bossWave: z.boolean().optional(),
  bossId: z.string().optional(),
  duration: z.number().optional(),
});
export type WaveDef = z.infer<typeof WaveDefSchema>;

export const MapDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  theme: z.string(),
  biomePalette: z.array(BiomeDefSchema),
  waves: z.array(WaveDefSchema),
  bosses: z.array(z.string()),
  musicTrack: z.string(),
  difficulty: z.enum(['normal', 'hard', 'nightmare']),
  endless: z.boolean().optional(),
});
export type MapDef = z.infer<typeof MapDefSchema>;

export const AchievementDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  desc: z.string(),
  condition: z.object({ type: z.string(), params: z.record(z.unknown()) }),
  reward: z.object({ charId: z.string().optional(), itemId: z.string().optional() }),
});
export type AchievementDef = z.infer<typeof AchievementDefSchema>;

export const AudioDefSchema = z.object({
  music: z.record(z.string(), z.string()),
  sfx: z.record(z.string(), z.string()),
  mapMusic: z.record(z.string(), z.string()),
  regionFilter: z.record(z.string(), z.object({ freq: z.number(), gain: z.number() })),
});
export type AudioDef = z.infer<typeof AudioDefSchema>;

export const PolliItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['weapon', 'consumable', 'relic', 'curse', 'blessing']),
  rarity: z.enum(['common', 'rare', 'epic', 'legendary']),
  stats: z.record(z.number()),
  description: z.string(),
  iconKey: z.string(),
});
export type PolliItem = z.infer<typeof PolliItemSchema>;

export const PolliFallbackSchema = z.object({
  items: z.array(PolliItemSchema),
});
export type PolliFallback = z.infer<typeof PolliFallbackSchema>;

export const SaveDataSchema = z.object({
  version: z.number().int().positive(),
  unlockedChars: z.array(z.string()),
  achievements: z.record(z.object({ unlocked: z.boolean(), progress: z.number().optional() })),
  currentRun: z
    .object({ runId: z.string(), mapId: z.string(), charId: z.string(), wave: z.number(), time: z.number() })
    .optional(),
  settings: z.object({
    masterVolume: z.number().min(0).max(1),
    sfxVolume: z.number().min(0).max(1),
    musicVolume: z.number().min(0).max(1),
    autoEvolve: z.boolean().optional(),
    analyticsOptIn: z.boolean().optional(),
    polliAccessToken: z.string().optional(),
    polliRefreshToken: z.string().optional(),
    polliModelPrefs: z.object({ image: z.string(), text: z.string() }).optional(),
    accessibility: z.object({
      colorBlind: z.enum(['none', 'deuteranope', 'protanope']),
      reducedMotion: z.boolean(),
      highContrast: z.boolean(),
      keyMap: z.record(z.string()),
    }),
  }),
});
export type SaveData = z.infer<typeof SaveDataSchema>;
