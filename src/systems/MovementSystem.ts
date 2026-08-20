import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import type { CTransform } from '@/components/CTransform';
import type { CAI } from '@/components/CAI';

export class MovementSystem implements System {
  name = 'MovementSystem';
  private inputDx = 0;
  private inputDy = 0;
  private playerSpeed = 200;
  private enemySpeed = 80;

  init(world: World): void {
    world.on('player-input', (data: { dx: number; dy: number }) => {
      this.inputDx = data.dx;
      this.inputDy = data.dy;
    });
  }

  update(world: World, dt: number): void {
    const dtSec = dt / 1000;

    const players = [...world.query('CTransform', 'CAI')].filter(
      (e) => e.getComponent<CAI>('CAI')!.type === 'player'
    );
    const playerT = players.length > 0 ? players[0]!.getComponent<CTransform>('CTransform')! : null;

    for (const e of world.query('CTransform', 'CAI')) {
      const ai = e.getComponent<CAI>('CAI')!;
      const t = e.getComponent<CTransform>('CTransform')!;

      if (ai.type === 'player') {
        const len = Math.hypot(this.inputDx, this.inputDy);
        if (len > 0) {
          t.x += (this.inputDx / len) * this.playerSpeed * dtSec;
          t.y += (this.inputDy / len) * this.playerSpeed * dtSec;
        }
        continue;
      }

      // Enemy chase toward player
      if (!playerT) continue;
      const dx = playerT.x - t.x;
      const dy = playerT.y - t.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0) {
        const speed = this.enemySpeed;
        t.x += (dx / dist) * speed * dtSec;
        t.y += (dy / dist) * speed * dtSec;
      }
    }
  }
}
