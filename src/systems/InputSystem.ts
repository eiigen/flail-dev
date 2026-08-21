import Phaser from 'phaser';
import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import type { SettingsManager } from './SettingsManager';

export class InputSystem implements System {
  name = 'InputSystem';
  private keys!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private settings: SettingsManager;
  private dx = 0;
  private dy = 0;

  constructor(private scene: Phaser.Scene, settings: SettingsManager) {
    this.settings = settings;
  }

  init(world: World): void {
    const km = this.settings.get('accessibility').keyMap;
    const kb = this.scene.input.keyboard!;
    this.keys = {
      up: kb.addKey(km.up ?? 'W'),
      down: kb.addKey(km.down ?? 'S'),
      left: kb.addKey(km.left ?? 'A'),
      right: kb.addKey(km.right ?? 'D'),
    };
  }

  update(world: World, _dt: number): void {
    this.dx = (this.keys.right.isDown ? 1 : 0) - (this.keys.left.isDown ? 1 : 0);
    this.dy = (this.keys.down.isDown ? 1 : 0) - (this.keys.up.isDown ? 1 : 0);
    world.emit('key-input', { dx: this.dx, dy: this.dy });
  }
}
