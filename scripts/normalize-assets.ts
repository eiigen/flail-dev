/**
 * normalize-assets.ts
 * Reads raw PNGs from an input dir (default src/assets/raw, configurable via arg),
 * normalizes each to 32×32 with a 1px dark outline and quantizes to a 32-color
 * DB32-ish palette, writes to src/assets/normalized/.
 *
 * Usage: pnpm tsx scripts/normalize-assets.ts [inputDir]
 */
import { existsSync, mkdirSync } from 'fs';
import { join, dirname, basename, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Dynamic import: sharp needs native binaries (libvips) — unavailable on some platforms
let sharp: any;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.log('[normalize-assets] sharp not available on this platform — nothing to do.');
  process.exit(0);
}
const { glob } = await import('glob');

// DB32 palette (approximate) — 32 colors used by pixel-art community
const DB32 = [
  [0, 0, 0], [34, 32, 52], [69, 40, 60], [102, 57, 49],
  [143, 86, 59], [223, 113, 38], [217, 160, 102], [238, 195, 154],
  [251, 242, 54], [153, 229, 80], [106, 190, 48], [55, 148, 110],
  [75, 105, 47], [82, 75, 36], [50, 60, 57], [63, 63, 116],
  [48, 96, 130], [91, 110, 225], [99, 155, 255], [91, 207, 250],
  [203, 219, 252], [255, 255, 255], [155, 173, 183], [132, 126, 135],
  [105, 106, 106], [89, 86, 82], [118, 66, 138], [172, 50, 50],
  [217, 87, 99], [215, 123, 186], [143, 151, 74], [138, 111, 48],
];

/** Find the closest DB32 color for a given RGB pixel. */
function closestDb32(r: number, g: number, b: number): [number, number, number] {
  let best = DB32[0]!;
  let bestDist = Infinity;
  for (const c of DB32) {
    const dr = r - c[0]!, dg = g - c[1]!, db = b - c[2]!;
    const d = dr * dr + dg * dg + db * db;
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best as [number, number, number];
}

async function normalizeImage(inputPath: string, outputPath: string): Promise<void> {
  const SIZE = 32;

  // Read, resize to 32x32 (fit contain with transparent bg)
  const resized = await sharp(inputPath)
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = resized;
  const pixels = Buffer.alloc(SIZE * SIZE * 4);

  // Step 1: Quantize to DB32 palette
  for (let i = 0; i < SIZE * SIZE; i++) {
    const off = i * 4;
    const a = data[off + 3]!;
    if (a < 128) {
      // Transparent pixel — leave transparent
      pixels[off] = 0; pixels[off + 1] = 0; pixels[off + 2] = 0; pixels[off + 3] = 0;
    } else {
      const [r, g, b] = closestDb32(data[off]!, data[off + 1]!, data[off + 2]!);
      pixels[off] = r; pixels[off + 1] = g; pixels[off + 2] = b; pixels[off + 3] = 255;
    }
  }

  // Step 2: Add 1px dark outline around non-transparent pixels
  // We draw a 1px outline by checking neighbors: if a pixel is transparent but
  // has an opaque neighbor, it becomes a dark outline pixel.
  const outlined = Buffer.from(pixels); // copy
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const off = (y * SIZE + x) * 4;
      if (pixels[off + 3]! > 0) continue; // only process transparent pixels
      // Check 4 neighbors
      let hasOpaqueNeighbor = false;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nx = x + dx!, ny = y + dy!;
        if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE) continue;
        const noff = (ny * SIZE + nx) * 4;
        if (pixels[noff + 3]! > 0) { hasOpaqueNeighbor = true; break; }
      }
      if (hasOpaqueNeighbor) {
        // Dark outline color: closest DB32 to very dark
        outlined[off] = 34; outlined[off + 1] = 32; outlined[off + 2] = 52; outlined[off + 3] = 255;
      }
    }
  }

  // Write output
  await sharp(outlined, { raw: { width: SIZE, height: SIZE, channels: 4 } })
    .png()
    .toFile(outputPath);
}

async function main(): Promise<void> {
  const inputDir = resolve(process.argv[2] ?? join(ROOT, 'src', 'assets', 'raw'));
  const outputDir = join(ROOT, 'src', 'assets', 'normalized');

  if (!existsSync(inputDir)) {
    console.log(`[normalize-assets] Input dir not found: ${inputDir} — nothing to do.`);
    return;
  }

  mkdirSync(outputDir, { recursive: true });

  const files = await glob('**/*.png', { cwd: inputDir, absolute: true });
  if (files.length === 0) {
    console.log(`[normalize-assets] No PNG files found in ${inputDir} — nothing to do.`);
    return;
  }

  console.log(`[normalize-assets] Processing ${files.length} image(s)...`);
  let ok = 0;
  for (const f of files) {
    const name = basename(f);
    const out = join(outputDir, name);
    try {
      await normalizeImage(f, out);
      ok++;
    } catch (e: any) {
      console.error(`[normalize-assets] Failed on ${name}: ${e.message}`);
    }
  }
  console.log(`[normalize-assets] Done. ${ok}/${files.length} normalized → ${outputDir}`);
}

main().catch(e => { console.error('[normalize-assets] Fatal:', e.message); process.exit(0); });
