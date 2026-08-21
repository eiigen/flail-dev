import Phaser from 'phaser';
import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import { CTransform } from '@/components/CTransform';
import { CHealth } from '@/components/CHealth';
import { CAI } from '@/components/CAI';
import { CSprite } from '@/components/CSprite';

interface EnemyDef {
  id: string; name: string; spriteKey: string;
  hp: number; dmg: number; speed: number; xp: number;
}

export class EnemySpawner implements System {
  name = 'EnemySpawner';
  private spawnTimer = 0;
  private wave = 0;
  private spawnInterval = 1500;
  private difficulty = 1;
  private defs: EnemyDef[] | null = null;

  constructor(private scene: Phaser.Scene) {}

  init(world: World): void {
    world.on('wave-reached', (data: { wave: number; difficulty: number }) => {
      this.wave = data.wave;
      this.difficulty = data.difficulty ?? 1 + this.wave * 0.1;
      this.spawnInterval = Math.max(400, 1500 - this.wave * 40);
    });
  }

  private loadDefs(): EnemyDef[] {
    if (this.defs) return this.defs;
    const raw = (this.scene.cache.json.get('enemies')?.enemies ?? []) as EnemyDef[];
    // ponytail: only defs whose spriteKey exists render; keeps bad content inert
    const tex = this.scene.textures.get('main');
    this.defs = raw.filter(d => d.spriteKey && tex && tex.has(d.spriteKey));
    return this.defs;
  }

  update(world: World, dt: number): void {
    if (world.paused) return;
    const defs = this.loadDefs();
    if (defs.length === 0) return;

    this.spawnTimer += dt;
    if (this.spawnTimer < this.spawnInterval) return;
    this.spawnTimer = 0;

    const player = [...world.query('CTransform', 'CAI')]
      .find((e) => e.getComponent<CAI>('CAI')!.type === 'player');
    if (!player) return;
    const pt = player.getComponent<CTransform>('CTransform')!;

    const count = 1 + Math.min(4, Math.floor(this.wave / 2));
    for (let i = 0; i < count; i++) {
      const def = defs[Math.floor(Math.random() * defs.length)]!;
      const angle = Math.random() * Math.PI * 2;
      // ponytail: spawn just outside weapon range so combat engages fast
      const dist = 240 + Math.random() * 120;
      const enemy = world.createEntity();
      enemy.addComponent('CTransform', new CTransform({
        x: pt.x + Math.cos(angle) * dist,
        y: pt.y + Math.sin(angle) * dist,
      }));
      enemy.addComponent('CHealth', new CHealth({
        max: Math.round(def.hp * this.difficulty),
        current: Math.round(def.hp * this.difficulty),
      }));
      enemy.addComponent('CAI', new CAI({ type: 'melee' }));
      enemy.addComponent('CSprite', new CSprite({ frame: def.spriteKey, scale: 2 }));
      (enemy as any).xpValue = def.xp;
      (enemy as any).dmgValue = def.dmg;
    }
  }
}
