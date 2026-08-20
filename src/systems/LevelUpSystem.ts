import Phaser from 'phaser';
import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import type { SettingsManager } from './SettingsManager';

export class LevelUpSystem implements System {
  name = 'LevelUpSystem';
  private settings: SettingsManager;
  private choices = new Map<number, Array<{ id: string; kind: string; name: string }>>();

  constructor(_scene: Phaser.Scene, settings: SettingsManager) {
    this.settings = settings;
  }

  init(world: World): void {
    world.on('levelup', (data: { entityId: number; level: number }) => {
      this.pauseForLevelUp(world, data.entityId);
    });
  }

  private pauseForLevelUp(world: World, playerId: number): void {
    // Build 3-4 random choices from the character's levelUpPool (Task 9 detail)
    const choices: Array<{ id: string; kind: string; name: string }> = [
      { id: 'upgrade_weapon', kind: 'weapon', name: 'Upgrade a weapon' },
      { id: 'new_weapon', kind: 'weapon', name: 'New weapon' },
      { id: 'passive', kind: 'passive', name: 'Passive trait' },
      { id: 'stat_boost', kind: 'stat', name: 'Stat boost' },
    ];
    this.choices.set(playerId, choices);
    world.paused = true;
    world.emit('show-levelup', { choices });
    void this.settings;
  }

  update(_world: World, _dt: number): void {
    // No-op: pauses are handled via world.paused and UI events
  }
}
