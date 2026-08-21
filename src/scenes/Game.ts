import Phaser from 'phaser';
import { World } from '@/ecs/World';
import { GameConfig } from '@/GameConfig';
import { SettingsManager } from '@/systems/SettingsManager';
import { SaveManager } from '@/systems/SaveManager';
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
import { ProjectileSystem } from '@/systems/ProjectileSystem';
import { VFXSystem } from '@/systems/VFXSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { AnalyticsSystem } from '@/systems/AnalyticsSystem';
import { AccessibilitySystem } from '@/systems/AccessibilitySystem';
import { PolliSystem } from '@/systems/PolliSystem';
import { CTransform } from '@/components/CTransform';
import { CSprite } from '@/components/CSprite';
import { CAI } from '@/components/CAI';
import { CHealth } from '@/components/CHealth';
import { CWeapon } from '@/components/CWeapon';
import { CExp } from '@/components/CExp';
import { CInventory } from '@/components/CInventory';
import { CProjectile } from '@/components/CProjectile';
import type { Entity } from '@/ecs/Entity';

export class Game extends Phaser.Scene {
  world!: World;
  settings!: SettingsManager;
  saveManager!: SaveManager;
  entitySprites = new Map<number, Phaser.GameObjects.Sprite>();
  private floorLayer!: Phaser.GameObjects.Group;
  private elapsedMs = 0;

  constructor() {
    super({ key: 'Game' });
  }

  create(): void {
    this.world = new World();
    this.saveManager = new SaveManager();
    this.settings = new SettingsManager(this.saveManager.current.settings);

    // Register aniamtion keys once per texture
    this.createAnims();

    // Floor
    this.floorLayer = this.add.group();

    this.world.addSystem(new InputSystem(this, this.settings));
    this.world.addSystem(new MovementSystem(this));
    this.world.addSystem(new CombatSystem(this));
    this.world.addSystem(new ProjectileSystem(this));
    this.world.addSystem(new ExpSystem());
    this.world.addSystem(new LevelUpSystem(this, this.settings));
    this.world.addSystem(new EvolutionSystem(this, this.settings));
    this.world.addSystem(new MapGenSystem(this));
    this.world.addSystem(new WaveDirector());
    this.world.addSystem(new EnemySpawner(this));
    // Animated boss encounter later; keep system for wave events
    this.world.addSystem(new BossEncounterSystem(this));
    this.world.addSystem(new VFXSystem(this, this.settings));
    this.world.addSystem(new AudioSystem(this, this.settings));
    if (GameConfig.version === 'polli') {
      this.world.addSystem(new PolliSystem(this, this.settings));
    }
    this.world.addSystem(new AnalyticsSystem(this, this.settings));
    this.world.addSystem(new AccessibilitySystem(this, this.settings));

    // Player — selected character (registry) with per-char rig + starter weapon
    const charId = (this.registry.get('charId') as string) ?? 'apprentice_mage';
    const mapId = (this.registry.get('mapId') as string) ?? 'cursed_forest';
    const charDef = (this.cache.json.get('characters')?.characters ?? [])
      .find((c: any) => c.id === charId);
    const spriteKey: string = (this.registry.get('charSpriteKey') as string) ?? charDef?.spriteKey ?? 'character_yellow_idle';
    const rigColor = spriteKey.replace('character_', '').replace('_idle', '');
    const weaponId: string = (this.registry.get('startingWeaponId') as string) ?? charDef?.startingWeaponId ?? 'fire_staff';

    const playerX = this.scale.width / 2;
    const playerY = this.scale.height * 0.42;
    const player = this.world.createEntity();
    player.addComponent('CTransform', new CTransform({ x: playerX, y: playerY }));
    player.addComponent('CAI', new CAI({ type: 'player' }));
    player.addComponent('CHealth', new CHealth({ max: 100, current: 100 }));
    player.addComponent('CExp', new CExp({ current: 0, level: 1, nextThreshold: 100 }));
    player.addComponent('CSprite', new CSprite({ frame: `character_${rigColor}`, tint: 0xffffff, scale: 2.2 }));
    player.addComponent('CWeapon', new CWeapon({ weaponId, cooldown: 0 }));
    // ponytail: mirror starting weapon into inventory so weapon-ingredient
    // recipes (z_inferno_staff) are reachable in a normal run
    const inv = new CInventory();
    inv.add('fire_staff', 1);
    player.addComponent('CInventory', inv);

    // hand loaded recipes to the evolution system
    const recipes = this.cache.json.get('recipes')?.recipes ?? [];
    this.world.emit('recipes-loaded', { recipes });

    // Music via AudioSystem (map-start event)
    this.world.emit('map-start', { mapId, seed: `flail-${mapId}-1` });
    this.world.emit('run_start', { runId: String(Date.now()) });
    this.world.on('evolve', (data: { result: string }) => {
      const chars = this.cache.json.get('characters')?.characters ?? [];
      for (const c of chars) {
        const req = c.unlockReq;
        if (req?.type === 'evolve_weapon' && req.target === data.result &&
            !this.saveManager.current.unlockedChars.includes(c.id)) {
          this.saveManager.current.unlockedChars.push(c.id);
          this.saveManager.save();
          this.world.emit('sr-announce', `Character unlocked: ${c.name}`);
        }
      }
    });
    // kill-count achievements
    let kills = 0;
    this.world.on('enemy-killed', () => {
      kills++;
      const ach = this.saveManager.current.achievements ??= {};
      for (const a of (this.cache.json.get('achievements')?.achievements ?? [])) {
        if (a.condition?.type !== 'kill_count') continue;
        const rec = (ach[a.id] ??= { unlocked: false, progress: 0 });
        rec.progress = kills;
        if (!rec.unlocked && kills >= (a.condition.params?.count ?? 1)) {
          rec.unlocked = true;
          this.world.emit('sr-announce', `Achievement: ${a.name}`);
        }
      }
      this.saveManager.save();
    });
    this.saveManager.current.currentRun = {
      runId: String(Date.now()), mapId, charId, wave: 1, time: 0,
    };
    this.saveManager.save();

    // Create the player sprite NOW so the camera can follow it.
    const pSprite = this.add.sprite(playerX, playerY, GameConfig.atlasKey, spriteKey)
      .setScale(2.2).setDepth(100);
    pSprite.play(`character_${rigColor}_walk`);
    this.entitySprites.set(player.id, pSprite);

    // Camera follow — NO bounds: infinite field, the camera must always track
    // the player. A finite setBounds(0,0,…) made the camera stick at the world
    // origin edge, so moving up left the player off-screen ("black screen").
    const cam = this.cameras.main;
    cam.startFollow(pSprite, true, 0.15, 0.15);
    this.scene.launch('UIOverlay');
    this.scene.launch('CutsceneLayer');
  }

  update(_time: number, delta: number): void {
    this.elapsedMs += delta;
    if (this.world.paused) {
      // still allow animations? no, freeze
      return;
    }
    this.world.step(GameConfig.fixedTimestep);
    this.reconcile();
    void this.elapsedMs;
  }

  reconcile(): void {
    for (const e of this.world.query('CTransform', 'CSprite')) {
      const t = e.getComponent<CTransform>('CTransform')!;
      const s = e.getComponent<CSprite>('CSprite')!;
      let sprite = this.entitySprites.get(e.id);
      if (!sprite) {
        sprite = this.add.sprite(t.x, t.y, GameConfig.atlasKey, this.baseFrame(s));
        sprite.setDepth(100);
        this.entitySprites.set(e.id, sprite);
        this.startAnim(sprite, e);
      }
      sprite.setPosition(t.x, t.y).setScale(s.scale).setTint(s.tint);
      // move anim flip
      sprite.flipX = false;
    }
    for (const [id, sprite] of this.entitySprites) {
      if (!this.world.entities.find((e) => e.id === id)) {
        sprite.destroy();
        this.entitySprites.delete(id);
      }
    }
  }

  private baseFrame(s: CSprite): string {
    // Map semantic names to atlas frames
    const f = s.frame;
    if (f === 'player') return 'character_yellow_idle';
    if (f === 'enemy_skeleton') return 'slime_normal_rest';
    if (f === 'proj') return 'gem_red';
    if (f.startsWith('enemy_')) return f.replace('enemy_', '') + '_rest';
    return f;
  }

  private startAnim(sprite: Phaser.GameObjects.Sprite, e: Entity): void {
    const ai = e.getComponent<CAI>('CAI');
    if (!ai) return;
    if (ai.type === 'player') {
      sprite.play('character_yellow_walk');
    } else if (ai.type === 'melee') {
      // pick anim by enemy frame
      const s = e.getComponent<CSprite>('CSprite')!;
      const key = this.enemyAnimKey(s.frame);
      if (key) sprite.play(key);
    }
  }

  private enemyAnimKey(frame: string): string {
    const base = frame.replace('enemy_', '');
    const candidates = ['slime_normal', 'snail', 'mouse', 'ladybug', 'worm_normal', 'slime_fire'];
    for (const c of candidates) {
      if (base.includes(c)) return c + '_walk';
    }
    return 'slime_normal_walk';
  }

  private createAnims(): void {
    const make = (key: string, frames: string[], frameRate = 6, repeat = -1) => {
      if (this.anims.exists(key)) return;
      this.anims.create({ key, frames: frames.map(f => ({ key: 'main', frame: f })), frameRate, repeat });
    };
    const chars = ['yellow', 'purple', 'pink', 'green', 'beige'];
    for (const c of chars) make(`character_${c}_walk`, [`character_${c}_walk_a`, `character_${c}_walk_b`]);
    make('slime_normal_walk', ['slime_normal_walk_a', 'slime_normal_walk_b']);
    make('slime_fire_walk', ['slime_fire_walk_a', 'slime_fire_walk_b']);
    make('snail_walk', ['snail_walk_a', 'snail_walk_b']);
    make('mouse_walk', ['mouse_walk_a', 'mouse_walk_b']);
    make('ladybug_walk', ['ladybug_walk_a', 'ladybug_walk_b']);
    make('worm_normal_walk', ['worm_normal_move_a', 'worm_normal_move_b']);
  }
}
