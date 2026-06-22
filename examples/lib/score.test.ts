import { describe, it, expect } from 'vitest';
import { score } from './score';
import type { Finding, Severity } from './types';

const finding = (level: Severity): Finding => ({
  extension: 'x',
  scope: 'mint',
  level,
  whatItIs: '',
  whyRisky: '',
  remediation: '',
});

describe('score', () => {
  it('no findings → SAFE / 0', () => {
    expect(score([])).toEqual({ severity: 'SAFE', score: 0 });
  });

  it('takes the worst tier as the verdict', () => {
    const r = score([finding('CAUTION'), finding('CRITICAL'), finding('HIGH')]);
    expect(r.severity).toBe('CRITICAL');
    expect(r.score).toBeGreaterThanOrEqual(95);
  });

  it('stacking HIGH+ findings bumps the score within bounds', () => {
    const one = score([finding('HIGH')]).score;
    const many = score([finding('HIGH'), finding('HIGH'), finding('HIGH')]).score;
    expect(many).toBeGreaterThan(one);
    expect(many).toBeLessThanOrEqual(100);
  });

  it('only low-grade findings → CAUTION', () => {
    expect(score([finding('CAUTION')]).severity).toBe('CAUTION');
  });
});
