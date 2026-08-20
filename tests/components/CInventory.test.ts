import { describe, it, expect } from 'vitest';
import { CInventory } from '../../src/components/CInventory';

describe('CInventory', () => {
  it('adds and checks items', () => {
    const inv = new CInventory();
    inv.add('sword', 2);
    expect(inv.has('sword', 2)).toBe(true);
    expect(inv.has('sword', 3)).toBe(false);
  });

  it('removes items correctly', () => {
    const inv = new CInventory();
    inv.add('gem', 5);
    expect(inv.remove('gem', 3)).toBe(true);
    expect(inv.has('gem', 2)).toBe(true);
    expect(inv.has('gem', 3)).toBe(false);
  });

  it('returns false when removing more than available', () => {
    const inv = new CInventory();
    inv.add('gem', 2);
    expect(inv.remove('gem', 3)).toBe(false);
    expect(inv.has('gem', 2)).toBe(true);
  });

  it('counts unique items', () => {
    const inv = new CInventory();
    inv.add('a', 1);
    inv.add('b', 5);
    expect(inv.count).toBe(2);
  });
});
