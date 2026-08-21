import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';

export class WaveDirector implements System {
  name = 'WaveDirector';
  private currentWave = 0;
  private waveTimer = 0;
  private difficultyMult = 1;

  init(world: World): void {
    world.on('map-start', () => {
      this.currentWave = 0;
      this.waveTimer = 0;
      this.difficultyMult = 1;
    });
  }

  update(world: World, dt: number): void {
    if (world.paused) return;
    this.waveTimer += dt;
    // ponytail: fixed 30s waves; difficulty = 1 + wave*0.1
    if (this.waveTimer >= 30000) {
      this.waveTimer = 0;
      this.currentWave++;
      this.difficultyMult = 1 + this.currentWave * 0.1;
      world.emit('wave-reached', { wave: this.currentWave, difficulty: this.difficultyMult });
      // boss every 5th wave
      if (this.currentWave % 5 === 0) {
        world.emit('boss-wave', { bossId: 'forest_warden', wave: this.currentWave });
      }
    }
  }
}
