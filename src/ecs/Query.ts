import type { World } from './World';
import type { Entity } from './Entity';

export class Query {
  constructor(
    private world: World,
    private required: string[]
  ) {}

  *[Symbol.iterator](): IterableIterator<Entity> {
    for (const e of this.world.entities) {
      if (this.required.every((c) => e.hasComponent(c))) yield e;
    }
  }
}
