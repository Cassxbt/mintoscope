import type { ComboFlag } from './types';
import type { ResolvedMint } from './resolver';

// Illegal combinations are taken verbatim from the Token-2022 program's
// check_for_invalid_mint_extension_combinations — mint initialization rejects them.
function illegal(combo: string[], note: string): ComboFlag {
  return { combo, classification: 'illegal', note: `${note} (rejected by token-2022 mint init).` };
}

function dangerousLegal(combo: string[], note: string): ComboFlag {
  return { combo, classification: 'dangerous-legal', note };
}

function isFrozenByDefault(mint: ResolvedMint): boolean {
  const das = mint.extensions.find((e) => e.type === 'DefaultAccountState');
  if (!das) return false;
  return String(das.detail.accountState ?? das.detail.state ?? '').toLowerCase().includes('frozen');
}

export function detectCombos(mint: ResolvedMint): ComboFlag[] {
  const present = new Set(mint.extensions.filter((e) => e.scope === 'mint').map((e) => e.type));
  const tf = present.has('TransferFeeConfig');
  const ctm = present.has('ConfidentialTransferMint');
  const ctfc = present.has('ConfidentialTransferFeeConfig');
  const cmb = present.has('ConfidentialMintBurn');
  const ib = present.has('InterestBearingConfig');
  const sua = present.has('ScaledUiAmountConfig');
  const nt = present.has('NonTransferable');

  const flags: ComboFlag[] = [];

  if (ctfc && !(tf && ctm)) {
    flags.push(illegal(['ConfidentialTransferFeeConfig'], 'ConfidentialTransferFeeConfig requires both TransferFeeConfig and ConfidentialTransferMint'));
  }
  if (tf && ctm && !ctfc) {
    flags.push(illegal(['TransferFeeConfig', 'ConfidentialTransferMint'], 'TransferFeeConfig with ConfidentialTransferMint requires ConfidentialTransferFeeConfig'));
  }
  if (cmb && !ctm) {
    flags.push(illegal(['ConfidentialMintBurn'], 'ConfidentialMintBurn requires ConfidentialTransferMint'));
  }
  if (sua && ib) {
    flags.push(illegal(['ScaledUiAmountConfig', 'InterestBearingConfig'], 'ScaledUiAmount and InterestBearing cannot coexist'));
  }
  if (nt && ctm && !cmb) {
    flags.push(illegal(['NonTransferable', 'ConfidentialTransferMint'], 'NonTransferable with ConfidentialTransferMint requires ConfidentialMintBurn'));
  }

  if (present.has('MintCloseAuthority') && nt) {
    flags.push(dangerousLegal(['MintCloseAuthority', 'NonTransferable'], 'Close + reinitialize can drop NonTransferable, making a soulbound token transferable.'));
  }
  if (present.has('MintCloseAuthority') && isFrozenByDefault(mint)) {
    flags.push(dangerousLegal(['MintCloseAuthority', 'DefaultAccountState'], 'Accounts created before a close + reinit bypass the frozen-by-default state.'));
  }

  return flags;
}
