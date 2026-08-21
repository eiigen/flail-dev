import Phaser from 'phaser';
import { ui } from '@/utils/ui';
import { SaveManager } from '@/systems/SaveManager';

const UPGRADES = [
  { id: 'vitality',  name: 'Vitality',  desc: '+15 Max HP per level' },
  { id: 'power',     name: 'Power',     desc: '+8% damage per level' },
  { id: 'swiftness', name: 'Swiftness', desc: '+4% move speed per level' },
  { id: 'greed',     name: 'Greed',     desc: '+10% coins per level' },
];

export class UpgradesScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UpgradesScene' });
  }

  create(): void {
    this.draw();
  }

  private draw(): void {
    this.children.removeAll();
    const save = new SaveManager();
    const meta = save.current.meta ??= { coins: 0, upgrades: {}, beatenMaps: [] };
    const w = this.scale.width, h = this.scale.height;

    this.add.rectangle(w/2, h/2, w*2, h*2, 0x12121f).setDepth(-1);
    this.add.text(w/2, ui(56), 'PERMANENT UPGRADES', {
      fontFamily: '"Cinzel Decorative", serif', fontSize: `${ui(28)}px`,
      color: '#cc88ff', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);
    this.add.text(w/2, ui(96), `🪙 ${meta.coins} coins`, {
      fontFamily: '"Press Start 2P", monospace', fontSize: `${ui(14)}px`, color: '#ffcc00',
    }).setOrigin(0.5);

    let y = h * 0.18;
    for (const u of UPGRADES) {
      const lvl = meta.upgrades[u.id] ?? 0;
      const cost = Math.round(10 * Math.pow(lvl + 1, 1.6));
      const canBuy = meta.coins >= cost;
      const rowH = ui(78);
      this.add.rectangle(w/2, y + rowH/2 - 6, Math.min(ui(560), w - 40), rowH - 10,
        0x1a1a2e, 0.95).setStrokeStyle(1, canBuy ? 0x66cc66 : 0x333344);
      this.add.text(w/2 - Math.min(ui(270), (w-40)/2) + 16, y + rowH * 0.22,
        `${u.name}  Lv${lvl}`, {
        fontFamily: '"Cinzel", serif', fontSize: `${ui(16)}px`, color: '#ffffff',
      }).setOrigin(0, 0.5);
      this.add.text(w/2 - Math.min(ui(270), (w-40)/2) + 16, y + rowH * 0.62, u.desc, {
        fontFamily: '"Cinzel", serif', fontSize: `${ui(11)}px`, color: '#999999',
      }).setOrigin(0, 0.5);
      const btn = this.add.rectangle(w/2 + Math.min(ui(270), (w-40)/2) - ui(74), y + rowH/2 - 6,
        ui(120), ui(46), canBuy ? 0x2e5e2e : 0x333338, 0.95)
        .setStrokeStyle(2, canBuy ? 0x66cc66 : 0x444455)
        .setInteractive({ useHandCursor: canBuy });
      this.add.text(btn.x, btn.y, canBuy ? `🪙 ${cost}` : 'LOCKED', {
        fontFamily: '"Press Start 2P", monospace', fontSize: `${ui(10)}px`,
        color: canBuy ? '#aaffaa' : '#777777',
      }).setOrigin(0.5);
      if (canBuy) {
        btn.on('pointerdown', () => {
          meta.coins -= cost;
          meta.upgrades[u.id] = lvl + 1;
          save.save();
          this.draw();
        });
      }
      y += rowH;
    }

    this.add.text(w/2, h - ui(48), '◀ BACK', {
      fontFamily: '"Cinzel", serif', fontSize: `${ui(20)}px`, color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenu'));
  }
}
