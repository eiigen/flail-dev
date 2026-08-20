import { describe, it, expect } from 'vitest';
import { SettingsManager } from '../../src/systems/SettingsManager';

describe('SettingsManager', () => {
  it('returns defaults when no save exists', () => {
    const sm = new SettingsManager();
    expect(sm.get('masterVolume')).toBe(1);
    expect(sm.get('accessibility').colorBlind).toBe('none');
    expect(sm.get('accessibility').reducedMotion).toBe(false);
  });

  it('persists and retrieves settings', () => {
    const sm = new SettingsManager();
    sm.set('masterVolume', 0.5);
    expect(sm.get('masterVolume')).toBe(0.5);
  });

  it('merges saved accessibility with defaults', () => {
    const sm = new SettingsManager({
      accessibility: { colorBlind: 'deuteranope', reducedMotion: true, highContrast: false, keyMap: {} },
    });
    expect(sm.get('accessibility').colorBlind).toBe('deuteranope');
    expect(sm.get('accessibility').reducedMotion).toBe(true);
    // default keyMap should be preserved where not overridden
    expect(sm.get('accessibility').keyMap.up).toBe('W');
  });

  it('getAll returns a copy (mutation does not leak)', () => {
    const sm = new SettingsManager();
    const copy = sm.getAll();
    copy.masterVolume = 0;
    expect(sm.get('masterVolume')).toBe(1);
  });
});
