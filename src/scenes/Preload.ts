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

    // Atlas for all sprites (characters, enemies, terrain, pickups)
    this.load.setPath('assets/');
    this.load.atlas('main', 'atlases/main.png', 'atlases/main.json');

    // Game data JSONs
    loadGameData(this);

    // Real SFX (Kenney CC0). No BGM loop yet (placeholder was a beep).
    this.load.setPath('assets/audio/');
    this.load.audio('coin', 'coin.ogg');
    this.load.audio('enemy_hit', 'enemy_hit.ogg');
    this.load.audio('evolve', 'evolve.ogg');
    this.load.audio('levelup', 'levelup.ogg');
    this.load.audio('player_attack', 'player_attack.ogg');
    this.load.audio('player_hit', 'player_hit.ogg');
  }

  create(): void {
    this.scene.start('MainMenu');
  }
}
