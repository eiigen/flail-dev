import Phaser from 'phaser';
import { ui } from '@/utils/ui';
import { SaveManager } from '@/systems/SaveManager';

export class AchievementsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AchievementsScene' });
  }

  create(): void {
    const save = new SaveManager();
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w/2, h/2, w*2, h*2, 0x12121f).setDepth(-1);
    this.add.text(w/2, ui(64), 'ACHIEVEMENTS', {
      fontFamily: '"Cinzel Decorative", serif', fontSize: `${ui(32)}px`,
      color: '#cc88ff', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    const list = this.cache.json.get('achievements')?.achievements ?? [];
    const rowH = ui(74);
    const panelW = Math.min(ui(560), w - 40);
    let y = h * 0.16;
    for (const a of list) {
      const rec = save.current.achievements?.[a.id];
      const done = !!rec?.unlocked;
      const prog = rec?.progress ?? 0;
      const target = a.condition?.params?.count ?? 1;
      const bg = this.add.rectangle(w/2, y, panelW, rowH - 8,
        done ? 0x1e2e1e : 0x1a1a2e, 0.95).setStrokeStyle(1, done ? 0x66cc66 : 0x333344);
      this.add.text(w/2 - panelW/2 + 16, y - rowH * 0.16, `${done ? '★' : '☆'} ${String(a.name)}`, {
        fontFamily: '"Cinzel", serif', fontSize: `${ui(15)}px`, color: done ? '#aaffaa' : '#dddddd',
      }).setOrigin(0, 0.5);
      this.add.text(w/2 - panelW/2 + 16, y + rowH * 0.18, String(a.desc ?? ''), {
        fontFamily: '"Cinzel", serif', fontSize: `${ui(11)}px`, color: '#999999',
      }).setOrigin(0, 0.5);
      if (!done && target > 1) {
        this.add.text(w/2 + panelW/2 - 16, y, `${prog}/${target}`, {
          fontFamily: '"Press Start 2P", monospace', fontSize: `${ui(10)}px`, color: '#ffcc00',
        }).setOrigin(1, 0.5);
      }
      void bg;
      y += rowH;
    }

    this.add.text(w/2, h - ui(52), '◀ BACK', {
      fontFamily: '"Cinzel", serif', fontSize: `${ui(20)}px`, color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenu'));
  }
}
