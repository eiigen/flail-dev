import Phaser from 'phaser';
import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import { hash } from '@/utils/hash';
import { GameConfig } from '@/GameConfig';
import type { CAI } from '@/components/CAI';
import type { CTransform } from '@/components/CTransform';

export class MapGenSystem implements System {
  name = 'MapGenSystem';
  private seed = 0;
  private generated = new Set<string>();

  constructor(_scene: Phaser.Scene) {}

  init(world: World): void {
    world.on('map-start', (data: { mapId: string; seed: string }) => {
      this.seed = hash(data.seed + data.mapId);
    });
  }

  update(world: World, _dt: number): void {
    const players = [...world.query('CTransform', 'CAI')].filter(
      (e) => e.getComponent<CAI>('CAI')!.type === 'player'
    );
    if (players.length === 0) return;
    const pt = players[0]!.getComponent<CTransform>('CTransform')!;
    // ponytail: simple grid, no noise; add simplex biome gen when art exists
    const pcx = Math.floor(pt.x / (GameConfig.chunkSize * GameConfig.tileSize));
    const pcy = Math.floor(pt.y / (GameConfig.chunkSize * GameConfig.tileSize));
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const key = `${pcx + dx},${pcy + dy}`;
        if (this.generated.has(key)) continue;
        this.generated.add(key);
        void this.seed;
      }
    }
  }
}
