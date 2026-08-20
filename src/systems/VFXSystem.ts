import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import type { SettingsManager } from './SettingsManager';

export class VFXSystem implements System {
  name = 'VFXSystem';
  private settings: SettingsManager;

  constructor(private scene: import('phaser').Scene, settings: SettingsManager) {
    this.settings = settings;
  }

  init(world: World): void {
    world.on('play-vfx', (data: { type: string; x: number; y: number }) => {
      if (this.settings.get('accessibility').reducedMotion) return;
      this.shake(data.type === 'bossRoar' ? 8 : 3, 200);
      void data;
    });
    world.on('screen-shake', (data: { intensity: number; duration: number }) => {
      if (this.settings.get('accessibility').reducedMotion) return;
      this.shake(data.intensity, data.duration);
    });
  }

  private shake(intensity: number, duration: number): void {
    (this.scene as import('phaser').Scene).cameras.main.shake(duration, intensity / 1000);
  }

  update(_world: World, _dt: number): void {}
}
