import Phaser from 'phaser';
import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import { SimplexNoise } from '@/utils/SimplexNoise';
import { GameConfig } from '@/GameConfig';
import type { CAI } from '@/components/CAI';
import type { CTransform } from '@/components/CTransform';

/**
 * Chunked infinite floor. Each chunk is baked ONCE into a RenderTexture so the
 * scene graph holds ~1 object per chunk instead of 64 tile images.
 */
export class MapGenSystem implements System {
  name = 'MapGenSystem';
  private seed = 0;
  private generated = new Set<string>();
  private chunks = new Map<string, Phaser.GameObjects.RenderTexture>();
  private noise: SimplexNoise | null = null;
  private scene: Phaser.Scene;
  private readonly CHUNK = 8;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  init(world: World): void {
    world.on('map-start', (data: { mapId: string; seed: string }) => {
      this.seed = hashSeed(data.seed + data.mapId);
      this.noise = new SimplexNoise(this.seed);
      for (const rt of this.chunks.values()) rt.destroy();
      this.chunks.clear();
      this.generated.clear();
    });
  }

  update(world: World, _dt: number): void {
    const players = [...world.query('CTransform', 'CAI')]
      .filter((e) => e.getComponent<CAI>('CAI')!.type === 'player');
    if (players.length === 0) return;
    const pt = players[0]!.getComponent<CTransform>('CTransform')!;
    const px = Math.floor(pt.x / (this.CHUNK * GameConfig.tileSize));
    const py = Math.floor(pt.y / (this.CHUNK * GameConfig.tileSize));

    const RADIUS = 2; // chunks kept around player (5x5 = 25 RTs max)
    for (let dx = -RADIUS; dx <= RADIUS; dx++) {
      for (let dy = -RADIUS; dy <= RADIUS; dy++) {
        const key = `${px + dx},${py + dy}`;
        if (!this.generated.has(key)) this.bakeChunk(px + dx, py + dy);
      }
    }

    // cull far chunks
    for (const [key, rt] of this.chunks) {
      const [cx, cy] = key.split(',').map(Number);
      if (Math.abs(cx - px) > RADIUS + 1 || Math.abs(cy - py) > RADIUS + 1) {
        rt.destroy();
        this.chunks.delete(key);
        this.generated.delete(key);
      }
    }
  }

  private bakeChunk(cx: number, cy: number): void {
    const key = `${cx},${cy}`;
    this.generated.add(key);
    const T = GameConfig.tileSize;
    const size = this.CHUNK * T;
    const rt = this.scene.add.renderTexture(cx * size, cy * size, size, size)
      .setOrigin(0, 0)
      .setDepth(0);
    this.chunks.set(key, rt);

    const noise = this.noise!;
    for (let tx = 0; tx < this.CHUNK; tx++) {
      for (let ty = 0; ty < this.CHUNK; ty++) {
        const wx = cx * this.CHUNK + tx;
        const wy = cy * this.CHUNK + ty;
        // biome bands by low-frequency noise
        const v = noise.noise2D(wx / 40, wy / 40);
        const palette = v > 0.25
          ? ['terrain_stone_cloud_middle', 'terrain_stone_cloud_right']
          : v < -0.25
            ? ['terrain_stone_vertical_middle', 'terrain_stone_horizontal_left']
            : ['terrain_stone_horizontal_middle', 'terrain_stone_horizontal_right'];
        const f = palette[(tx + ty) % palette.length]!;
        rt.drawFrame(GameConfig.atlasKey, f, tx * T, ty * T);
      }
    }
  }
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
