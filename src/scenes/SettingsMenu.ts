import Phaser from 'phaser';
import { SaveManager } from '@/systems/SaveManager';

type CBMode = 'none' | 'deuteranope' | 'protanope';

export class SettingsMenu extends Phaser.Scene {
  private save!: SaveManager;
  private rows: Array<{ label: string; value: () => string; cycle: () => void }> = [];
  private remapping: { rowIdx: number; key: string } | null = null;
  private valueTexts = new Map<number, Phaser.GameObjects.Text>();

  constructor() {
    super({ key: 'SettingsMenu' });
  }

  create(): void {
    this.save = new SaveManager();
    const s = this.save.current.settings;
    const w = this.scale.width;
    const { height: h } = this.scale;

    // backdrop so the menu never floats on a black void
    this.add.rectangle(w / 2, h / 2, w * 2, h * 2, 0x12121f).setDepth(-1);
    this.add.rectangle(w / 2, h / 2, Math.min(680, w - 40), y0(h) + gap0(h) * 7 - 10,
      0x1a1a2e, 0.92).setStrokeStyle(2, 0xcc88ff, 0.5);
    function y0(h: number): number { return h * 0.24 - 20; }
    function gap0(h: number): number { return Math.min(56, h * 0.075); }

    this.add.text(w / 2, h * 0.1, 'SETTINGS', {
      fontFamily: '"Cinzel Decorative", serif', fontSize: '40px', color: '#cc88ff',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    const acc = s.accessibility;
    let y = h * 0.24;
    const gap = Math.min(56, h * 0.075);

    const addRow = (label: string, get: () => string, cycle: () => void) => {
      const idx = this.rows.length;
      this.add.text(w / 2 - 260, y, label, {
        fontFamily: '"Cinzel", serif', fontSize: '20px', color: '#dddddd',
      }).setOrigin(0, 0.5);
      const val = this.add.text(w / 2 + 260, y, get(), {
        fontFamily: '"Press Start 2P", monospace', fontSize: '14px', color: '#ffcc00',
      }).setOrigin(1, 0.5);
      this.valueTexts.set(idx, val);
      // invisible wide hit zone
      const hit = this.add.rectangle(w / 2, y, 560, gap - 8, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        if (label.startsWith('Key')) {
          this.remapping = { rowIdx: idx, key: label.slice(4).toLowerCase() };
          val.setColor('#66ff66').setText('press a key…');
        } else {
          cycle();
        }
        this.persist();
      });
      this.rows.push({ label, value: get, cycle });
      y += gap;
    };

    const vol = (key: 'masterVolume' | 'sfxVolume' | 'musicVolume') => () =>
      `${Math.round(s[key] * 100)}%`;
    const bump = (key: 'masterVolume' | 'sfxVolume' | 'musicVolume', d: number) => () => {
      s[key] = Math.min(1, Math.max(0, Math.round((s[key] + d) * 10) / 10));
    };
    const volCycle = (key: 'masterVolume' | 'sfxVolume' | 'musicVolume') => () => {
      bump(key, 0.1)(); if (Math.round(s[key] * 10) >= 10) s[key] = 0;
    };

    addRow('Master Volume', vol('masterVolume'), volCycle('masterVolume'));
    addRow('SFX Volume', vol('sfxVolume'), volCycle('sfxVolume'));
    addRow('Music Volume', vol('musicVolume'), volCycle('musicVolume'));
    addRow('Color-blind Mode', () => acc.colorBlind, () => {
      const order: CBMode[] = ['none', 'deuteranope', 'protanope'];
      acc.colorBlind = order[(order.indexOf(acc.colorBlind) + 1) % 3] as CBMode;
    });
    addRow('Reduced Motion', () => (acc.reducedMotion ? 'ON' : 'OFF'),
      () => { acc.reducedMotion = !acc.reducedMotion; });
    addRow('High Contrast', () => (acc.highContrast ? 'ON' : 'OFF'),
      () => { acc.highContrast = !acc.highContrast; this.applyContrast(); });

    const km = acc.keyMap;
    addRow(`Key Up (${km.up ?? 'W'})`, () => `key: ${(s.accessibility.keyMap.up ?? 'W')}`,
      () => {});
    addRow(`Key Left (${km.left ?? 'A'})`, () => `key: ${(s.accessibility.keyMap.left ?? 'A')}`,
      () => {});

    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (!this.remapping) return;
      const k = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      const which = this.remapping.key;
      (s.accessibility.keyMap as Record<string, string>)[which] = k;
      this.remapping = null;
      this.scene.restart();
    });

    this.add.text(w / 2, h * 0.9, '◀ BACK', {
      fontFamily: '"Cinzel", serif', fontSize: '22px', color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenu'));

    this.applyContrast();
  }

  private applyContrast(): void {
    document.body.style.filter =
      this.save.current.settings.accessibility.highContrast ? 'contrast(150%)' : '';
  }

  private persist(): void {
    for (const [idx, txt] of this.valueTexts) {
      const row = this.rows[idx];
      if (row && !row.label.startsWith('Key')) txt.setText(row.value());
    }
    this.save.save();
  }
}
