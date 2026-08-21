import Phaser from 'phaser';
import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import { CTransform } from '@/components/CTransform';
import { CHealth } from '@/components/CHealth';
import { CAI } from '@/components/CAI';
import { CSprite } from '@/components/CSprite';

interface BossDef { id: string; name: string; variants: string[] }

export class BossEncounterSystem implements System {
  name = 'BossEncounterSystem';
  private activeBoss = -1;
  private lastBossPos: CTransform | null = null;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  init(world: World): void {
    world.on('boss-wave', (data: { bossId: string }) => this.spawnBoss(world, data.bossId));
    world.on('spawn-chest', (data: { x: number; y: number }) => this.spawnChest(world, data.x, data.y));
  }

  private bossDefs(): BossDef[] {
    return (this.scene.cache.json.get('bosses')?.bosses ?? []) as BossDef[];
  }

  private spawnBoss(world: World, bossId: string): void {
    if (this.activeBoss >= 0) return; // one boss at a time
    const defs = this.bossDefs();
    const def = defs.find(b => b.id === bossId) ?? defs[0];
    if (!def) return;
    const variant = def.variants.length
      ? def.variants[Math.floor(Math.random() * def.variants.length)]!
      : '...';

    const players = [...world.query('CTransform', 'CAI')]
      .filter(e => e.getComponent<CAI>('CAI')!.type === 'player');
    const pt = players[0]?.getComponent<CTransform>('CTransform');

    const boss = world.createEntity();
    boss.addComponent('CTransform', new CTransform({
      x: (pt?.x ?? 400),
      y: (pt?.y ?? 300) - 320,
    }));
    boss.addComponent('CHealth', new CHealth({ max: 600, current: 600 }));
    boss.addComponent('CAI', new CAI({ type: 'boss', state: 'idle' }));
    boss.addComponent('CSprite', new CSprite({ frame: 'enemy_slime_fire', scale: 4.5, tint: 0xff6666 }));
    this.activeBoss = boss.id;
    this.lastBossPos = boss.getComponent<CTransform>('CTransform')!;

    // intro to BOTH buses: world (systems) + scene events (CutsceneLayer)
    const payload = { bossId: def.id, bossName: def.name, dialogue: variant, bossEntityId: boss.id };
    world.emit('boss-intro', payload);
    world.emit('play-vfx', { type: 'bossRoar', x: payload ? 0 : 0, y: 0 });
    (this.scene.events as Phaser.Events.EventEmitter).emit('boss-intro', payload);
    void bossId;
  }

  private spawnChest(world: World, x: number, y: number): void {
    const chest = world.createEntity();
    chest.addComponent('CTransform', new CTransform({ x, y }));
    chest.addComponent('CAI', new CAI({ type: 'melee', state: 'chest' }));
    chest.addComponent('CSprite', new CSprite({ frame: 'block_coin', scale: 2.2, tint: 0xffdd44 }));
  }

  update(world: World, dt: number): void {
    // boss death → chest + cinematic. The combat system may destroy the boss
    // entity before we read it, so track last-seen position and settle exactly once.
    if (this.activeBoss >= 0) {
      const boss = world.entities.find(e => e.id === this.activeBoss);
      const hp = boss?.getComponent<CHealth>('CHealth');
      const gone = !boss || !hp!.alive;
      if (gone) {
        const t = boss?.getComponent<CTransform>('CTransform') ?? this.lastBossPos;
        const x = t?.x ?? 400, y = t?.y ?? 300;
        world.emit('boss-killed', { bossId: this.activeBoss });
        (this.scene.events as Phaser.Events.EventEmitter).emit('boss-killed', { x, y });
        world.emit('spawn-chest', { x, y });
        world.emit('play-vfx', { type: 'death', x, y });
        this.activeBoss = -1;
      } else {
        this.lastBossPos = boss!.getComponent<CTransform>('CTransform')!;
      }
    }

    // chest pickup: player within 40px → heal + xp burst
    const player = [...world.query('CTransform', 'CAI')]
      .find(e => e.getComponent<CAI>('CAI')!.type === 'player');
    if (!player) return;
    const pt = player.getComponent<CTransform>('CTransform')!;
    for (const e of [...world.query('CTransform', 'CAI')]) {
      const ai = e.getComponent<CAI>('CAI')!;
      if (ai.state !== 'chest') continue;
      const t = e.getComponent<CTransform>('CTransform')!;
      if (Math.hypot(pt.x - t.x, pt.y - t.y) < 42) {
        const hp = player.getComponent<CHealth>('CHealth')!;
        hp.heal(50);
        world.emit('xp-granted', { entityId: player.id, amount: 60 });
        world.emit('play-sfx', 'coin');
        world.emit('play-vfx', { type: 'evolve', x: t.x, y: t.y });
        world.destroyEntity(e);
      }
    }
    void dt;
  }
}
