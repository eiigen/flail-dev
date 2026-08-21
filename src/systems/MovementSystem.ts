import Phaser from 'phaser';
import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import type { CTransform } from '@/components/CTransform';
import type { CAI } from '@/components/CAI';
import type { CSprite } from '@/components/CSprite';
import { GameConfig } from '@/GameConfig';

export class MovementSystem implements System {
  name = 'MovementSystem';
  private inputDx = 0;
  private inputDy = 0;
  private playerSpeed = 220;
  private enemySpeed = 70;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  init(world: World): void {
    world.on('player-input', (data: { dx: number; dy: number }) => {
      this.inputDx = data.dx;
      this.inputDy = data.dy;
    });
  }

  update(world: World, dt: number): void {
    const dtSec = dt / 1000;

    const players = [...world.query('CTransform', 'CAI')]
      .filter((e) => e.getComponent<CAI>('CAI')!.type === 'player');
    const playerT = players.length > 0 ? players[0]!.getComponent<CTransform>('CTransform')! : null;
    const playerSprite = players.length > 0 ? (this.scene as any).entitySprites.get(players[0]!.id) : null;

    for (const e of world.query('CTransform', 'CAI')) {
      const ai = e.getComponent<CAI>('CAI')!;
      const t = e.getComponent<CTransform>('CTransform')!;

      if (ai.type === 'player') {
        const len = Math.hypot(this.inputDx, this.inputDy);
        if (len > 0) {
          t.x += (this.inputDx / len) * this.playerSpeed * dtSec;
          t.y += (this.inputDy / len) * this.playerSpeed * dtSec;
        }
        // flip sprite by direction
        if (playerSprite) {
          playerSprite.flipX = this.inputDx < 0;
          playerSprite.anims.timeScale = len > 0 ? 1.4 : 0;
        }
        continue;
      }

      // Enemy chase
      if (!playerT) continue;
      const dx = playerT.x - t.x;
      const dy = playerT.y - t.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 20) {
        const speed = this.enemySpeed * (1 + ai.state === 'raged' ? 0.6 : 0);
        t.x += (dx / dist) * speed * dtSec;
        t.y += (dy / dist) * speed * dtSec;
      }
    }
  }
}
