import Phaser from 'phaser';
import { Boot, Preload, MainMenu, Game, UIOverlay, CutsceneLayer } from './scenes';
import { GameConfig } from './GameConfig';

new Phaser.Game({
  type: Phaser.WEBGL,
  width: GameConfig.width,
  height: GameConfig.height,
  parent: 'game',
  scene: [Boot, Preload, MainMenu, Game, UIOverlay, CutsceneLayer],
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  render: { antialias: false, pixelArt: true, roundPixels: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 3 },
});
