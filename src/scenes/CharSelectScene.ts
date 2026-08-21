import Phaser from 'phaser';
import { ui } from '@/utils/ui';
import { SaveManager } from '@/systems/SaveManager';

export class CharSelectScene extends Phaser.Scene {
  private save!: SaveManager;

  constructor() {
    super({ key: 'CharSelectScene' });
  }

  create(): void {
    this.save = new SaveManager();
    const w = this.scale.width, h = this.scale.height;
    const s = this.save.current;
    const unlocked: string[] = s.unlockedChars ?? [];
    // ensure both defaults are always playable
    for (const c of (this.cache.json.get('characters')?.characters ?? [])) {
      if (c.unlockReq?.type === 'default' && !unlocked.includes(c.id)) unlocked.push(c.id);
    }

    this.add.rectangle(w/2, h/2, w*2, h*2, 0x12121f).setDepth(-1);
    const mapName = this.registry.get('mapId') ?? 'cursed_forest';
    this.add.text(w/2, ui(60), 'CHOOSE CHARACTER', {
      fontFamily: '"Cinzel Decorative", serif', fontSize: `${ui(32)}px`,
      color: '#cc88ff', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);
    this.add.text(w/2, ui(100), `for ${String(mapName).replace(/_/g,' ')}`, {
      fontFamily: '"Cinzel", serif', fontSize: `${ui(14)}px`, color: '#888888',
    }).setOrigin(0.5);

    const chars = this.cache.json.get('characters')?.characters ?? [];
    const cols = w < h ? 3 : 5;
    const cell = Math.min(ui(150), (w - 50) / cols - 10);
    const startX = w / 2 - ((cols * (cell + 10)) - 10) / 2 + cell / 2;
    const startY = h * 0.16;

    chars.forEach((c: any, i: number) => {
      const cx = startX + (i % cols) * (cell + 10);
      const cy = startY + Math.floor(i / cols) * (cell + 44);
      const isUnlocked = unlocked.includes(c.id);
      const bg = this.add.rectangle(cx, cy, cell, cell, isUnlocked ? 0x1a1a2e : 0x15151d, 0.95)
        .setStrokeStyle(2, isUnlocked ? 0xcc88ff : 0x444455)
        .setInteractive({ useHandCursor: isUnlocked });

      if (isUnlocked || texHas(this, c.spriteKey)) {
        this.add.image(cx, cy - cell * 0.12, 'main', c.spriteKey).setScale(ui(2.4));
      }
      this.add.text(cx, cy + cell * 0.3, String(c.name ?? c.id), {
        fontFamily: '"Cinzel", serif', fontSize: `${ui(11)}px`,
        color: isUnlocked ? '#ffffff' : '#666677',
        align: 'center', wordWrap: { width: cell - 8 },
      }).setOrigin(0.5);

      if (!isUnlocked) {
        const req = c.unlockReq ?? {};
        let reqText = 'Locked';
        if (req.type === 'evolve_weapon') {
          reqText = req.target ? `Evolve ${String(req.target).replace(/_/g,' ')}` : `Evolve ${req.count} weapons`;
        } else if (req.type === 'find_secret') {
          reqText = 'Find the secret…';
        }
        this.add.text(cx, cy + cell * 0.44, `🔒 ${reqText}`, {
          fontFamily: '"Cinzel", serif', fontSize: `${ui(9)}px`, color: '#886677',
          align: 'center', wordWrap: { width: cell - 8 },
        }).setOrigin(0.5);
      } else {
        bg.on('pointerover', () => bg.setFillStyle(0x2a2a4e));
        bg.on('pointerout', () => bg.setFillStyle(0x1a1a2e));
        bg.on('pointerdown', () => {
          this.registry.set('charId', c.id);
          this.registry.set('charSpriteKey', c.spriteKey);
          this.registry.set('startingWeaponId', c.startingWeaponId ?? 'fire_staff');
          this.scene.start('Game');
        });
      }
    });

    this.add.text(w/2, h - ui(52), '◀ BACK', {
      fontFamily: '"Cinzel", serif', fontSize: `${ui(20)}px`, color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MapSelectScene'));
  }
}

function texHas(scene: Phaser.Scene, frame: string): boolean {
  const t = scene.textures.get('main');
  return !!t && t.has(frame);
}
