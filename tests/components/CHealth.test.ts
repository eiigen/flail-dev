import { describe, it, expect } from 'vitest';
import { CHealth } from '../../src/components/CHealth';

describe('CHealth', () => {
  it('clamps current to max on construction', () => {
    const h = new CHealth({ max: 100, current: 150 });
    expect(h.current).toBe(100);
  });

  it('applies damage with armor reduction', () => {
    const h = new CHealth({ max: 100, current: 100, armor: 10 });
    h.applyDamage(30);
    expect(h.current).toBe(80);
  });

  it('does not apply damage during invulnerability', () => {
    const h = new CHealth({ max: 100, current: 100, invulnTimer: 1000 });
    h.applyDamage(50);
    expect(h.current).toBe(100);
  });

  it('heals up to max', () => {
    const h = new CHealth({ max: 100, current: 80 });
    h.heal(50);
    expect(h.current).toBe(100);
  });

  it('reports alive correctly', () => {
    const h = new CHealth({ max: 100, current: 0 });
    expect(h.alive).toBe(false);
    h.heal(1);
    expect(h.alive).toBe(true);
  });
});
