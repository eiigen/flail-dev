import Phaser from 'phaser';
import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import type { CTransform } from '@/components/CTransform';
import type { CWeapon } from '@/components/CWeapon';
import type { CHealth } from '@/components/CHealth';
import type { CAI } from '@/components/CAI';
import type { Entity } from '@/ecs/Entity';
import { SpatialHash } from '@/utils/SpatialHash';
import { WeaponDefSchema, type WeaponDef } from '@/data/schemas';

export class CombatSystem implements System {
  name = 'CombatSystem';
  private spatial = new SpatialHash(128);
  private weaponDefs = new Map<string, WeaponDef>();

  constructor(_scene: Phaser.Scene) {}

  init(world: World): void {
    // Register weapon definitions as they are loaded (Task wiring); fallback inline
    world.on('weapon-def', (def: WeaponDef) => {
      this.weaponDefs.set(def.id, def);
    });
  }

  update(world: World, dt: number): void {
    this.spatial.clear();

    for (const e of world.query('CTransform', 'CAI')) {
      const ai = e.getComponent<CAI>('CAI')!;
      if (ai.type !== 'player') {
        const t = e.getComponent<CTransform>('CTransform')!;
        this.spatial.insert(e.id, t.x, t.y);
      }
    }

    for (const e of world.query('CTransform', 'CWeapon')) {
      const t = e.getComponent<CTransform>('CTransform')!;
      const w = e.getComponent<CWeapon>('CWeapon')!;
      const weaponDef = this.weaponDefs.get(w.weaponId);
      if (!weaponDef) continue;

      w.cooldown = Math.max(0, w.cooldown - dt);

      const candidates = this.spatial.query(t.x, t.y, weaponDef.range);
      let bestId = -1;
      let bestWeight = -Infinity;
      for (const id of candidates) {
        const target = world.entities.find((en) => en.id === id);
        if (!target) continue;
        const tt = target.getComponent<CTransform>('CTransform')!;
        const dist = Math.hypot(t.x - tt.x, t.y - tt.y);
        const threat = 1;
        const weight = threat / (dist * dist + 1);
        if (weight > bestWeight) {
          bestWeight = weight;
          bestId = id;
        }
      }
      w.targetEntity = bestId;

      if (w.cooldown <= 0 && bestId >= 0) {
        this.fireWeapon(world, e, bestId, weaponDef);
        w.cooldown = weaponDef.cooldown;
        w.lastFired = Date.now();
      }
    }
  }

  private fireWeapon(
    world: World,
    shooter: Entity,
    targetId: number,
    def: WeaponDef
  ): void {
    const st = shooter.getComponent<CTransform>('CTransform')!;
    const target = world.entities.find((e) => e.id === targetId);
    if (!target) return;
    const tt = target.getComponent<CTransform>('CTransform')!;
    const baseAngle = Math.atan2(tt.y - st.y, tt.x - st.x);

    for (let i = 0; i < def.count; i++) {
      const angle =
        baseAngle + (i - (def.count - 1) / 2) * (def.spread * Math.PI / 180);
      world.emit('fire-projectile', {
        x: st.x,
        y: st.y,
        angle,
        speed: def.speed,
        damage: def.damage,
        pierce: def.pierce,
        range: def.range,
        projectileKey: def.projectileKey,
      });
    }
    void shooter;
  }
}
