import Phaser from 'phaser';
import type { World } from '@/ecs/World';
import type { Game } from './Game';

export class UIOverlay extends Phaser.Scene {
  constructor() {
    super({ key: 'UIOverlay' });
  }

  create(): void {
    const game = this.scene.get('Game') as Game;
    this.world = game.world;

    // HUD: HP bar, XP bar, timer, wave
    this.add
      .text(20, 20, 'Flail', {
        fontFamily: '"Cinzel Decorative", serif',
        fontSize: '24px',
        color: '#cc88ff',
        stroke: '#000000',
        strokeThickness: 2,
      });

    // Listen for game events to show modals
    this.world.on('levelup', (data: { level: number }) => {
      this.showLevelUp(data.level);
    });

    this.world.on('show-evolution', (data: { recipeName: string; queueLength: number }) => {
      this.showEvolution(data.recipeName, data.queueLength);
    });
  }

  private world!: World;

  private showLevelUp(level: number): void {
    // Placeholder: pause world, show 3-4 choices (full impl in Task 9)
    this.add
      .text(this.scale.width / 2, 80, `Level ${level}!`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '20px',
        color: '#ffcc00',
      })
      .setOrigin(0.5);
  }

  private showEvolution(recipeName: string, queueLength: number): void {
    // Placeholder: evolution modal (full impl in Task 10)
    this.add
      .text(this.scale.width / 2, 120, `Evolve into ${recipeName}? [Yes/No]`, {
        fontFamily: '"Cinzel", serif',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    void queueLength;
  }
}
