import Phaser from 'phaser';
import type { Game } from './Game';

export class CutsceneLayer extends Phaser.Scene {
  private dialogueBox!: Phaser.GameObjects.Container;
  private dialogueText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'CutsceneLayer' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.dialogueBox = this.add.container(width / 2, height - 90).setAlpha(0);
    const bg = this.add.rectangle(0, 0, width - 40, 120, 0x000000, 0.85).setStrokeStyle(2, 0xcc88ff);
    this.dialogueText = this.add
      .text(-width / 2 + 40, -40, '', {
        fontFamily: '"Cinzel", serif',
        fontSize: '18px',
        color: '#eeeeee',
        wordWrap: { width: width - 120 },
      })
      .setOrigin(0, 0);
    this.dialogueBox.add([bg, this.dialogueText]);

    const game = this.scene.get('Game') as Game;
    game.world.on('boss-intro', (data: { dialogue: string }) => this.playBossIntro(data.dialogue));
  }

  playBossIntro(dialogue: string): void {
    this.dialogueBox.setAlpha(1);
    const game = this.scene.get('Game') as Game;
    game.cameras.main.zoomTo(1.5, 800);

    let i = 0;
    this.dialogueText.setText('');
    this.time.addEvent({
      delay: 30,
      repeat: dialogue.length - 1,
      callback: () => {
        this.dialogueText.setText(dialogue.substring(0, ++i));
      },
    });

    this.input.once('pointerdown', () => {
      game.cameras.main.zoomTo(1, 200);
      this.dialogueBox.setAlpha(0);
    });
  }
}
