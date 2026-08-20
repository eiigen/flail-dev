import { describe, it, expect } from 'vitest';
import { World } from '../../src/ecs/World';
import { CExp } from '../../src/components/CExp';
import { ExpSystem } from '../../src/systems/ExpSystem';

describe('ExpSystem', () => {
  it('levels up when current >= nextThreshold and recalculates the threshold', () => {
    const world = new World();
    new ExpSystem().init(world);

    const e = world.createEntity();
    e.addComponent('CExp', new CExp({ current: 250, level: 1, nextThreshold: 100 }));

    world.emit('enemy-killed', { enemyId: 1, killerId: e.id, xp: 0 });
    // drive the level-up loop directly via the update tick
    new ExpSystem().update(world, 16);

    const exp = e.getComponent<CExp>('CExp')!;
    // 250 -> consume 100 (level 2, threshold 282), 150 left, 150 < 282 stop
    expect(exp.level).toBe(2);
    expect(exp.current).toBe(150);
    expect(exp.nextThreshold).toBe(282); // floor(100 * 2^1.5)
  });

  it('emits a levelup event per level gained', () => {
    const world = new World();
    let emitted = 0;
    world.on('levelup', () => {
      emitted++;
    });
    new ExpSystem().init(world);

    const e = world.createEntity();
    e.addComponent('CExp', new CExp({ current: 100, level: 1, nextThreshold: 100 }));
    new ExpSystem().update(world, 16);

    expect(emitted).toBe(1);
    expect(e.getComponent<CExp>('CExp')!.level).toBe(2);
  });
});
