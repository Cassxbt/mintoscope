import { describe, it, expect } from 'vitest';
import { evaluate } from './rules';
import { score } from './score';
import { interpretParsedMint } from './resolver';
import type { ParsedMintAccount } from './resolver';
import pyusd from '../fixtures/pyusd.json';
import plain from '../fixtures/plain-spl.json';
import fee from '../fixtures/live-transfer-fee.json';

const A = 'Auth1111111111111111111111111111111111111';

function t22(
  extensions: Array<{ extension: string; state?: Record<string, unknown> }>,
  base: Record<string, unknown> = {},
): ParsedMintAccount {
  return { owner: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb', info: { decimals: 0, extensions, ...base } };
}

describe('evaluate + score', () => {
  it('plain SPL: no findings, SAFE', () => {
    const findings = evaluate(interpretParsedMint('p', plain as ParsedMintAccount));
    expect(findings).toHaveLength(0);
    expect(score(findings).severity).toBe('SAFE');
  });

  it('PYUSD: live PermanentDelegate is CRITICAL and drives the verdict', () => {
    const findings = evaluate(interpretParsedMint('pyusd', pyusd as ParsedMintAccount));
    const pd = findings.find((f) => f.extension === 'PermanentDelegate');
    expect(pd!.level).toBe('CRITICAL');
    expect(pd!.authorities!.some((a) => a.field === 'delegate' && a.live)).toBe(true);
    expect(score(findings).severity).toBe('CRITICAL');
  });

  it('TransferFeeConfig reports both of its authorities', () => {
    const findings = evaluate(interpretParsedMint('fee', fee as ParsedMintAccount));
    const tf = findings.find((f) => f.extension === 'TransferFeeConfig');
    expect(tf!.level).toBe('HIGH');
    expect(tf!.authorities!.map((a) => a.field)).toEqual(['transferFeeConfigAuthority', 'withdrawWithheldAuthority']);
  });

  it('PermanentDelegate downgrades to SAFE when renounced', () => {
    const findings = evaluate(interpretParsedMint('x', t22([{ extension: 'permanentDelegate', state: { delegate: null } }])));
    expect(findings.find((f) => f.extension === 'PermanentDelegate')!.level).toBe('SAFE');
  });

  it('PausableConfig with a live authority is CRITICAL', () => {
    const findings = evaluate(interpretParsedMint('x', t22([{ extension: 'pausableConfig', state: { authority: A } }])));
    expect(findings.find((f) => f.extension === 'PausableConfig')!.level).toBe('CRITICAL');
  });

  it('DefaultAccountState is HIGH when frozen, SAFE when initialized', () => {
    const frozen = evaluate(interpretParsedMint('x', t22([{ extension: 'defaultAccountState', state: { state: 'frozen' } }])));
    expect(frozen.find((f) => f.extension === 'DefaultAccountState')!.level).toBe('HIGH');
    const usable = evaluate(interpretParsedMint('x', t22([{ extension: 'defaultAccountState', state: { state: 'initialized' } }])));
    expect(usable.find((f) => f.extension === 'DefaultAccountState')!.level).toBe('SAFE');
  });

  it('a renounced transfer fee with a high fixed rate is still HIGH', () => {
    const findings = evaluate(
      interpretParsedMint('x', t22([
        {
          extension: 'transferFeeConfig',
          state: { transferFeeConfigAuthority: null, withdrawWithheldAuthority: null, newerTransferFee: { transferFeeBasisPoints: 1000 } },
        },
      ])),
    );
    expect(findings.find((f) => f.extension === 'TransferFeeConfig')!.level).toBe('HIGH');
  });

  it('a base freeze authority on a Token-2022 mint is reported HIGH', () => {
    const findings = evaluate(interpretParsedMint('x', t22([], { freezeAuthority: A })));
    expect(findings.find((f) => f.extension === 'FreezeAuthority')!.level).toBe('HIGH');
  });

  it('a live base mint authority on a Token-2022 mint is reported HIGH', () => {
    const findings = evaluate(interpretParsedMint('x', t22([], { mintAuthority: A })));
    expect(findings.find((f) => f.extension === 'MintAuthority')!.level).toBe('HIGH');
  });
});
