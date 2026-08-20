import Phaser from 'phaser';
import { World } from '@/ecs/World';
import { GameConfig } from '@/GameConfig';
import { SettingsManager } from '@/systems/SettingsManager';
import { InputSystem } from '@/systems/InputSystem';
import { MovementSystem } from '@/systems/MovementSystem';
import { CombatSystem } from '@/systems/CombatSystem';
import { ExpSystem } from '@/systems/ExpSystem';
import { LevelUpSystem } from '@/systems/LevelUpSystem';
import { EvolutionSystem } from '@/systems/EvolutionSystem';
import { MapGenSystem } from '@/systems/MapGenSystem';
import { WaveDirector } from '@/systems/WaveDirector';
import { EnemySpawner } from '@/systems/EnemySpawner';
import { BossEncounterSystem } from '@/systems/BossEncounterSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { VFXSystem } from '@/systems/VFXSystem';
import { AnalyticsSystem } from '@/systems/AnalyticsSystem';
import { AccessibilitySystem } from '@/systems/AccessibilitySystem';
import { PolliSystem } from '@/systems/PolliSystem';
import { CTransform } from '@/components/CTransform';
import { CSprite } from '@/components/CSprite';
import { CAI } from '@/components/CAI';
import { CHealth } from '@/components/CHealth';

export class Game extends Phaser.Scene {
  world!: World;
  settings!: SettingsManager;
  entitySprites = new Map<number, Phaser.GameObjects.Sprite>();

  constructor() {
    super({ key: 'Game' });
  }

  create(): void {
    this.world = new World();
    this.settings = new SettingsManager();

    // System order matters: input/movement before combat, combat before exp/levelup/evolution
    this.world.addSystem(new InputSystem(this, this.settings));
    this.world.addSystem(new MovementSystem());
    this.world.addSystem(new CombatSystem(this));
    this.world.addSystem(new ExpSystem());
    this.world.addSystem(new LevelUpSystem(this, this.settings));
    this.world.addSystem(new EvolutionSystem(this, this.settings));
    this.world.addSystem(new MapGenSystem(this));
    this.world.addSystem(new WaveDirector());
    this.world.addSystem(new EnemySpawner(this));
    this.world.addSystem(new BossEncounterSystem());
    this.world.addSystem(new AudioSystem(this, this.settings));
    this.world.addSystem(new VFXSystem(this, this.settings));
    if (GameConfig.version === 'polli') {
      this.world.addSystem(new PolliSystem(this, this.settings));
    }
    this.world.addSystem(new AnalyticsSystem(this, this.settings));
    this.world.addSystem(new AccessibilitySystem(this, this.settings));

    // ponytail: create the player so every player-gated system (movement/comb
    // /map/enemy-spawner) runs. frame 'player' isn't in the atlas → resolveFrame
    // falls back to a real frame, so the player still draws instead of black.
    const player = this.world.createEntity();
    player.addComponent('CTransform', new CTransform({ x: GameConfig.width / 2, y: GameConfig.height / 2 }));
    player.addComponent('CAI', new CAI({ type: 'player' }));
    player.addComponent('CHealth', new CHealth({ max: 100, current: 100 }));
    player.addComponent('CSprite', new CSprite({ atlasKey: 'main', frame: 'player', scale: 5 }));

    this.world.emit('run_start', { runId: String(Date.now()) });
    this.scene.launch('UIOverlay');
    this.scene.launch('CutsceneLayer');
  }

  update(_time: number, _delta: number): void {
    this.world.step(GameConfig.fixedTimestep);
    this.reconcile();
  }

  reconcile(): void {
    for (const e of this.world.query('CTransform', 'CSprite')) {
      const t = e.getComponent<CTransform>('CTransform')!;
      const s = e.getComponent<CSprite>('CSprite')!;
      let sprite = this.entitySprites.get(e.id);
      if (!sprite) {
        const frame = this.resolveFrame(s.atlasKey, s.frame);
        sprite = this.add.sprite(t.x, t.y, s.atlasKey, frame);
        this.entitySprites.set(e.id, sprite);
      }
      sprite.setPosition(t.x, t.y).setScale(s.scale).setTint(s.tint);
    }
    for (const [id, sprite] of this.entitySprites) {
      if (!this.world.entities.find((e) => e.id === id)) {
        sprite.destroy();
        this.entitySprites.delete(id);
      }
    }
  }

  /**
   * Resolve a sprite frame against the loaded atlas. If the (semantic) frame
   * name isn't present in the texture, fall back to the first frame so the
   * entity still renders instead of drawing nothing (which left the Game scene
   * black when atlas frame names didn't match the data's sprite keys).
   */
  private resolveFrame(atlasKey: string, frame: string): string {
    const tex = this.textures.get(atlasKey) as Phaser.Textures.Texture | undefined;
    if (!tex) return frame;
    if (tex.has(frame)) return frame;
    const names = tex.getFrameNames().filter((n): n is string => typeof n === 'string');
    // ponytail: prefer a character-like frame (denser, visible) over the first
    // frame, so the player/enemy show instead of a sparse/transparent tile.
    const charFrame = names.find((n) => /char|people|hero|adventur/i.test(n));
    if (charFrame) return charFrame;
    if (names[0]) return names[0];
    return frame;
  }
}
