import Phaser from 'phaser';
import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import type { SettingsManager } from './SettingsManager';

export class AudioSystem implements System {
  name = 'AudioSystem';
  private music: Phaser.Sound.BaseSound | null = null;
  private settings: SettingsManager;

  constructor(private scene: Phaser.Scene, settings: SettingsManager) {
    this.settings = settings;
  }

  init(world: World): void {
    world.on('map-start', (data: { mapId: string }) => {
      const track = this.scene.cache.audio.get(`music_${data.mapId}`) ? `music_${data.mapId}` : 'music_menu';
      this.playMusic(track);
    });
    world.on('play-sfx', (key: string) => this.playSfx(key));
  }

  playMusic(key: string): void {
    if (this.music) this.music.stop();
    this.music = this.scene.sound.add(key, {
      loop: true,
      volume: this.settings.get('musicVolume') * this.settings.get('masterVolume'),
    });
    this.music.play();
  }

  playSfx(key: string): void {
    const vol = this.settings.get('sfxVolume') * this.settings.get('masterVolume');
    try {
      const s = this.scene.sound.add(key, { volume: vol });
      s.play();
      s.once('complete', () => s.destroy());
    } catch {
      /* ponytail: missing audio key, ignore */
    }
  }

  update(_world: World, _dt: number): void {}
}
