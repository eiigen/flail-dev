import Phaser from 'phaser';
import type { World } from '@/ecs/World';
import type { Game } from './Game';
import type { LevelUpChoice } from '@/systems/LevelUpSystem';
import { CHealth } from '@/components/CHealth';
import { CAI } from '@/components/CAI';
import { CTransform } from '@/components/CTransform';
import { CExp } from '@/components/CExp';
import { ui } from '@/utils/ui';

export class UIOverlay extends Phaser.Scene {
  private world!: World;
  private game!: Game;
  private hpFill!: Phaser.GameObjects.Rectangle;
  private xpFill!: Phaser.GameObjects.Rectangle;
  private killsText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private kills = 0;
  private joyThumb!: Phaser.GameObjects.Arc;
  private joyActive = false;
  private joyPointerId = -1;
  private joyX = 0;
  private joyY = 0;
  private joyClampR = 0;
  private modal!: Phaser.GameObjects.Container;
  private modalBtns: Phaser.GameObjects.Rectangle[] = [];
  private joyBase!: Phaser.GameObjects.Arc;
  private currentChoices: LevelUpChoice[] = [];
  private evoModal?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'UIOverlay' });
  }

  create(): void {
    this.game = this.scene.get('Game') as Game;
    this.world = this.game.world;
    const w = this.scale.width;
    const h = this.scale.height;
    const isTouch = this.sys.game.device.input.touch;
    // ponytail: the game canvas is a fixed 1280x720 FIT box, so scale.width is
    // always 1280. Judge mobility by the real viewport instead.
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;

    // ── HUD top bar ──
    this.add.text(16, 12, 'FLAIL', {
      fontFamily: '"Cinzel Decorative", serif', fontSize: `${ui(isMobile ? 20 : 26)}px`,
      color: '#cc88ff', stroke: '#000', strokeThickness: 2,
    });

    // HP bar (top-left under title)
    this.add.rectangle(16, 52, Math.min(ui(230), w * 0.4), ui(14), 0x111111, 0.8).setOrigin(0, 0.5).setStrokeStyle(1, 0x444444);
    this.hpFill = this.add.rectangle(18, 52, Math.min(ui(222), w * 0.4 - 4), ui(10), 0x44cc44).setOrigin(0, 0.5);

    // XP bar (below HP)
    this.add.rectangle(16, 70, Math.min(ui(230), w * 0.4), ui(10), 0x111111, 0.8).setOrigin(0, 0.5).setStrokeStyle(1, 0x444444);
    this.xpFill = this.add.rectangle(18, 70, Math.min(ui(222), w * 0.4 - 4), ui(6), 0xcc88ff).setOrigin(0, 0.5);

    this.levelText = this.add.text(244, 44, 'Lv 1', {
      fontFamily: '"Press Start 2P", monospace', fontSize: `${ui(15)}px`, color: '#ffcc00',
    });

    this.killsText = this.add.text(16, 90, '☠ 0', {
      fontFamily: '"Cinzel", serif', fontSize: `${ui(17)}px`, color: '#ff8888',
    });

    // Wave banner (top-center)
    this.waveText = this.add.text(w / 2, 24, '', {
      fontFamily: '"Cinzel Decorative", serif', fontSize: `${ui(24)}px`, color: '#ffffff',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);

    // ── Virtual joystick ──
    if (isTouch || isMobile) {
      this.joyX = ui(112);
      this.joyY = h - ui(112);
      const baseR = ui(66);
      const thumbR = ui(27);
      this.joyClampR = baseR - thumbR;
      this.joyBase = this.add.circle(this.joyX, this.joyY, baseR, 0xffffff, 0.15)
        .setStrokeStyle(2, 0xffffff, 0.3);
      this.joyThumb = this.add.circle(this.joyX, this.joyY, thumbR, 0xffffff, 0.4);

      this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (this.modal && this.modal.visible) return;
        if (p.x < w * 0.5 && p.y > h * 0.4) {
          this.joyActive = true;
          this.joyPointerId = p.id;
          this.updateJoystick(p.x, p.y);
        }
      });
      this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
        if (!this.joyActive || p.id !== this.joyPointerId) return;
        this.updateJoystick(p.x, p.y);
      });
      this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
        if (p.id !== this.joyPointerId) return;
        this.joyActive = false;
        this.joyPointerId = -1;
        this.joyThumb.setPosition(this.joyX, this.joyY);
        this.world.emit('joy-input', { dx: 0, dy: 0 });
      });
    } else {
      // Desktop: WASD hint
      this.add.text(w - 12, h - 12, 'WASD: move  ·  Space: dash', {
        fontFamily: '"Cinzel", serif', fontSize: `${ui(15)}px`, color: '#888888',
      }).setOrigin(1, 1);
    }

    // ── World events ──
    this.world.on('enemy-killed', () => {
      this.kills++;
      this.killsText.setText(`☠ ${this.kills}`);
    });
    this.world.on('wave-reached', (data: { wave: number }) => {
      this.showWave(data.wave);
    });
    this.world.on('show-levelup', (data: { choices: LevelUpChoice[]; level: number }) => {
      this.currentChoices = data.choices;
      this.showLevelUp(data.choices, data.level);
    });
    this.world.on('show-evolution', (data: { recipeName: string; queueLength: number }) => {
      this.showEvolution(data.recipeName);
    });
    this.world.on('player-died', () => this.showGameOver());
  }

  private showGameOver(): void {
    const w = this.scale.width, h = this.scale.height;
    const panel = this.add.container(w / 2, h / 2).setDepth(700);
    panel.add(this.add.rectangle(0, 0, Math.min(480, w - 60), 300, 0x1a1a2e, 0.97)
      .setStrokeStyle(3, 0xcc4444));
    panel.add(this.add.text(0, -110, 'YOU DIED', {
      fontFamily: '"Press Start 2P", monospace', fontSize: `${ui(24)}px`, color: '#ff6666',
    }).setOrigin(0.5));
    panel.add(this.add.text(0, -58, `Wave ${(this.world as any).__wave ?? 1}  ·  ${this.kills} kills`, {
      fontFamily: '"Cinzel", serif', fontSize: `${ui(16)}px`, color: '#cccccc',
    }).setOrigin(0.5));
    const mk = (x: number, label: string, cb: () => void) => {
      const b = this.add.rectangle(x, 40, ui(170), ui(52), 0x2a2a4e, 0.95)
        .setStrokeStyle(2, 0xcc88ff).setInteractive({ useHandCursor: true });
      panel.add(b);
      panel.add(this.add.text(x, 40, label, {
        fontFamily: '"Cinzel", serif', fontSize: `${ui(17)}px`, color: '#ffffff',
      }).setOrigin(0.5));
      b.on('pointerdown', cb);
    };
    mk(-100, 'RETRY', () => this.scene.start('Game'));
    mk(100, 'MENU', () => this.scene.start('MainMenu'));
  }

  private updateJoystick(px: number, py: number): void {
    let dx = px - this.joyX;
    let dy = py - this.joyY;
    const dist = Math.hypot(dx, dy);
    if (dist > this.joyClampR) {
      dx = (dx / dist) * this.joyClampR;
      dy = (dy / dist) * this.joyClampR;
    }
    this.joyThumb.setPosition(this.joyX + dx, this.joyY + dy);
    const nx = dist > 0 ? dx / this.joyClampR : 0;
    const ny = dist > 0 ? dy / this.joyClampR : 0;
    this.world.emit('joy-input', { dx: nx, dy: ny });
  }

  private showWave(wave: number): void {
    this.waveText.setText(`— WAVE ${wave} —`).setAlpha(1);
    this.tweens.add({
      targets: this.waveText, alpha: 0, delay: 1500, duration: 800,
    });
  }

  private showLevelUp(choices: LevelUpChoice[], level: number): void {
    // Freeze world further in UI; build modal
    this.modalBtns = [];
    const w = this.scale.width, h = this.scale.height;
    const overlay = this.add.rectangle(0, 0, w * 2, h * 2, 0x000000, 0.55).setOrigin(0);

    const panel = this.add.container(w / 2, h / 2);
    const bg = this.add.rectangle(0, 0, Math.min(520, w - 40), Math.min(360, h - 40), 0x1a1a2e, 0.95)
      .setStrokeStyle(3, 0xcc88ff);
    panel.add(bg);
    panel.add(this.add.text(0, -140, `LEVEL ${level}!`, {
      fontFamily: '"Press Start 2P", monospace', fontSize: `${ui(24)}px`, color: '#ffcc00',
    }).setOrigin(0.5));
    panel.add(this.add.text(0, -108, 'Choose a blessing', {
      fontFamily: '"Cinzel", serif', fontSize: `${ui(17)}px`, color: '#aaaaaa',
    }).setOrigin(0.5));

    const choiceW = Math.min(ui(420), w - 80);
    const startY = ui(-38);
    const rowGap = ui(74);
    choices.forEach((c, i) => {
      const y = startY + i * rowGap;
      const btn = this.add.rectangle(0, y, choiceW, ui(58), 0x2a2a4e, 0.9)
        .setStrokeStyle(2, 0xcc88ff)
        .setInteractive({ useHandCursor: true });
      panel.add(btn);
      panel.add(this.add.text(0, y - 10, c.name, {
        fontFamily: '"Cinzel Decorative", serif', fontSize: `${ui(18)}px`, color: '#ffffff',
      }).setOrigin(0.5));
      panel.add(this.add.text(0, y + 14, c.desc, {
        fontFamily: '"Cinzel", serif', fontSize: `${ui(13)}px`, color: '#bbbbbb',
      }).setOrigin(0.5));
      btn.on('pointerover', () => btn.setFillStyle(0x3a3a6e));
      btn.on('pointerout', () => btn.setFillStyle(0x2a2a4e));
      btn.on('pointerdown', () => this.pick(i));
      this.modalBtns.push(btn);
    });

    this.modal = panel;
    this.modal.visible = true;
    this.scene.pause('Game');

    // keyboard picks (desktop UX + deterministic testing)
    const kb = this.input.keyboard!;
    const onKey = (i: number) => () => { if (this.modal?.visible) this.pick(i); };
    kb.once('keydown-ONE', onKey(0));
    kb.once('keydown-TWO', onKey(1));
    kb.once('keydown-THREE', onKey(2));
  }

  private showEvolution(recipeName: string): void {
    const w = this.scale.width, h = this.scale.height;
    const panel = this.add.container(w / 2, h / 2).setDepth(600);
    panel.add(this.add.rectangle(0, 0, Math.min(460, w - 60), 240, 0x1a1a2e, 0.96)
      .setStrokeStyle(3, 0xffcc00));
    panel.add(this.add.text(0, -78, '✦ EVOLUTION ✦', {
      fontFamily: '"Press Start 2P", monospace', fontSize: `${ui(19)}px`, color: '#ffcc00',
    }).setOrigin(0.5));
    panel.add(this.add.text(0, -30, `Evolve into ${recipeName}?`, {
      fontFamily: '"Cinzel", serif', fontSize: `${ui(21)}px`, color: '#ffffff',
    }).setOrigin(0.5));

    const mkBtn = (x: number, label: string, accept: boolean) => {
      const b = this.add.rectangle(x, ui(42), ui(160), ui(54), accept ? 0x2e5e2e : 0x5e2e2e, 0.95)
        .setStrokeStyle(2, accept ? 0x66cc66 : 0xcc6666)
        .setInteractive({ useHandCursor: true });
      panel.add(b);
      panel.add(this.add.text(x, ui(42), label, {
        fontFamily: '"Cinzel", serif', fontSize: `${ui(19)}px`, color: '#ffffff',
      }).setOrigin(0.5));
      b.on('pointerdown', () => this.answerEvolution(accept));
      return b;
    };
    mkBtn(-90, 'YES', true);
    mkBtn(90, 'NO', false);
    panel.add(this.add.text(0, ui(96), 'Y / N keys · evolves consume ingredients', {
      fontFamily: '"Cinzel", serif', fontSize: `${ui(13)}px`, color: '#888888',
    }).setOrigin(0.5));

    this.evoModal = panel;
    const kb = this.input.keyboard!;
    kb.once('keydown-Y', () => this.answerEvolution(true));
    kb.once('keydown-N', () => this.answerEvolution(false));
  }

  private answerEvolution(accept: boolean): void {
    if (!this.evoModal) return;
    this.evoModal.destroy();
    this.evoModal = undefined as unknown as Phaser.GameObjects.Container;
    const gs = this.scene.get('Game') as Game;
    const evo = gs.world.systems.find(s => s.name === 'EvolutionSystem') as any;
    if (evo?.confirmEvolution) evo.confirmEvolution(gs.world, accept);
  }

  private pick(i: number): void {
    const choice = this.currentChoices[i];
    if (!choice) return;
    const gameScene = this.scene.get('Game') as Game;
    const lv = gameScene.world.systems.find(s => s.name === 'LevelUpSystem') as any;
    if (lv && lv.applyChoice) lv.applyChoice(gameScene.world, choice.id);
    this.input.keyboard?.removeAllListeners();
    this.modal.destroy();
    this.scene.resume('Game');
  }

  update(): void {
    if (!this.world) return;
    // finger left the canvas / pointercancel: release the joystick or movement freezes
    if (this.joyActive && !this.input.activePointer.isDown) {
      this.joyActive = false;
      this.joyPointerId = -1;
      this.joyThumb.setPosition(this.joyX, this.joyY);
      this.world.emit('joy-input', { dx: 0, dy: 0 });
    }
    const player = [...this.world.query('CTransform', 'CHealth', 'CAI')]
      .find(e => e.getComponent<CAI>('CAI')!.type === 'player');
    if (player) {
      const hp = player.getComponent<CHealth>('CHealth')!;
      const pct = Math.max(0, hp.current / hp.max);
      this.hpFill.width = 216 * pct;
      this.hpFill.fillColor = pct > 0.5 ? 0x44cc44 : pct > 0.25 ? 0xcccc44 : 0xcc4444;
      const exp = player.getComponent<CExp>('CExp');
      if (exp) {
        this.xpFill.width = 216 * Math.min(1, exp.current / exp.nextThreshold);
        this.levelText.setText(`Lv ${exp.level}`);
      }
    }
  }
}
