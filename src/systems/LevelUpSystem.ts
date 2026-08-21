import Phaser from 'phaser';
import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import type { SettingsManager } from './SettingsManager';
import { CExp } from '@/components/CExp';
import { CHealth } from '@/components/CHealth';
import { CWeapon } from '@/components/CWeapon';
import { CAI } from '@/components/CAI';
import { CTransform } from '@/components/CTransform';

export interface LevelUpChoice {
  id: string;
  kind: 'weapon' | 'passive' | 'stat';
  name: string;
  desc: string;
}

export class LevelUpSystem implements System {
  name = 'LevelUpSystem';
  private settings: SettingsManager;
  private pendingPlayerId = -1;
  private currentChoices: LevelUpChoice[] = [];

  constructor(_scene: Phaser.Scene, settings: SettingsManager) {
    this.settings = settings;
  }

  init(world: World): void {
    world.on('levelup', (data: { entityId: number; level: number }) => {
      this.pauseForLevelUp(world, data.entityId, data.level);
    });
  }

  private pauseForLevelUp(world: World, playerId: number, level: number): void {
    if (this.pendingPlayerId >= 0) return; // already showing
    this.pendingPlayerId = playerId;
    this.currentChoices = this.generateChoices(world, playerId, level);
    world.paused = true;
    world.emit('show-levelup', { choices: this.currentChoices, level });
  }

  private generateChoices(world: World, playerId: number, level: number): LevelUpChoice[] {
    const pool: LevelUpChoice[] = [
      { id: 'max_hp', kind: 'passive', name: 'Vitality', desc: '+30 Max HP & heal 20' },
      { id: 'dmg', kind: 'stat', name: 'Power', desc: '+25% damage' },
      { id: 'speed', kind: 'stat', name: 'Swiftness', desc: '+10% move speed' },
      { id: 'cooldown', kind: 'stat', name: 'Haste', desc: '-15% weapon cooldown' },
      { id: 'pierce', kind: 'passive', name: 'Piercing', desc: '+1 projectile pierce' },
    ];
    // shuffle
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const choices = shuffled.slice(0, 3);
    choices.forEach(c => c.desc = `${c.desc}  (Lv${level})`);
    return choices;
  }

  /** Called by UIOverlay when the player picks a choice. */
  applyChoice(world: World, choiceId: string): void {
    const player = world.entities.find(e => e.id === this.pendingPlayerId);
    if (player) {
      switch (choiceId) {
        case 'max_hp': {
          const hp = player.getComponent<CHealth>('CHealth')!;
          hp.max += 30; hp.current = Math.min(hp.max, hp.current + 20);
          break;
        }
        case 'dmg': {
          const w = player.getComponent<CWeapon>('CWeapon')!;
          (w as any).dmgMult = ((w as any).dmgMult ?? 1) * 1.25;
          break;
        }
        case 'speed': {
          const w = player.getComponent<CWeapon>('CWeapon')!;
          (w as any).speedMult = ((w as any).speedMult ?? 1) * 1.1;
          break;
        }
        case 'cooldown': {
          const w = player.getComponent<CWeapon>('CWeapon')!;
          (w as any).cdMult = ((w as any).cdMult ?? 1) * 0.85;
          break;
        }
        case 'pierce': {
          const w = player.getComponent<CWeapon>('CWeapon')!;
          (w as any).pierceBonus = ((w as any).pierceBonus ?? 0) + 1;
          break;
        }
      }
    }
    const pt = player?.getComponent<CTransform>('CTransform');
    if (pt) world.emit('play-vfx', { type: 'levelup', x: pt.x, y: pt.y });
    this.pendingPlayerId = -1;
    this.currentChoices = [];
    world.paused = false;
    world.emit('play-sfx', 'levelup');
  }

  update(_world: World, _dt: number): void {}
}
