import { describe, it, expect } from 'vitest';
import { World } from '../../src/ecs/World';

describe('World', () => {
  it('creates entities with unique IDs', () => {
    const world = new World();
    const a = world.createEntity();
    const b = world.createEntity();
    expect(a.id).not.toBe(b.id);
  });

  it('adds and retrieves components', () => {
    const world = new World();
    const e = world.createEntity();
    e.addComponent('CTransform', { x: 10, y: 20, rotation: 0, scale: 1 });
    expect(e.getComponent('CTransform')).toEqual({ x: 10, y: 20, rotation: 0, scale: 1 });
  });

  it('steps systems in order', () => {
    const world = new World();
    const order: string[] = [];
    world.addSystem({ name: 'A', update: () => order.push('A') });
    world.addSystem({ name: 'B', update: () => order.push('B') });
    world.step(16);
    expect(order).toEqual(['A', 'B']);
  });

  it('pauses world step', () => {
    const world = new World();
    let called = false;
    world.addSystem({ name: 'X', update: () => { called = true; } });
    world.paused = true;
    world.step(16);
    expect(called).toBe(false);
  });

  it('query returns entities with all required components', () => {
    const world = new World();
    const e1 = world.createEntity();
    e1.addComponent('A', {});
    e1.addComponent('B', {});
    const e2 = world.createEntity();
    e2.addComponent('A', {});
    const result = [...world.query('A', 'B')];
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe(e1.id);
  });

  it('emits events to listeners', () => {
    const world = new World();
    let received = 0;
    world.on('test', (data: unknown) => { received = (data as number); });
    world.emit('test', 42);
    expect(received).toBe(42);
  });
});
