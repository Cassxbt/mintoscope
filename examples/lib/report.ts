import type { Finding, RiskReport, Severity } from './types';
import type { ResolvedMint } from './resolver';
import { evaluate } from './rules';
import { detectCombos } from './combos';
import { score } from './score';

const DISCLAIMER =
  'Informational only; not financial or security advice. Mintoscope audits mint configuration, not program logic or market risk. Verify on-chain before acting.';
const ACCURATE_AS_OF = '2026-06';
const TIER_ORDER: Severity[] = ['CRITICAL', 'HIGH', 'CAUTION', 'SAFE'];

export function buildReport(mint: ResolvedMint): RiskReport {
  const findings = evaluate(mint);
  const combos = detectCombos(mint);
  const { severity, score: value } = score(findings);
  return {
    mint: mint.address,
    severity,
    score: value,
    findings,
    combos,
    summary: summarize(mint, findings, severity, combos.length),
    disclaimer: DISCLAIMER,
    generatedAt: new Date().toISOString(),
    accurateAsOf: ACCURATE_AS_OF,
  };
}

function summarize(mint: ResolvedMint, findings: Finding[], severity: Severity, comboCount: number): string {
  if (!mint.isToken2022) return 'Not a Token-2022 mint; no extension risk to assess.';
  const mintExtensions = mint.extensions.filter((e) => e.scope === 'mint');
  if (mintExtensions.length === 0) return 'Token-2022 mint with no extensions; no extension risk detected.';
  const drivers = findings.filter((f) => f.level === severity).map((f) => f.extension);
  const comboNote = comboCount ? ` ${comboCount} combination flag(s) to review.` : '';
  return `${severity}: ${mintExtensions.length} extension(s)${drivers.length ? `, driven by ${drivers.join(', ')}` : ''}.${comboNote}`;
}

function sortByTier(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => TIER_ORDER.indexOf(a.level) - TIER_ORDER.indexOf(b.level));
}

export function renderMarkdown(r: RiskReport): string {
  const out: string[] = [
    '# Mintoscope — Token-2022 Risk Report',
    '',
    `**Mint:** \`${r.mint}\``,
    `**Verdict:** ${r.severity} (score ${r.score}/100)`,
    `**Summary:** ${r.summary}`,
    '',
  ];

  if (r.findings.length) {
    out.push('## Findings', '');
    for (const f of sortByTier(r.findings)) {
      out.push(`### [${f.level}] ${f.extension}`);
      out.push(`- What: ${f.whatItIs}`);
      out.push(`- Risk: ${f.whyRisky}`);
      if (f.authority) {
        const state = f.authority.live ? 'live' : 'renounced';
        out.push(`- Authority: ${f.authority.field} = ${f.authority.value ?? 'none'} (${state})`);
      }
      out.push(`- Fix: ${f.remediation}`, '');
    }
  }

  if (r.combos.length) {
    out.push('## Combination flags', '');
    for (const c of r.combos) out.push(`- [${c.classification}] ${c.combo.join(' + ')} — ${c.note}`);
    out.push('');
  }

  out.push('---', r.disclaimer, '', `_Generated ${r.generatedAt} · data accurate as of ${r.accurateAsOf}_`);
  return out.join('\n');
}
