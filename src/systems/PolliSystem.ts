import Phaser from 'phaser';
import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import type { SettingsManager } from './SettingsManager';
import type { PolliItem } from '@/data/schemas';

export class PolliSystem implements System {
  name = 'PolliSystem';
  private queue: PolliItem[] = [];
  private generating = false;
  private settings: SettingsManager;

  constructor(_scene: Phaser.Scene, settings: SettingsManager) {
    this.settings = settings;
  }

  init(world: World): void {
    // ponytail: pre-gen queue stub; full Polli API wiring when OAuth is live
    world.on('polli-ensure', (data: { min: number }) => this.ensureQueue(data.min));
  }

  private async ensureQueue(min = 5): Promise<void> {
    while (this.queue.length < min && !this.generating) {
      this.generating = true;
      try {
        const batch = await this.generateBatch(min - this.queue.length);
        this.queue.push(...batch);
      } catch {
        this.queue.push(...this.fallbackItems(min - this.queue.length));
      }
      this.generating = false;
    }
  }

  private async generateBatch(count: number): Promise<PolliItem[]> {
    const t0 = Date.now();
    // ponytail: no live API yet; returns empty until OAuth + endpoints wired
    await new Promise((r) => setTimeout(r, 0));
    this.worldEmit('polli_generation_latency_ms', { ms: Date.now() - t0 });
    return this.fallbackItems(count);
  }

  private fallbackItems(count: number): PolliItem[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `fb_${Date.now()}_${i}`,
      name: 'Fallback Item',
      type: 'relic' as const,
      rarity: 'common' as const,
      stats: {},
      description: 'A static fallback.',
      iconKey: 'fallback',
    }));
  }

  private worldEmit(event: string, data: unknown): void {
    (this as any).emit?.(event, data);
  }

  pop(): PolliItem | null {
    return this.queue.shift() ?? null;
  }

  update(_world: World, _dt: number): void {}
}
