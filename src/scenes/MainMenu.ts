import Phaser from 'phaser';
import { GameConfig } from '@/GameConfig';

export class MainMenu extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create(): void {
    const { width, height } = this.scale;

    const title = this.add
      .text(width / 2, height * 0.22, 'FLAIL', {
        fontFamily: '"Cinzel Decorative", serif',
        fontSize: '72px',
        color: '#cc88ff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    if (GameConfig.version === 'polli') {
      this.add
        .text(width / 2, height * 0.33, '⚡ POLLI VERSION ⚡', {
          fontFamily: '"Cinzel", serif',
          fontSize: '18px',
          color: '#ffcc00',
        })
        .setOrigin(0.5);
    }

    const startY = height * 0.5;
    this.createButton(width / 2, startY, 'Start Run', () => this.scene.start('Game'));
    this.createButton(width / 2, startY + 60, 'Characters', () => { /* TODO: char select */ });
    this.createButton(width / 2, startY + 120, 'Achievements', () => { /* TODO */ });
    this.createButton(width / 2, startY + 180, 'Settings', () => { /* TODO */ });

    this.sound.play('music_menu', { loop: true, volume: 0.5 });
  }

  private createButton(x: number, y: number, label: string, callback: () => void): void {
    const bg = this.add
      .rectangle(x, y, 280, 44, 0x1a1a2e, 0.8)
      .setStrokeStyle(2, 0xcc88ff)
      .setInteractive({ useHandCursor: true });
    const txt = this.add
      .text(x, y, label, {
        fontFamily: '"Cinzel", serif',
        fontSize: '20px',
        color: '#eeeeee',
      })
      .setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(0x2a2a4e));
    bg.on('pointerout', () => bg.setFillStyle(0x1a1a2e));
    bg.on('pointerdown', callback);
  }
}
