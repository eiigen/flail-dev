import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as schemas from '../src/data/schemas';

const files: Record<string, string> = {
  'characters': 'CharacterDef',
  'weapons': 'WeaponDef',
  'recipes': 'Recipe',
  'maps': 'MapDef',
  'enemies': 'EnemyDef',
  'bosses': 'BossDialogue',
  'achievements': 'AchievementDef',
  'audio': 'AudioDef',
  'polli-fallback': 'PolliFallback',
};

let failures = 0;
const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');

for (const [name, schemaName] of Object.entries(files)) {
  const file = join(dataDir, `${name}.json`);
  if (!existsSync(file)) {
    console.warn(`⚠ ${name}.json not found, skipping`);
    continue;
  }
  const schema = (schemas as any)[`${schemaName}Schema`];
  if (!schema) {
    console.warn(`⚠ No schema ${schemaName}Schema, skipping`);
    continue;
  }
  try {
    const raw = JSON.parse(readFileSync(file, 'utf-8'));
    // Try validating raw directly (e.g. PolliFallback = { items: [...] }).
    // If that fails and it is a single-key array-wrap, validate each item instead.
    const keys = Object.keys(raw);
    const firstKey = keys[0]!;
    const isArrayWrap = keys.length === 1 && Array.isArray(raw[firstKey]);
    try {
      schema.parse(raw);
      const count = isArrayWrap ? (raw[firstKey] as any[]).length : 1;
      console.log(`✓ ${name} (${count} items)`);
    } catch {
      if (!isArrayWrap) throw new Error('raw validation failed and not an array wrap');
      for (const item of raw[firstKey] as any[]) {
        schema.parse(item);
      }
      console.log(`✓ ${name} (${(raw[firstKey] as any[]).length} items)`);
    }
  } catch (e: any) {
    console.error(`✗ ${name}: ${e.message}`);
    failures++;
  }
}

if (failures > 0) {
  console.error(`\n${failures} file(s) failed validation`);
  process.exit(1);
}
console.log('\nAll data files valid');
