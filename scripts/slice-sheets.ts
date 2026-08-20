/**
 * slice-sheets.ts
 * Takes a sprite sheet PNG and slices it into individual frames.
 * Supports 8-direction animation sheets with configurable frame counts.
 * Outputs to src/assets/sliced/.
 *
 * Expected sheet layout: rows = directions (8), cols = frames per direction.
 * Default: 8 directions × 4 frames = 32 frames, each 32×32.
 *
 * Usage: pnpm tsx scripts/slice-sheets.ts [inputDir] [frameWidth] [frameHeight]
 */
import { existsSync, mkdirSync } from 'fs';
import { join, dirname, basename, extname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Dynamic import: sharp needs native binaries (libvips) — unavailable on some platforms
let sharp: any;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.log('[slice-sheets] sharp not available on this platform — nothing to do.');
  process.exit(0);
}
const { glob } = await import('glob');

const DIR_NAMES = ['down', 'down-left', 'left', 'up-left', 'up', 'up-right', 'right', 'down-right'] as const;

interface SliceResult {
  name: string;
  frames: number;
}

async function sliceSheet(
  inputPath: string,
  outputDir: string,
  frameW: number,
  frameH: number,
): Promise<SliceResult> {
  const meta = await sharp(inputPath).metadata();
  const sheetW = meta.width ?? 0;
  const sheetH = meta.height ?? 0;

  if (sheetW === 0 || sheetH === 0) {
    throw new Error(`Invalid image dimensions: ${sheetW}×${sheetH}`);
  }

  const cols = Math.floor(sheetW / frameW);
  const rows = Math.floor(sheetH / frameH);

  if (cols === 0 || rows === 0) {
    throw new Error(`Sheet too small for ${frameW}×${frameH} frames: ${sheetW}×${sheetH}`);
  }

  const sheetName = basename(inputPath, extname(inputPath));
  const sheetOutDir = join(outputDir, sheetName);
  mkdirSync(sheetOutDir, { recursive: true });

  let frameCount = 0;

  for (let row = 0; row < rows; row++) {
    const dirName = row < DIR_NAMES.length ? DIR_NAMES[row]! : `dir${row}`;
    for (let col = 0; col < cols; col++) {
      const left = col * frameW;
      const top = row * frameH;

      // Extract the frame region, but clamp to image bounds
      const extractW = Math.min(frameW, sheetW - left);
      const extractH = Math.min(frameH, sheetH - top);

      if (extractW <= 0 || extractH <= 0) continue;

      const outName = `${sheetName}_${dirName}_${col}.png`;
      const outPath = join(sheetOutDir, outName);

      await sharp(inputPath)
        .extract({ left, top, width: extractW, height: extractH })
        .resize(frameW, frameH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outPath);

      frameCount++;
    }
  }

  return { name: sheetName, frames: frameCount };
}

async function main(): Promise<void> {
  const inputDir = resolve(process.argv[2] ?? join(ROOT, 'src', 'assets', 'sheets'));
  const frameW = parseInt(process.argv[3] ?? '32', 10);
  const frameH = parseInt(process.argv[4] ?? '32', 10);
  const outputDir = join(ROOT, 'src', 'assets', 'sliced');

  if (!existsSync(inputDir)) {
    console.log(`[slice-sheets] Input dir not found: ${inputDir} — nothing to do.`);
    return;
  }

  mkdirSync(outputDir, { recursive: true });

  const files = await glob('**/*.png', { cwd: inputDir, absolute: true });
  if (files.length === 0) {
    console.log(`[slice-sheets] No PNG files found in ${inputDir} — nothing to do.`);
    return;
  }

  console.log(`[slice-sheets] Slicing ${files.length} sheet(s) at ${frameW}×${frameH}...`);
  let ok = 0;
  for (const f of files) {
    try {
      const result = await sliceSheet(f, outputDir, frameW, frameH);
      console.log(`  ✓ ${result.name}: ${result.frames} frames`);
      ok++;
    } catch (e: any) {
      console.error(`  ✗ ${basename(f)}: ${e.message}`);
    }
  }
  console.log(`[slice-sheets] Done. ${ok}/${files.length} sheets sliced → ${outputDir}`);
}

main().catch(e => { console.error('[slice-sheets] Fatal:', e.message); process.exit(0); });
