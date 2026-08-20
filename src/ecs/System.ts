import type { World } from './World';

export interface System {
  name: string;
  update(world: World, dt: number): void;
  init?(world: World): void;
  destroy?(world: World): void;
}
