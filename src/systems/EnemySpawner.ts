import Phaser from 'phaser';
import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import { CTransform } from '@/components/CTransform';
import { CHealth } from '@/components/CHealth';
import { CAI } from '@/components/CAI';
import { CSprite } from '@/components/CSprite';

export class EnemySpawner implements System {
  name = 'EnemySpawner';
  private spawnTimer = 0;

  constructor(_scene: Phaser.Scene) {}

  update(world: World, dt: number): void {
    if (world.paused) return;
    this.spawnTimer += dt;
    if (this.spawnTimer < 1500) return;
    this.spawnTimer = 0;
    // ponytail: spawn a basic skeleton near the player; expand to wave tables
    const player = [...world.query('CTransform', 'CAI')].find(
      (e) => e.getComponent<CAI>('CAI')!.type === 'player'
    );
    if (!player) return;
    const pt = player.getComponent<CTransform>('CTransform')!;
    const enemy = world.createEntity();
    enemy.addComponent('CTransform', new CTransform({ x: pt.x + 300, y: pt.y }));
    enemy.addComponent('CHealth', new CHealth({ max: 40, current: 40 }));
    enemy.addComponent('CAI', new CAI({ type: 'melee' }));
    enemy.addComponent('CSprite', new CSprite({ atlasKey: 'main', frame: 'enemy_skeleton', scale: 3 }));
  }
}
