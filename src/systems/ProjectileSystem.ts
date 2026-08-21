import Phaser from 'phaser';
import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import { CTransform } from '@/components/CTransform';
import { CProjectile } from '@/components/CProjectile';
import { CHealth } from '@/components/CHealth';
import { CAI } from '@/components/CAI';
import { CSprite } from '@/components/CSprite';
import { CInventory } from '@/components/CInventory';
import { GameConfig } from '@/GameConfig';

const FRAME_BY_DMG: Record<string, string> = {
  '5': 'gem_yellow', '10': 'gem_red', '15': 'gem_green', '20': 'gem_blue',
};

export class ProjectileSystem implements System {
  name = 'ProjectileSystem';
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  init(world: World): void {
    world.on('fire-projectile', (data: {
      x: number; y: number; angle: number; speed: number;
      damage: number; pierce: number; range: number; projectileKey: string;
    }) => {
      if (world.entities.length > 250) return;
      const proj = world.createEntity();
      proj.addComponent('CTransform', new CTransform({ x: data.x, y: data.y }));
      proj.addComponent('CProjectile', new CProjectile({
        damage: data.damage,
        speed: data.speed,
        pierce: data.pierce,
        maxRange: data.range,
        dirX: Math.cos(data.angle),
        dirY: Math.sin(data.angle),
      }));
      const frame = FRAME_BY_DMG[String(data.damage)] ?? 'gem_yellow';
      proj.addComponent('CSprite', new CSprite({ frame, scale: 1 }));
      this.scene.sound.play('player_attack', { volume: 0.15 });
    });
  }

  update(world: World, dt: number): void {
    const dtSec = dt / 1000;
    const enemies = [...world.query('CTransform', 'CHealth', 'CAI')]
      .filter(e => e.getComponent<CAI>('CAI')!.type !== 'player');

    for (const proj of [...world.query('CTransform', 'CProjectile')]) {
      const t = proj.getComponent<CTransform>('CTransform')!;
      const p = proj.getComponent<CProjectile>('CProjectile')!;
      t.x += p.dirX * p.speed * dtSec;
      t.y += p.dirY * p.speed * dtSec;
      p.traveled += p.speed * dtSec;
      if (p.traveled >= p.maxRange) { world.destroyEntity(proj); continue; }

      for (const enemy of enemies) {
        const et = enemy.getComponent<CTransform>('CTransform')!;
        if (Math.hypot(t.x - et.x, t.y - et.y) < 22) {
          enemy.getComponent<CHealth>('CHealth')!.applyDamage(p.damage);
          world.emit('play-vfx', { type: 'hit', x: et.x, y: et.y });
          p.pierce--;
          if (p.pierce <= 0) { world.destroyEntity(proj); break; }
        }
      }
    }

    const player = [...world.query('CTransform','CHealth','CAI')]
      .find(e => e.getComponent<CAI>('CAI')!.type === 'player');
    const playerId = player ? player.id : -1;
    for (const e of enemies) {
      if (!e.getComponent<CHealth>('CHealth')!.alive) {
        const t = e.getComponent<CTransform>('CTransform')!;
        const xpVal = (e as any).xpValue ?? 10;
        world.emit('enemy-killed', { entityId: e.id, killerId: playerId, xp: xpVal, x: t.x, y: t.y });
        world.emit('play-vfx', { type: 'kill', x: t.x, y: t.y });
        world.emit('play-sfx', 'enemy_hit');
        // ingredient drop → drives the evolution loop
        if (playerId >= 0 && Math.random() < 0.15) {
          const pEnt = world.entities.find(en => en.id === playerId);
          const pinv = pEnt?.getComponent<CInventory>('CInventory');
          if (pinv) {
            pinv.add('fire_gem', 1);
            world.emit('inventory-updated', {});
            world.emit('play-sfx', 'coin');
          }
        }
        world.destroyEntity(e);
      }
    }
  }
}
