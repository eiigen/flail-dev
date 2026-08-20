import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import type { SettingsManager } from './SettingsManager';

export class AccessibilitySystem implements System {
  name = 'AccessibilitySystem';
  private settings: SettingsManager;

  constructor(_scene: import('phaser').Scene, settings: SettingsManager) {
    this.settings = settings;
  }

  init(world: World): void {
    this.applyHighContrast();
    world.on('sr-announce', (msg: string) => this.announce(msg));
  }

  private applyHighContrast(): void {
    if (this.settings.get('accessibility').highContrast) {
      document.body.style.filter = 'contrast(150%)';
    } else {
      document.body.style.filter = '';
    }
  }

  private announce(message: string): void {
    const el = document.getElementById('sr-announcements');
    if (el) el.textContent = message;
  }

  update(_world: World, _dt: number): void {}
}
