import { describe, it, expect } from 'vitest';
import { buildReport, renderMarkdown } from './report';
import { interpretParsedMint } from './resolver';
import type { ParsedMintAccount } from './resolver';
import pyusd from '../fixtures/pyusd.json';
import plain from '../fixtures/plain-spl.json';

describe('buildReport + renderMarkdown', () => {
  it('PYUSD: CRITICAL verdict, structured findings, disclaimer present', () => {
    const r = buildReport(interpretParsedMint('2b1kV6Dk', pyusd as ParsedMintAccount));
    expect(r.severity).toBe('CRITICAL');
    expect(r.findings.some((f) => f.extension === 'PermanentDelegate')).toBe(true);
    expect(r.disclaimer).toMatch(/not financial or security advice/);

    const md = renderMarkdown(r);
    expect(md).toContain('**Verdict:** CRITICAL');
    expect(md).toContain('[CRITICAL] PermanentDelegate');
    expect(md).toContain('data accurate as of 2026-06');
  });

  it('plain mint: SAFE verdict renders cleanly', () => {
    const r = buildReport(interpretParsedMint('p', plain as ParsedMintAccount));
    expect(r.severity).toBe('SAFE');
    expect(renderMarkdown(r)).toContain('**Verdict:** SAFE');
  });
});
