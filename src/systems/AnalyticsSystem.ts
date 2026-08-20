import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import type { SettingsManager } from './SettingsManager';

interface AnalyticsEvent {
  name: string;
  data: unknown;
  ts: number;
}

export class AnalyticsSystem implements System {
  name = 'AnalyticsSystem';
  private queue: AnalyticsEvent[] = [];
  private flushTimer = 0;
  private settings: SettingsManager;

  constructor(_scene: import('phaser').Scene, settings: SettingsManager) {
    this.settings = settings;
  }

  init(world: World): void {
    for (const e of [
      'run_start', 'run_end', 'chest_open', 'evolve', 'boss_kill',
      'char_unlock', 'polli_generation_latency_ms', 'wave_reached', 'death_cause',
    ]) {
      world.on(e, (data: unknown) => this.track(e, data));
    }
  }

  track(name: string, data: unknown): void {
    this.queue.push({ name, data, ts: Date.now() });
    if (this.queue.length >= 50) this.flush();
  }

  update(_world: World, dt: number): void {
    this.flushTimer += dt;
    if (this.flushTimer >= 30000) {
      this.flushTimer = 0;
      this.flush();
    }
  }

  private flush(): void {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0);
    try {
      localStorage.setItem('flail_analytics', JSON.stringify(batch));
    } catch {
      /* ponytail: localStorage unavailable */
    }
    if (this.settings.get('analyticsOptIn') && 'sendBeacon' in navigator) {
      navigator.sendBeacon('/api/analytics', JSON.stringify(batch));
    }
  }
}
