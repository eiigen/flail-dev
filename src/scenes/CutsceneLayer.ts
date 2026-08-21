import Phaser from 'phaser';

export class CutsceneLayer extends Phaser.Scene {
  private dialogueBox!: Phaser.GameObjects.Container;
  private dialogueText!: Phaser.GameObjects.Text;
  private nameTag!: Phaser.GameObjects.Text;
  private skipHint!: Phaser.GameObjects.Text;
  private typing?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'CutsceneLayer' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.dialogueBox = this.add.container(width / 2, height - 110).setAlpha(0).setDepth(500);
    const bg = this.add.rectangle(0, 0, Math.min(width - 40, 900), 130, 0x000000, 0.85)
      .setStrokeStyle(2, 0xcc88ff);
    this.nameTag = this.add.text(-Math.min(width - 40, 900) / 2 + 24, -44, '', {
      fontFamily: '"Cinzel Decorative", serif', fontSize: '18px', color: '#cc88ff',
    });
    this.dialogueText = this.add.text(-Math.min(width - 40, 900) / 2 + 24, -14, '', {
      fontFamily: '"Cinzel", serif', fontSize: '18px', color: '#eeeeee',
      wordWrap: { width: Math.min(width - 120, 840) },
    });
    this.skipHint = this.add.text(Math.min(width - 40, 900) / 2 - 20, 44, 'tap to skip ▸', {
      fontFamily: '"Cinzel", serif', fontSize: '12px', color: '#888888',
    }).setOrigin(1, 0.5);
    this.dialogueBox.add([bg, this.nameTag, this.dialogueText, this.skipHint]);

    const gameScene = this.scene.get('Game');
    gameScene.events.on('boss-intro', this.playBossIntro, this);
    gameScene.events.on('boss-killed', this.playChestCinematic, this);
  }

  playBossIntro(data: { bossId: string; dialogue: string; bossEntityId?: number }): void {
    this.nameTag.setText(String(data.bossId ?? 'BOSS').replace(/_/g, ' ').toUpperCase());
    this.dialogueBox.setAlpha(1);
    this.typewriterText(data.dialogue);

    const cam = (this.scene.get('Game') as Phaser.Scene).cameras.main;
    cam.zoomTo(1.35, 800);

    this.input.once('pointerdown', () => this.endBossIntro(cam));
    this.time.delayedCall(4200, () => { if (this.dialogueBox.alpha > 0) this.endBossIntro(cam); });
  }

  private endBossIntro(cam: Phaser.Cameras.Scene2D.Camera): void {
    cam.zoomTo(1, 250);
    this.tweens.add({ targets: this.dialogueBox, alpha: 0, duration: 250 });
  }

  playChestCinematic(data: { x: number; y: number }): void {
    const cam = (this.scene.get('Game') as Phaser.Scene).cameras.main;
    cam.zoomTo(1.6, 600);
    // chest burst via world VFX event so particles come from the pooled system
    const gs = this.scene.get('Game') as any;
    gs.world?.emit('play-vfx', { type: 'evolve', x: data.x, y: data.y });
    this.time.delayedCall(1800, () => cam.zoomTo(1, 400));
  }

  private typewriterText(text: string): void {
    let i = 0;
    this.dialogueText.setText('');
    this.typing?.remove();
    this.typing = this.time.addEvent({
      delay: 28,
      repeat: text.length - 1,
      callback: () => { this.dialogueText.setText(text.substring(0, ++i)); },
    });
  }
}
