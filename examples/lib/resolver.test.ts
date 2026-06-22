import { describe, it, expect } from 'vitest';
import { interpretParsedMint } from './resolver';
import type { ParsedMintAccount } from './resolver';
import pyusd from '../fixtures/pyusd.json';
import plain from '../fixtures/plain-spl.json';
import fee from '../fixtures/live-transfer-fee.json';

const PYUSD = '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo';

describe('interpretParsedMint', () => {
  it('classic SPL mint: not Token-2022, no extensions', () => {
    const r = interpretParsedMint('Plain', plain as ParsedMintAccount);
    expect(r.isToken2022).toBe(false);
    expect(r.extensions).toHaveLength(0);
    expect(r.baseFreezeAuthority).toBeNull();
  });

  it('PYUSD: detects Token-2022 and decomposes key mint-extension authorities', () => {
    const r = interpretParsedMint(PYUSD, pyusd as ParsedMintAccount);
    expect(r.isToken2022).toBe(true);

    const pd = r.extensions.find((e) => e.type === 'PermanentDelegate');
    expect(pd).toBeDefined();
    expect(pd!.authorities[0]!.field).toBe('delegate');
    expect(pd!.authorities[0]!.live).toBe(true);

    const tf = r.extensions.find((e) => e.type === 'TransferFeeConfig');
    expect(tf!.authorities.map((a) => a.field)).toEqual([
      'transferFeeConfigAuthority',
      'withdrawWithheldAuthority',
    ]);

    const hook = r.extensions.find((e) => e.type === 'TransferHook');
    expect(hook!.authorities[0]!.live).toBe(true);
  });

  it('crafted fee token: live fee authority and 10% rate captured', () => {
    const r = interpretParsedMint('Fee', fee as ParsedMintAccount);
    const tf = r.extensions.find((e) => e.type === 'TransferFeeConfig');
    expect(tf!.authorities.every((a) => a.live)).toBe(true);
    const newer = tf!.detail.newerTransferFee as { transferFeeBasisPoints: number };
    expect(newer.transferFeeBasisPoints).toBe(1000);
  });

  it('tags unknown/account-level extensions without crashing', () => {
    const acct: ParsedMintAccount = {
      owner: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
      info: { decimals: 0, extensions: [{ extension: 'someFutureExtension', state: {} }] },
    };
    const r = interpretParsedMint('X', acct);
    expect(r.extensions[0]!.type).toBe('someFutureExtension');
    expect(r.extensions[0]!.authorities).toEqual([]);
  });
});
