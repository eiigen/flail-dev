import Phaser from 'phaser';

export class Boot extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload(): void {
    this.load.setPath('assets/');
  }

  create(): void {
    this.scene.start('Preload');
  }
}
