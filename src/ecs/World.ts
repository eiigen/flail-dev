import { Entity } from './Entity';
import { Query } from './Query';
import type { System } from './System';

export class World {
  entities: Entity[] = [];
  systems: System[] = [];
  private nextEntityId = 0;
  private queryCache = new Map<string, Query>();
  // ponytail: event bus is loosely typed; any is the pragmatic call here
  private listeners = new Map<string, Set<(data: any) => void>>();
  paused = false;

  createEntity(): Entity {
    const e = new Entity(this.nextEntityId++);
    this.entities.push(e);
    return e;
  }

  destroyEntity(entity: Entity): void {
    const idx = this.entities.indexOf(entity);
    if (idx >= 0) this.entities.splice(idx, 1);
  }

  addSystem(system: System): void {
    this.systems.push(system);
    system.init?.(this);
  }

  removeSystem(name: string): void {
    const idx = this.systems.findIndex((s) => s.name === name);
    if (idx >= 0) {
      this.systems[idx]!.destroy?.(this);
      this.systems.splice(idx, 1);
    }
  }

  query(...components: string[]): Query {
    const key = components.sort().join(',');
    let q = this.queryCache.get(key);
    if (!q) {
      q = new Query(this, components);
      this.queryCache.set(key, q);
    }
    return q;
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach((fn) => fn(data));
  }

  step(dt: number): void {
    if (this.paused) return;
    for (const sys of this.systems) {
      try {
        sys.update(this, dt);
      } catch (err) {
        // ponytail: a broken system must freeze itself, not the whole game
        if (!(err as Error).loggedOnce) {
          (err as Error).loggedOnce = true;
          console.warn(`[flail] system ${sys.name} failed:`, err);
        }
      }
    }
  }
}
