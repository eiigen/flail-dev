import type Phaser from 'phaser';

export function loadGameData(scene: Phaser.Scene): void {
  scene.load.setPath('assets/data/');
  scene.load.json('characters', 'characters.json');
  scene.load.json('weapons', 'weapons.json');
  scene.load.json('recipes', 'recipes.json');
  scene.load.json('maps', 'maps.json');
  scene.load.json('enemies', 'enemies.json');
  scene.load.json('bosses', 'bosses.json');
  scene.load.json('achievements', 'achievements.json');
  scene.load.json('audio', 'audio.json');
  scene.load.json('polli-fallback', 'polli-fallback.json');
}
