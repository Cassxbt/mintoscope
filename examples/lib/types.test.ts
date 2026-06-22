import { describe, it, expect } from 'vitest';
import type { RiskReport, Severity } from './types';

describe('core types', () => {
  it('defines the four severity tiers in ascending order', () => {
    const order: Severity[] = ['SAFE', 'CAUTION', 'HIGH', 'CRITICAL'];
    expect(order).toHaveLength(4);
    expect(order[0]).toBe('SAFE');
    expect(order[3]).toBe('CRITICAL');
  });

  it('constructs a well-formed RiskReport', () => {
    const report: RiskReport = {
      mint: 'So11111111111111111111111111111111111111112',
      severity: 'SAFE',
      score: 0,
      findings: [],
      combos: [],
      summary: 'No Token-2022 extensions detected.',
      disclaimer: 'Informational only; not financial or security advice. Verify on-chain.',
      generatedAt: new Date().toISOString(),
      accurateAsOf: '2026-06',
    };

    expect(report.severity).toBe('SAFE');
    expect(report.findings).toEqual([]);
    expect(report.combos).toEqual([]);
    expect(report.score).toBe(0);
  });
});
