import Phaser from 'phaser';
import { GameConfig } from '@/GameConfig';
import { ui } from '@/utils/ui';

export class MainMenu extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.text(w / 2, h * 0.18, 'FLAIL', {
      fontFamily: '"Cinzel Decorative", serif',
      fontSize: `${ui(64)}px`, color: '#cc88ff',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    if (GameConfig.version === 'polli') {
      this.add.text(w / 2, h * 0.29, '⚡ POLLI VERSION ⚡', {
        fontFamily: '"Cinzel", serif', fontSize: `${ui(17)}px`, color: '#ffcc00',
      }).setOrigin(0.5);
    }

    const btnW = Math.min(ui(340), w * 0.72);
    const btnH = Math.min(ui(58), h * 0.07);
    const startY = h * 0.46;
    const gap = btnH + ui(12);

    this.createButton(w / 2, startY,           btnW, btnH, '▶  Start Run', () => this.scene.start('Game'));
    this.createButton(w / 2, startY + gap,     btnW, btnH, '⚔  Characters', () => {});
    this.createButton(w / 2, startY + gap * 2, btnW, btnH, '🏆  Achievements', () => {});
    this.createButton(w / 2, startY + gap * 3, btnW, btnH, '⚙  Settings', () => this.scene.start('SettingsMenu'));

    // ponytail: silence — placeholder SFX was a short beep, not music.
    // Audio will be wired when real BGM assets are added.
  }

  private createButton(x: number, y: number, bw: number, bh: number, label: string, cb: () => void): void {
    const bg = this.add.rectangle(x, y, bw, bh, 0x1a1a2e, 0.85)
      .setStrokeStyle(2, 0xcc88ff)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: '"Cinzel", serif', fontSize: `${ui(20)}px`, color: '#eeeeee',
    }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(0x2a2a4e));
    bg.on('pointerout',  () => bg.setFillStyle(0x1a1a2e));
    bg.on('pointerdown', cb);
  }
}
