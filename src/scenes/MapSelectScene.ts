import Phaser from 'phaser';
import { ui } from '@/utils/ui';

export class MapSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapSelectScene' });
  }

  create(): void {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w/2, h/2, w*2, h*2, 0x12121f).setDepth(-1);
    this.add.text(w/2, ui(64), 'SELECT MAP', {
      fontFamily: '"Cinzel Decorative", serif', fontSize: `${ui(34)}px`,
      color: '#cc88ff', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    const maps = this.cache.json.get('maps')?.maps ?? [];
    const cols = this.scale.width < this.scale.height ? 2 : 3;
    const cw = Math.min(ui(300), (w - 60) / cols - 14);
    const chh = ui(92);
    const startX = w / 2 - ((cols * (cw + 14)) - 14) / 2 + cw / 2;
    const startY = h * 0.18;

    maps.forEach((m: any, i: number) => {
      const cx = startX + (i % cols) * (cw + 14);
      const cy = startY + Math.floor(i / cols) * (chh + 14);
      const bg = this.add.rectangle(cx, cy, cw, chh, 0x1a1a2e, 0.95)
        .setStrokeStyle(2, 0xcc88ff, 0.8)
        .setInteractive({ useHandCursor: true });
      this.add.text(cx, cy - chh * 0.18, String(m.name ?? m.id), {
        fontFamily: '"Cinzel Decorative", serif', fontSize: `${ui(16)}px`, color: '#ffffff',
        align: 'center', wordWrap: { width: cw - 20 },
      }).setOrigin(0.5);
      this.add.text(cx, cy + chh * 0.22, `difficulty: ${String(m.difficulty ?? '?')}`, {
        fontFamily: '"Cinzel", serif', fontSize: `${ui(12)}px`, color: '#aaaaaa',
      }).setOrigin(0.5);
      bg.on('pointerover', () => bg.setFillStyle(0x2a2a4e));
      bg.on('pointerout', () => bg.setFillStyle(0x1a1a2e));
      bg.on('pointerdown', () => {
        this.registry.set('mapId', m.id);
        this.scene.start('CharSelectScene');
      });
    });

    this.add.text(w/2, h - ui(56), '◀ BACK', {
      fontFamily: '"Cinzel", serif', fontSize: `${ui(20)}px`, color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenu'));
  }
}
