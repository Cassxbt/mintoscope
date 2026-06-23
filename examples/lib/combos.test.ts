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
  it('PYUSD carries the legal TransferFee + Confidential + ConfidentialFee trio → no illegal flags', () => {
    const flags = detectCombos(interpretParsedMint('pyusd', pyusd as ParsedMintAccount));
    expect(flags.every((f) => f.classification !== 'illegal')).toBe(true);
  });

  it('TransferFee + ConfidentialTransferMint WITHOUT ConfidentialTransferFeeConfig → illegal', () => {
    const flags = detectCombos(interpretParsedMint('x', mintWith(['transferFeeConfig', 'confidentialTransferMint'])));
    expect(flags.some((f) => f.classification === 'illegal')).toBe(true);
  });

  it('adding ConfidentialTransferFeeConfig makes that trio legal again', () => {
    const flags = detectCombos(
      interpretParsedMint('x', mintWith(['transferFeeConfig', 'confidentialTransferMint', 'confidentialTransferFeeConfig'])),
    );
    expect(flags.some((f) => f.classification === 'illegal')).toBe(false);
  });

  it('ScaledUiAmount + InterestBearing → illegal', () => {
    const flags = detectCombos(interpretParsedMint('x', mintWith(['scaledUiAmountConfig', 'interestBearingConfig'])));
    expect(flags.some((f) => f.classification === 'illegal')).toBe(true);
  });

  it('ConfidentialMintBurn without ConfidentialTransferMint → illegal', () => {
    const flags = detectCombos(interpretParsedMint('x', mintWith(['confidentialMintBurn'])));
    expect(flags.some((f) => f.classification === 'illegal')).toBe(true);
  });

  it('MintCloseAuthority + NonTransferable → dangerous-legal', () => {
    const flags = detectCombos(interpretParsedMint('x', mintWith(['mintCloseAuthority', 'nonTransferable'])));
    expect(flags.some((f) => f.classification === 'dangerous-legal')).toBe(true);
  });

  it('ConfidentialTransferFeeConfig alone → illegal', () => {
    const flags = detectCombos(interpretParsedMint('x', mintWith(['confidentialTransferFeeConfig'])));
    expect(flags.some((f) => f.classification === 'illegal')).toBe(true);
  });

  it('NonTransferable + ConfidentialTransferMint without ConfidentialMintBurn → illegal', () => {
    const flags = detectCombos(interpretParsedMint('x', mintWith(['nonTransferable', 'confidentialTransferMint'])));
    expect(flags.some((f) => f.classification === 'illegal')).toBe(true);
  });

  it('MintCloseAuthority + frozen DefaultAccountState → dangerous-legal', () => {
    const acct = {
      owner: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
      info: {
        decimals: 0,
        extensions: [
          { extension: 'mintCloseAuthority', state: { closeAuthority: 'A1111111111111111111111111111111111111111' } },
          { extension: 'defaultAccountState', state: { state: 'frozen' } },
        ],
      },
    };
    const flags = detectCombos(interpretParsedMint('x', acct));
    expect(flags.some((f) => f.combo.includes('DefaultAccountState') && f.classification === 'dangerous-legal')).toBe(true);
  });
});
