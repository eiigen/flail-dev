/**
 * process-assets.ts
 * Pipeline runner: normalize → slice → atlas.
 * Calls each step in sequence. Entry point for the full asset pipeline.
 *
 * Usage: pnpm tsx scripts/process-assets.ts [rawInputDir] [sheetsInputDir]
 */
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function run(label: string, cmd: string): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[pipeline] ${label}`);
  console.log(`${'='.repeat(60)}`);
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
  } catch (e: any) {
    console.error(`[pipeline] ${label} failed (exit ${e.status ?? '?'}). Continuing...`);
  }
}

async function main(): Promise<void> {
  const rawDir = process.argv[2] ?? '';
  const sheetsDir = process.argv[3] ?? '';

  const normalizeArgs = rawDir ? ` ${rawDir}` : '';
  const sliceArgs = sheetsDir ? ` ${sheetsDir}` : '';

  console.log('[pipeline] Starting asset pipeline: normalize → slice → atlas');

  run('Normalize assets', `pnpm tsx scripts/normalize-assets.ts${normalizeArgs}`);
  run('Slice sprite sheets', `pnpm tsx scripts/slice-sheets.ts${sliceArgs}`);
  run('Build atlas', 'pnpm tsx scripts/atlas.ts');

  console.log(`\n${'='.repeat(60)}`);
  console.log('[pipeline] Asset pipeline complete.');
  console.log(`${'='.repeat(60)}`);
}

main().catch(e => { console.error('[pipeline] Fatal:', e.message); process.exit(0); });
