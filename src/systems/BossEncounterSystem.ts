import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import type { CHealth } from '@/components/CHealth';
import type { CTransform } from '@/components/CTransform';

export class BossEncounterSystem implements System {
  name = 'BossEncounterSystem';
  private activeBoss = -1;

  init(world: World): void {
    world.on('boss-wave', (data: { bossId: string }) => {
      void data;
      // ponytail: boss spawn + intro stub; full cutscene in CutsceneLayer
    });
  }

  update(world: World, _dt: number): void {
    if (this.activeBoss < 0) return;
    const boss = world.entities.find((e) => e.id === this.activeBoss);
    if (!boss) {
      this.activeBoss = -1;
      return;
    }
    const hp = boss.getComponent<CHealth>('CHealth');
    if (hp && !hp.alive) {
      world.emit('boss-killed', { bossId: this.activeBoss });
      const t = boss.getComponent<CTransform>('CTransform');
      if (t) world.emit('spawn-chest', { x: t.x, y: t.y });
      this.activeBoss = -1;
    }
  }
}
