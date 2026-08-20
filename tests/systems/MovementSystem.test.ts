import { describe, it, expect } from 'vitest';
import { World } from '../../src/ecs/World';
import { CTransform } from '../../src/components/CTransform';
import { CAI } from '../../src/components/CAI';
import { MovementSystem } from '../../src/systems/MovementSystem';

describe('MovementSystem', () => {
  it('moves the player in the input direction at playerSpeed per second', () => {
    const world = new World();
    const sys = new MovementSystem();
    sys.init(world);

    const player = world.createEntity();
    player.addComponent('CTransform', new CTransform({ x: 0, y: 0 }));
    player.addComponent('CAI', new CAI({ type: 'player' }));

    world.emit('player-input', { dx: 1, dy: 0 });
    sys.update(world, 1000); // 1 second

    const t = player.getComponent<CTransform>('CTransform')!;
    expect(t.x).toBeCloseTo(200, 5); // playerSpeed 200 * 1s
    expect(t.y).toBe(0);
  });

  it('moves the player diagonally (normalized) by the same speed', () => {
    const world = new World();
    const sys = new MovementSystem();
    sys.init(world);

    const player = world.createEntity();
    player.addComponent('CTransform', new CTransform({ x: 0, y: 0 }));
    player.addComponent('CAI', new CAI({ type: 'player' }));

    world.emit('player-input', { dx: 1, dy: 1 });
    sys.update(world, 1000);

    const t = player.getComponent<CTransform>('CTransform')!;
    // normalized (1,1) => each axis ~0.707 * 200
    expect(t.x).toBeCloseTo(141.4, 1);
    expect(t.y).toBeCloseTo(141.4, 1);
  });

  it('chases: an enemy moves toward the player', () => {
    const world = new World();
    const sys = new MovementSystem();
    sys.init(world);

    const player = world.createEntity();
    player.addComponent('CTransform', new CTransform({ x: 0, y: 0 }));
    player.addComponent('CAI', new CAI({ type: 'player' }));

    const enemy = world.createEntity();
    enemy.addComponent('CTransform', new CTransform({ x: 100, y: 0 }));
    enemy.addComponent('CAI', new CAI({ type: 'melee' }));

    world.emit('player-input', { dx: 0, dy: 0 });
    sys.update(world, 1000); // 1s

    const et = enemy.getComponent<CTransform>('CTransform')!;
    // enemy should have moved closer to x=0 (player), i.e. x decreased
    expect(et.x).toBeLessThan(100);
    expect(et.x).toBeCloseTo(20, 5); // 100 - 80*1s
  });
});
