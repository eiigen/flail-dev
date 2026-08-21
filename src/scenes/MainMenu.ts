import Phaser from 'phaser';
import { GameConfig } from '@/GameConfig';
import { ui } from '@/utils/ui';
import { SaveManager } from '@/systems/SaveManager';

export class MainMenu extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const save = new SaveManager();
    const hasRun = !!save.current.currentRun;

    this.add.rectangle(w/2, h/2, w*2, h*2, 0x12121f).setDepth(-1);

    this.add.text(w / 2, h * 0.14, 'FLAIL', {
      fontFamily: '"Cinzel Decorative", serif',
      fontSize: `${ui(64)}px`, color: '#cc88ff',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    if (GameConfig.version === 'polli') {
      this.add.text(w / 2, h * 0.22, '⚡ POLLI VERSION ⚡', {
        fontFamily: '"Cinzel", serif', fontSize: `${ui(16)}px`, color: '#ffcc00',
      }).setOrigin(0.5);
    }

    const btnW = Math.min(ui(340), w * 0.72);
    const btnH = Math.min(ui(58), h * 0.06);
    const gap = btnH + ui(14);
    let y = h * 0.36;

    if (hasRun) {
      this.button(w/2, y, btnW, btnH, '▶  Continue Run', () => {
        const run = save.current.currentRun;
        if (run) {
          this.registry.set('mapId', run.mapId);
          this.registry.set('charId', run.charId);
          const def = (this.cache.json.get('characters')?.characters ?? [])
            .find((c: any) => c.id === run.charId);
          this.registry.set('charSpriteKey', def?.spriteKey);
          this.registry.set('startingWeaponId', def?.startingWeaponId ?? 'fire_staff');
        }
        this.scene.start('Game');
      });
      y += gap;
      this.button(w/2, y, btnW, btnH, '✦  New Run', () => {
        save.current.currentRun = undefined;
        save.save();
        this.scene.start('MapSelectScene');
      });
    } else {
      this.button(w/2, y, btnW, btnH, '✦  New Run', () => this.scene.start('MapSelectScene'));
      y += gap;
    }
    y += gap;
    this.button(w/2, y, btnW, btnH, '⬆  Upgrades', () => this.scene.start('UpgradesScene'));
    y += gap;
    this.button(w/2, y, btnW, btnH, '🏆  Achievements', () => this.scene.start('AchievementsScene'));
    y += gap;
    this.button(w/2, y, btnW, btnH, '⚙  Settings', () => this.scene.start('SettingsMenu'));
  }

  private button(x: number, y: number, bw: number, bh: number, label: string, cb: () => void): void {
    const bg = this.add.rectangle(x, y, bw, bh, 0x1a1a2e, 0.9)
      .setStrokeStyle(2, 0xcc88ff)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: '"Cinzel", serif', fontSize: `${ui(19)}px`, color: '#eeeeee',
    }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(0x2a2a4e));
    bg.on('pointerout',  () => bg.setFillStyle(0x1a1a2e));
    bg.on('pointerdown', cb);
  }
}
