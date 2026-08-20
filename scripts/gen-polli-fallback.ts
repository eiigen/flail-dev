import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const types = ['weapon', 'consumable', 'relic', 'curse', 'blessing'] as const;
const rarities = ['common', 'rare', 'epic', 'legendary'] as const;
const prefixes = ['Ancient', 'Cursed', 'Gilded', 'Frostbound', 'Embered', 'Shadowed', 'Radiant', 'Rusted', 'Verdant', 'Hollow', 'Sanguine', 'Stellar', 'Umbral', 'Crimson', 'Feral'];
const nouns = ['Blade', 'Orb', 'Tome', 'Dagger', 'Charm', 'Vial', 'Relic', 'Sigil', 'Wand', 'Mask', 'Chalice', 'Gauntlet', 'Halo', 'Crown', 'Totem', 'Amulet', 'Rune', 'Phial', 'Talon'];
const flavors = ['Forged in a forgotten age.', 'It hums with a sound just below hearing.', 'The dark leans toward it.', 'A gift from a god who has forgotten you.', 'It remembers the hand that held it.', 'Warm to the touch, colder to the soul.', 'It does not wish to be used.', 'The light in it is not light.', 'It was never lost. It was waiting.', 'To hold it is to be held.'];

const out: { id: string; name: string; type: typeof types[number]; rarity: typeof rarities[number]; stats: Record<string, number>; description: string; iconKey: string }[] = [];

let seed = 20250819;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return (seed % 1000) / 1000;
};
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;

for (let i = 0; i < 220; i++) {
  const type = pick(types);
  const rarity = pick(rarities);
  const name = `${pick(prefixes)} ${pick(nouns)}`;
  const stats: Record<string, number> = {};
  const keys = ['hp', 'atk', 'spd', 'crit', 'luck'];
  for (const k of keys) {
    if (rand() > 0.4) stats[k] = Math.floor(rand() * 20) + 1;
  }
  out.push({
    id: `polli_fb_${i.toString().padStart(3, '0')}`,
    name,
    type,
    rarity,
    stats,
    description: pick(flavors),
    iconKey: `polli_fb_${i.toString().padStart(3, '0')}`,
  });
}

const target = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'polli-fallback.json');
const dir = dirname(target);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
writeFileSync(target, JSON.stringify({ items: out }, null, 2));
console.log(`Wrote ${out.length} polli fallback items`);
