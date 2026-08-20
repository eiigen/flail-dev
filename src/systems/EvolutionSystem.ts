import Phaser from 'phaser';
import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import type { SettingsManager } from './SettingsManager';
import type { Recipe } from '@/data/schemas';
import type { CAI } from '@/components/CAI';
import type { CInventory } from '@/components/CInventory';

export class EvolutionSystem implements System {
  name = 'EvolutionSystem';
  private queue: Recipe[] = [];
  private processed = new Set<string>();
  private recipes: Recipe[] = [];
  private settings: SettingsManager;

  constructor(_scene: Phaser.Scene, settings: SettingsManager) {
    this.settings = settings;
  }

  init(world: World): void {
    world.on('recipes-loaded', (data: { recipes: Recipe[] }) => {
      this.recipes = data.recipes;
    });
    world.on('inventory-updated', () => this.checkRecipes(world));
  }

  private checkRecipes(world: World): void {
    if (world.paused) return;
    const player = [...world.query('CInventory', 'CAI')].find(
      (e) => e.getComponent<CAI>('CAI')!.type === 'player'
    );
    if (!player) return;
    const inv = player.getComponent<CInventory>('CInventory')!;

    for (const recipe of this.recipes) {
      if (this.processed.has(recipe.id)) continue;
      if (recipe.requires.every((r) => inv.has(r.itemId, r.count))) {
        this.queue.push(recipe);
        this.processed.add(recipe.id);
      }
    }

    if (this.queue.length > 0) {
      world.paused = true;
      if (this.settings.get('autoEvolve')) {
        this.confirmEvolution(world, true);
      } else {
        world.emit('show-evolution', {
          recipeName: this.queue[0]!.resultName,
          queueLength: this.queue.length,
        });
      }
    }
  }

  confirmEvolution(world: World, accept: boolean): void {
    if (!accept) {
      this.queue.shift();
    } else {
      const recipe = this.queue.shift()!;
      const player = [...world.query('CInventory', 'CAI')].find(
        (e) => e.getComponent<CAI>('CAI')!.type === 'player'
      );
      if (!player) {
        world.paused = false;
        return;
      }
      const inv = player.getComponent<CInventory>('CInventory')!;
      for (const r of recipe.requires) inv.remove(r.itemId, r.count);
      inv.add(recipe.result, 1);
      world.emit('evolve', { recipeId: recipe.id, result: recipe.result });
      world.emit('play-sfx', 'evolve');
      world.emit('play-vfx', { type: 'evolve', x: 0, y: 0 });
    }

    if (this.queue.length > 0) {
      world.emit('show-evolution', {
        recipeName: this.queue[0]!.resultName,
        queueLength: this.queue.length,
      });
    } else {
      world.paused = false;
    }
  }

  update(_world: World, _dt: number): void {
    /* evolution is event-driven */
  }
}
