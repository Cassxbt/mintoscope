import { describe, it, expect } from 'vitest';
import { detectCombos } from './combos';
import { interpretParsedMint } from './resolver';
import type { ParsedMintAccount } from './resolver';
import pyusd from '../fixtures/pyusd.json';

function mintWith(extensions: string[]): ParsedMintAccount {
  return {
    owner: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
    info: { decimals: 0, extensions: extensions.map((e) => ({ extension: e, state: {} })) },
  };
}

describe('detectCombos', () => {
  it('flags NonTransferable + TransferFeeConfig for manual review, not as illegal', () => {
    const flags = detectCombos(interpretParsedMint('x', mintWith(['nonTransferable', 'transferFeeConfig'])));
    const flag = flags.find((f) => f.combo.includes('NonTransferable') && f.combo.includes('TransferFeeConfig'));
    expect(flag!.classification).toBe('manual-review');
  });

  it('does NOT mark any combo illegal on PYUSD, a real valid mint (no false positives)', () => {
    const flags = detectCombos(interpretParsedMint('pyusd', pyusd as ParsedMintAccount));
    const confidentialHook = flags.find(
      (f) => f.combo.includes('ConfidentialTransferMint') && f.combo.includes('TransferHook'),
    );
    expect(confidentialHook!.classification).toBe('version-dependent');
    expect(flags.every((f) => f.classification !== 'illegal')).toBe(true);
  });
});
