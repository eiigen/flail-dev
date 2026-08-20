import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 10 themed maps. Map 10 = endless (no boss, no fixed waves).
const themes = [
  { id: 'cursed_forest', name: 'Cursed Forest', theme: 'forest', boss: 'forest_warden', difficulty: 'normal',
    enemies: ['skeleton', 'goblin', 'slime', 'gargoyle'], color: '#1a3d1a', tile: 'biome_forest' },
  { id: 'crimson_fen', name: 'Crimson Fen', theme: 'swamp', boss: 'crimson_lord', difficulty: 'normal',
    enemies: ['zombie', 'goblin', 'witch', 'toxic_spider'], color: '#3d1a1a', tile: 'biome_swamp' },
  { id: 'bone_spire', name: 'Bone Spire', theme: 'bones', boss: 'bone_sovereign', difficulty: 'normal',
    enemies: ['skeleton', 'dark_knight', 'necromancer', 'gargoyle'], color: '#3d3d1a', tile: 'biome_bones' },
  { id: 'plague_hollow', name: 'Plague Hollow', theme: 'plague', boss: 'plague_baron', difficulty: 'hard',
    enemies: ['plague_rat', 'toxic_spider', 'zombie', 'necromancer'], color: '#2d3d1a', tile: 'biome_plague' },
  { id: 'frozen_fortress', name: 'Frozen Fortress', theme: 'frost', boss: 'frost_empress', difficulty: 'hard',
    enemies: ['frost_spirit', 'ice_golem', 'wraith', 'slime'], color: '#1a2d3d', tile: 'biome_frost' },
  { id: 'shadow_keep', name: 'Shadow Keep', theme: 'shadow', boss: 'shadow_king', difficulty: 'hard',
    enemies: ['shadow_wraith', 'banshee', 'wraith', 'witch'], color: '#1a1a2d', tile: 'biome_shadow' },
  { id: 'ember_depths', name: 'Ember Depths', theme: 'fire', boss: 'inferno_duke', difficulty: 'hard',
    enemies: ['flame_imp', 'lava_beast', 'goblin', 'gargoyle'], color: '#3d2d1a', tile: 'biome_fire' },
  { id: 'abyssal_trench', name: 'Abyssal Trench', theme: 'abyss', boss: 'abyss_tyrant', difficulty: 'nightmare',
    enemies: ['void_spawn', 'abyss_horror', 'wraith', 'dark_knight'], color: '#0f1a2d', tile: 'biome_abyss' },
  { id: 'storm_pinnacle', name: 'Storm Pinnacle', theme: 'storm', boss: 'storm_herald', difficulty: 'nightmare',
    enemies: ['storm_elemental', 'peak_giant', 'gargoyle', 'flame_imp'], color: '#2d3d3d', tile: 'biome_storm' },
  { id: 'void_endless', name: 'The Endless Void', theme: 'void', boss: 'void_reaper', difficulty: 'nightmare',
    enemies: ['void_spawn', 'abyss_horror', 'shadow_wraith', 'banshee'], color: '#0a0a1a', tile: 'biome_void' },
];

function makeBiome(i: number, theme: (typeof themes)[0], variant: number): any {
  const en = theme.enemies;
  const region = [
    `${theme.name.split(' ')[0]} Heart`,
    `${theme.name.split(' ')[0]} Edge`,
    `${theme.name.split(' ')[0]} Deep`,
  ][variant] ?? `${theme.name.split(' ')[0]} ${i}`;
  return {
    name: `${theme.theme}_${variant}`,
    tileKey: `${theme.tile}_${variant}`,
    enemyTable: [en[variant % en.length]!, en[(variant + 1) % en.length]!, en[(variant + 2) % en.length]!],
    ambientTrack: `ambient_${theme.theme}_${variant}`,
    colorGrade: theme.color,
    regionName: region,
  };
}

function makeWaves(boss: string, endless: boolean): any[] {
  if (endless) {
    // endless map: a few warm-up waves, no boss wave
    return [
      { index: 0, enemyCounts: { skeleton: 6 }, eliteChance: 0.05 },
      { index: 1, enemyCounts: { goblin: 8 }, eliteChance: 0.08 },
      { index: 2, enemyCounts: { slime: 10 }, eliteChance: 0.1 },
    ];
  }
  return [
    { index: 0, enemyCounts: { skeleton: 8, goblin: 4 }, eliteChance: 0.05 },
    { index: 1, enemyCounts: { slime: 6, zombie: 5 }, eliteChance: 0.08 },
    { index: 2, enemyCounts: { goblin: 10, witch: 4 }, eliteChance: 0.1, duration: 35000 },
    { index: 3, enemyCounts: { skeleton: 12, necromancer: 3 }, eliteChance: 0.12, duration: 40000 },
    { index: 4, enemyCounts: { dark_knight: 8, gargoyle: 6 }, eliteChance: 0.15, bossWave: true, bossId: boss, duration: 30000 },
  ];
}

const maps = themes.map((t, idx) => {
  const endless = idx === 9; // last map
  return {
    id: t.id,
    name: t.name,
    theme: t.theme,
    biomePalette: [makeBiome(0, t, 0), makeBiome(1, t, 1), makeBiome(2, t, 2)],
    waves: makeWaves(t.boss, endless),
    bosses: endless ? [] : [t.boss],
    musicTrack: `music_${t.theme}`,
    difficulty: t.difficulty,
    ...(endless ? { endless: true } : {}),
  };
});

const target = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'maps.json');
writeFileSync(target, JSON.stringify({ maps }, null, 2));
console.log(`Wrote ${maps.length} maps`);
