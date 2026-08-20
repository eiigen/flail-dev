import Phaser from 'phaser';
import { loadGameData } from '@/data/loaders';

export class Preload extends Phaser.Scene {
  constructor() {
    super({ key: 'Preload' });
  }

  preload(): void {
    const { width, height } = this.scale;
    const bg = this.add.rectangle(width / 2, height / 2, 400, 20, 0x222233);
    const fill = this.add.rectangle(width / 2 - 198, height / 2, 0, 16, 0xcc88ff);
    this.load.on('progress', (p: number) => {
      fill.width = 396 * p;
    });

    this.load.setPath('assets/');
    this.load.atlas('main', 'atlases/main.png', 'atlases/main.json');
    loadGameData(this);
    this.load.setPath('assets/');
    this.load.audio('music_menu', 'audio/music_menu.ogg');
  }

  create(): void {
    this.scene.start('MainMenu');
  }
}
