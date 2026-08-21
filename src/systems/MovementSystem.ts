import Phaser from 'phaser';
import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import type { CTransform } from '@/components/CTransform';
import type { CAI } from '@/components/CAI';
import type { CSprite } from '@/components/CSprite';
import type { CHealth } from '@/components/CHealth';
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

  private keyDx = 0;
  private keyDy = 0;
  private joyDx = 0;
  private joyDy = 0;

  init(world: World): void {
    // two input channels; joystick wins when engaged, else keyboard.
    // (a single channel let the per-frame keyboard emit stomp touch input.)
    world.on('key-input', (data: { dx: number; dy: number }) => {
      this.keyDx = data.dx;
      this.keyDy = data.dy;
    });
    world.on('joy-input', (data: { dx: number; dy: number }) => {
      this.joyDx = data.dx;
      this.joyDy = data.dy;
    });
  }

  update(world: World, dt: number): void {
    const dtSec = dt / 1000;
    const speedMult = (this.scene.registry.get('speedMult') as number) ?? 1;
    const jMag = Math.hypot(this.joyDx, this.joyDy);
    if (jMag > 0.05) {
      this.inputDx = this.joyDx;
      this.inputDy = this.joyDy;
    } else {
      this.inputDx = this.keyDx;
      this.inputDy = this.keyDy;
    }

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
          t.x += (this.inputDx / len) * this.playerSpeed * speedMult * dtSec;
          t.y += (this.inputDy / len) * this.playerSpeed * speedMult * dtSec;
        }
        // flip sprite by direction
        if (playerSprite) {
          playerSprite.flipX = this.inputDx < 0;
          playerSprite.anims.timeScale = len > 0 ? 1.4 : 0;
        }
        continue;
      }

      // Enemy chase + CONTACT DAMAGE (this was missing — enemies could never hurt you)
      if (!playerT) continue;
      const dx = playerT.x - t.x;
      const dy = playerT.y - t.y;
      const dist = Math.hypot(dx, dy);
      const speed = this.enemySpeed;
      if (dist > 18) {
        t.x += (dx / dist) * speed * dtSec;
        t.y += (dy / dist) * speed * dtSec;
      } else {
        const hp = players[0]!.getComponent<CHealth>('CHealth');
        if (hp && hp.invulnTimer <= 0) {
          const dmg = (e as any).dmgValue ?? 8;
          hp.applyDamage(dmg);
          hp.invulnTimer = 600; // i-frames
          world.emit('play-vfx', { type: 'hit', x: playerT.x, y: playerT.y });
          world.emit('play-sfx', 'player_hit');
          world.emit('screen-shake', { intensity: 6, duration: 150 });
          if (!hp.alive) {
            world.paused = true;
            world.emit('player-died', { wave: (world as any).__wave ?? 1 });
          }
        }
      }
      // tick player i-frames once per frame
      const php = players[0]!.getComponent<CHealth>('CHealth');
      if (php && php.invulnTimer > 0) php.invulnTimer -= dt;
    }
  }
}
