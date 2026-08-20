/**
 * atlas.ts
 * Assembles normalized and sliced assets into a single atlas PNG + Phaser JSON.
 * Reads from src/assets/normalized/ and src/assets/sliced/,
 * outputs to assets/atlases/main.png + main.json.
 *
 * No TexturePacker dependency — uses sharp to composite directly.
 *
 * Usage: pnpm tsx scripts/atlas.ts
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname, basename, extname, resolve } from 'path';
import { fileURLToPath } from 'url';

// sharp needs native binaries (libvips) — unavailable on some platforms (e.g. android-arm64)
let sharp: any;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.log('[atlas] sharp not available on this platform — nothing to do.');
  process.exit(0);
}
const { glob } = await import('glob');

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

interface Frame {
  name: string;
  path: string;
  width: number;
  height: number;
}

interface PackedFrame {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Simple shelf-packing: place frames left-to-right, wrap to next shelf. */
function packFrames(frames: Frame[], maxSize: number): { width: number; height: number; packed: PackedFrame[] } {
  // Sort by height descending for better packing
  const sorted = [...frames].sort((a, b) => b.height - a.height);

  const packed: PackedFrame[] = [];
  let x = 0;
  let y = 0;
  let shelfH = 0;
  let totalW = 0;
  let totalH = 0;

  for (const f of sorted) {
    // If frame doesn't fit in current shelf, start new shelf
    if (x + f.width > maxSize) {
      y += shelfH;
      x = 0;
      shelfH = 0;
    }
    // If frame doesn't fit vertically, we've exceeded max size
    if (y + f.height > maxSize) {
      console.warn(`[atlas] Warning: atlas exceeds ${maxSize}px, frame ${f.name} at ${x},${y}`);
    }

    packed.push({ name: f.name, x, y, w: f.width, h: f.height });
    x += f.width;
    shelfH = Math.max(shelfH, f.height);
    totalW = Math.max(totalW, x);
    totalH = Math.max(totalH, y + f.height);
  }

  // Round up to power of 2 for GPU friendliness
  const nextPow2 = (n: number) => { let p = 1; while (p < n) p *= 2; return p; };
  return { width: nextPow2(totalW), height: nextPow2(totalH), packed };
}

async function collectFrames(dirs: string[]): Promise<Frame[]> {
  const frames: Frame[] = [];

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    const files = await glob('**/*.png', { cwd: dir, absolute: true });
    for (const f of files) {
      try {
        const meta = await sharp(f).metadata();
        const w = meta.width ?? 32;
        const h = meta.height ?? 32;
        // Use relative path from dir as frame name, without extension
        const rel = f.slice(dir.length + 1).replace(/\.png$/, '').replace(/\\/g, '/');
        frames.push({ name: rel, path: f, width: w, height: h });
      } catch {
        // skip unreadable files
      }
    }
  }
  return frames;
}

async function main(): Promise<void> {
  const normalizedDir = join(ROOT, 'src', 'assets', 'normalized');
  const slicedDir = join(ROOT, 'src', 'assets', 'sliced');
  const outDir = join(ROOT, 'assets', 'atlases');

  const allFrames = await collectFrames([normalizedDir, slicedDir]);

  if (allFrames.length === 0) {
    // Generate a placeholder 2×2 transparent atlas so the build doesn't break
    console.log('[atlas] No frames found — generating placeholder atlas.');
    mkdirSync(outDir, { recursive: true });

    const placeholder = Buffer.alloc(2 * 2 * 4, 0); // 2x2 transparent
    await sharp(placeholder, { raw: { width: 2, height: 2, channels: 4 } })
      .png()
      .toFile(join(outDir, 'main.png'));

    const json = {
      frames: {} as Record<string, any>,
      meta: {
        app: 'flail-asset-pipeline',
        version: '1.0',
        image: 'main.png',
        format: 'RGBA8888',
        size: { w: 2, h: 2 },
        scale: '1',
      },
    };
    writeFileSync(join(outDir, 'main.json'), JSON.stringify(json, null, 2));
    console.log('[atlas] Placeholder atlas written → assets/atlases/');
    return;
  }

  console.log(`[atlas] Packing ${allFrames.length} frame(s)...`);

  const maxSize = 4096; // max atlas dimension
  const { width, height, packed } = packFrames(allFrames, maxSize);

  console.log(`[atlas] Atlas size: ${width}×${height}`);

  // Create the atlas canvas (transparent)
  const atlasPixels = Buffer.alloc(width * height * 4, 0);

  // Compose each frame onto the atlas
  const frameMap = new Map(allFrames.map(f => [f.name, f]));

  for (const p of packed) {
    const frame = frameMap.get(p.name);
    if (!frame) continue;

    try {
      const frameBuf = await sharp(frame.path)
        .resize(p.w, p.h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .raw()
        .toBuffer();

      // Copy pixels into atlas
      for (let row = 0; row < p.h; row++) {
        const srcOff = row * p.w * 4;
        const dstOff = ((p.y + row) * width + p.x) * 4;
        frameBuf.copy(atlasPixels, dstOff, srcOff, srcOff + p.w * 4);
      }
    } catch (e: any) {
      console.warn(`[atlas] Failed to pack ${p.name}: ${e.message}`);
    }
  }

  mkdirSync(outDir, { recursive: true });

  // Write atlas PNG
  await sharp(atlasPixels, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(join(outDir, 'main.png'));

  // Build Phaser JSON Hash format
  const framesJson: Record<string, any> = {};
  for (const p of packed) {
    framesJson[p.name] = {
      frame: { x: p.x, y: p.y, w: p.w, h: p.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: p.w, h: p.h },
      sourceSize: { w: p.w, h: p.h },
    };
  }

  const json = {
    frames: framesJson,
    meta: {
      app: 'flail-asset-pipeline',
      version: '1.0',
      image: 'main.png',
      format: 'RGBA8888',
      size: { w: width, h: height },
      scale: '1',
    },
  };

  writeFileSync(join(outDir, 'main.json'), JSON.stringify(json, null, 2));

  const pngSize = (await sharp(join(outDir, 'main.png')).metadata()).size ?? 0;
  console.log(`[atlas] Done. ${packed.length} frames → assets/atlases/main.png (${(pngSize / 1024).toFixed(1)} KB) + main.json`);
  if (pngSize > 4 * 1024 * 1024) {
    console.warn('[atlas] ⚠ Atlas exceeds 4MB target!');
  }
}

main().catch(e => { console.error('[atlas] Fatal:', e.message); process.exit(0); });
