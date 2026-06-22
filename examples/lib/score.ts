import type { Finding, Severity } from './types';

const ORDER: Severity[] = ['SAFE', 'CAUTION', 'HIGH', 'CRITICAL'];
const WEIGHT: Record<Severity, number> = { SAFE: 0, CAUTION: 25, HIGH: 70, CRITICAL: 95 };

export function score(findings: Finding[]): { severity: Severity; score: number } {
  if (findings.length === 0) return { severity: 'SAFE', score: 0 };

  const severity = findings.reduce<Severity>(
    (max, f) => (ORDER.indexOf(f.level) > ORDER.indexOf(max) ? f.level : max),
    'SAFE',
  );

  const stacked = findings.filter((f) => f.level === 'HIGH' || f.level === 'CRITICAL').length;
  const bump = Math.min(5, Math.max(0, stacked - 1));

  return { severity, score: Math.min(100, WEIGHT[severity] + bump) };
}
