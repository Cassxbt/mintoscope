import { describe, it, expect } from 'vitest';
import { evaluate } from './rules';
import { score } from './score';
import { interpretParsedMint } from './resolver';
import type { ParsedMintAccount } from './resolver';
import pyusd from '../fixtures/pyusd.json';
import plain from '../fixtures/plain-spl.json';
import fee from '../fixtures/live-transfer-fee.json';

describe('evaluate + score', () => {
  it('plain SPL: no findings, SAFE', () => {
    const findings = evaluate(interpretParsedMint('p', plain as ParsedMintAccount));
    expect(findings).toHaveLength(0);
    expect(score(findings).severity).toBe('SAFE');
  });

  it('PYUSD: live PermanentDelegate is CRITICAL and drives the overall verdict', () => {
    const findings = evaluate(interpretParsedMint('pyusd', pyusd as ParsedMintAccount));
    const pd = findings.find((f) => f.extension === 'PermanentDelegate');
    expect(pd!.level).toBe('CRITICAL');
    expect(pd!.authority!.live).toBe(true);
    expect(score(findings).severity).toBe('CRITICAL');
  });

  it('crafted fee token: live fee authority is HIGH', () => {
    const findings = evaluate(interpretParsedMint('fee', fee as ParsedMintAccount));
    const tf = findings.find((f) => f.extension === 'TransferFeeConfig');
    expect(tf!.level).toBe('HIGH');
  });
});
