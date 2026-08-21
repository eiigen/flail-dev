import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import type { CExp } from '@/components/CExp';

export class ExpSystem implements System {
  name = 'ExpSystem';

  init(world: World): void {
    world.on('xp-granted', (data: { entityId: number; amount: number }) => {
      const e = world.entities.find((en) => en.id === data.entityId);
      if (!e) return;
      const exp = e.getComponent<CExp>('CExp');
      if (!exp) return;
      exp.current += data.amount;
    });

    world.on('enemy-killed', (data: { enemyId: number; killerId: number; xp: number }) => {
      world.emit('xp-granted', { entityId: data.killerId, amount: data.xp });
    });
  }

  update(world: World, _dt: number): void {
    for (const e of world.query('CExp')) {
      const exp = e.getComponent<CExp>('CExp')!;
      while (exp.current >= exp.nextThreshold) {
        exp.current -= exp.nextThreshold;
        exp.level++;
        exp.nextThreshold = Math.floor(80 * Math.pow(exp.level, 1.4));
        world.emit('levelup', { entityId: e.id, level: exp.level });
      }
    }
  }
}
