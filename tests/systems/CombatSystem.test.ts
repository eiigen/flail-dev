import { describe, it, expect } from 'vitest';
import { World } from '../../src/ecs/World';
import { CTransform } from '../../src/components/CTransform';
import { CWeapon } from '../../src/components/CWeapon';
import { CAI } from '../../src/components/CAI';
import { CombatSystem } from '../../src/systems/CombatSystem';
import type { WeaponDef } from '../../src/data/schemas';

const greatsword: WeaponDef = {
  id: 'greatsword',
  type: 'melee',
  name: 'Great Sword',
  damage: 20,
  cooldown: 1.2,
  range: 120,
  count: 1,
  spread: 0,
  pierce: 0,
  speed: 0,
};

function mkWeapon() {
  return { id: 'greatsword', type: 'melee', name: 'n', damage: 0, cooldown: 1, range: 0, count: 1, spread: 0, pierce: 0, speed: 0 };
}

describe('CombatSystem targeting', () => {
  it('targets the nearest enemy within range', () => {
    const world = new World();
    const sys = new CombatSystem({} as any);
    sys.init(world);
    world.emit('weapon-def', greatsword);

    const player = world.createEntity();
    player.addComponent('CTransform', new CTransform({ x: 0, y: 0 }));
    player.addComponent('CWeapon', new CWeapon({ weaponId: 'greatsword', cooldown: 0 }));
    player.addComponent('CAI', new CAI({ type: 'player' }));

    const near = world.createEntity();
    near.addComponent('CTransform', new CTransform({ x: 50, y: 0 }));
    near.addComponent('CAI', new CAI({ type: 'melee' }));

    const far = world.createEntity();
    far.addComponent('CTransform', new CTransform({ x: 200, y: 0 }));
    far.addComponent('CAI', new CAI({ type: 'melee' }));

    sys.update(world, 16);

    const w = player.getComponent<CWeapon>('CWeapon')!;
    expect(w.targetEntity).toBe(near.id);
  });

  it('ignores enemies beyond weapon range', () => {
    const world = new World();
    const sys = new CombatSystem({} as any);
    sys.init(world);
    world.emit('weapon-def', greatsword);

    const player = world.createEntity();
    player.addComponent('CTransform', new CTransform({ x: 0, y: 0 }));
    player.addComponent('CWeapon', new CWeapon({ weaponId: 'greatsword', cooldown: 0 }));
    player.addComponent('CAI', new CAI({ type: 'player' }));

    const out = world.createEntity();
    out.addComponent('CTransform', new CTransform({ x: 500, y: 0 }));
    out.addComponent('CAI', new CAI({ type: 'melee' }));

    sys.update(world, 16);

    const w = player.getComponent<CWeapon>('CWeapon')!;
    expect(w.targetEntity).toBe(-1);
  });
});
