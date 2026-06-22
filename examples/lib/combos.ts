import type { ComboFlag } from './types';
import type { ResolvedMint } from './resolver';

interface Pair {
  a: string;
  b: string;
  classification: ComboFlag['classification'];
  note: string;
}

// Conservative by design: nothing is asserted as a hard "illegal" combo unless it is
// verified against the Token-2022 program source. Real mainnet mints (e.g. PYUSD carries
// ConfidentialTransferMint + TransferHook together) disprove several commonly-repeated
// "incompatibility" claims, so those are flagged version-dependent or manual-review.
const PAIRS: Pair[] = [
  {
    a: 'NonTransferable',
    b: 'TransferFeeConfig',
    classification: 'manual-review',
    note: 'Logically conflicting (no transfers to charge a fee on); not verified against program source.',
  },
  {
    a: 'NonTransferable',
    b: 'TransferHook',
    classification: 'manual-review',
    note: 'Logically conflicting (no transfers for a hook to fire on); not verified against program source.',
  },
  {
    a: 'ConfidentialTransferMint',
    b: 'TransferHook',
    classification: 'version-dependent',
    note: 'Often reported incompatible, but real mints (e.g. PYUSD) carry both; depends on version/activation — verify.',
  },
  {
    a: 'ConfidentialTransferMint',
    b: 'TransferFeeConfig',
    classification: 'version-dependent',
    note: 'Historically incompatible; depends on the runtime version — verify on the target cluster.',
  },
  {
    a: 'MintCloseAuthority',
    b: 'NonTransferable',
    classification: 'dangerous-legal',
    note: 'Close + reinitialize can drop NonTransferable, making a soulbound token transferable.',
  },
  {
    a: 'ConfidentialTransferMint',
    b: 'PermanentDelegate',
    classification: 'manual-review',
    note: 'Encrypted amounts vs. forced transfers — interaction unverified here.',
  },
  {
    a: 'NonTransferable',
    b: 'PermanentDelegate',
    classification: 'manual-review',
    note: 'Soulbound vs. forced transfer — interaction unverified here.',
  },
];

function isFrozenByDefault(mint: ResolvedMint): boolean {
  const das = mint.extensions.find((e) => e.type === 'DefaultAccountState');
  if (!das) return false;
  return String(das.detail.accountState ?? das.detail.state ?? '').toLowerCase().includes('frozen');
}

export function detectCombos(mint: ResolvedMint): ComboFlag[] {
  const present = new Set(mint.extensions.filter((e) => e.scope === 'mint').map((e) => e.type));
  const flags: ComboFlag[] = [];

  for (const pair of PAIRS) {
    if (present.has(pair.a) && present.has(pair.b)) {
      flags.push({ combo: [pair.a, pair.b], classification: pair.classification, note: pair.note });
    }
  }

  if (present.has('MintCloseAuthority') && isFrozenByDefault(mint)) {
    flags.push({
      combo: ['MintCloseAuthority', 'DefaultAccountState'],
      classification: 'dangerous-legal',
      note: 'Accounts created before a close+reinit bypass the frozen-by-default state.',
    });
  }

  return flags;
}
