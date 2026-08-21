import Phaser from 'phaser';
import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import type { SettingsManager } from './SettingsManager';

export class VFXSystem implements System {
  name = 'VFXSystem';
  private settings: SettingsManager;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, settings: SettingsManager) {
    this.scene = scene;
    this.settings = settings;
  }

  init(world: World): void {
    world.on('play-vfx', (data: { type: string; x: number; y: number }) => {
      if (this.settings.get('accessibility').reducedMotion) return;
      switch (data.type) {
        case 'hit':
          this.burst(data.x, data.y, 0xffffff, 4, 90, 250);
          break;
        case 'kill':
          this.burst(data.x, data.y, 0xff6666, 10, 130, 500);
          break;
        case 'death':
          this.burst(data.x, data.y, 0xff2222, 24, 260, 800);
          this.scene.cameras.main.shake(200, 0.005);
          break;
        case 'levelup':
          this.fountain(data.x, data.y);
          break;
        case 'bossRoar':
          this.burst(data.x, data.y, 0xff2222, 26, 300, 700);
          this.scene.cameras.main.shake(300, 0.008);
          break;
        default:
          this.burst(data.x, data.y, 0xcc88ff, 8, 100, 450);
      }
      this.scene.cameras.main.shake(80, 0.002);
    });
    world.on('screen-shake', (data: { intensity: number; duration: number }) => {
      if (this.settings.get('accessibility').reducedMotion) return;
      this.scene.cameras.main.shake(data.duration, data.intensity / 10000);
    });
  }

  private fountain(x: number, y: number): void {
    const parts = this.scene.add.particles(x, y, 'main', {
      frame: 'gem_yellow',
      speed: { min: 60, max: 160 },
      angle: { min: 240, max: 300 },
      gravityY: 220,
      scale: { start: 0.6, end: 0 },
      lifespan: 900,
      quantity: 14,
      emitting: false,
    });
    parts.explode(14);
    this.scene.time.delayedCall(1100, () => parts.destroy());
  }

  private burst(x: number, y: number, color: number, count: number, speed: number, life = 600): void {
    const parts = this.scene.add.particles(x, y, GameConfigTexture, {
      speed: { min: speed * 0.4, max: speed },
      scale: { start: 0.5, end: 0 },
      lifespan: { min: life * 0.6, max: life },
      quantity: count,
      tint: color,
      emitting: false,
    });
    parts.explode(count);
    this.scene.time.delayedCall(life + 200, () => parts.destroy());
  }

  update(_world: World, _dt: number): void {}
}

const GameConfigTexture = 'main';
