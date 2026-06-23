import type { Finding, Severity } from './types';
import type { ResolvedExtension, ResolvedMint } from './resolver';

function anyLive(ext: ResolvedExtension, field?: string): boolean {
  const list = field ? ext.authorities.filter((a) => a.field === field) : ext.authorities;
  return list.some((a) => a.live);
}

function feeBps(ext: ResolvedExtension): number {
  const read = (key: string) =>
    Number((ext.detail[key] as { transferFeeBasisPoints?: number } | undefined)?.transferFeeBasisPoints ?? 0);
  return Math.max(read('newerTransferFee'), read('olderTransferFee'));
}

type Rule = (ext: ResolvedExtension) => Finding;

const RULES: Record<string, Rule> = {
  PermanentDelegate: (e) => ({
    extension: 'PermanentDelegate',
    scope: 'mint',
    level: anyLive(e) ? 'CRITICAL' : 'SAFE',
    whatItIs: 'A delegate that can transfer or burn this token from any account without the holder’s approval.',
    whyRisky: anyLive(e)
      ? 'The delegate can seize or burn any holder balance — full fund-seizure capability.'
      : 'The delegate is renounced; the capability is inert.',
    remediation: 'Renounce the permanent delegate unless seizure is an intended, disclosed feature.',
  }),
  PausableConfig: (e) => ({
    extension: 'PausableConfig',
    scope: 'mint',
    level: anyLive(e) ? 'CRITICAL' : 'SAFE',
    whatItIs: 'A global switch that can pause all transfers of this token.',
    whyRisky: anyLive(e)
      ? 'The pause authority can halt every transfer at will — total operational freeze.'
      : 'The pause authority is renounced.',
    remediation: 'Renounce the pause authority or place it behind a timelock/multisig.',
  }),
  TransferHook: (e) => {
    const programId = (e.detail.programId as string | null) ?? null;
    return {
      extension: 'TransferHook',
      scope: 'mint',
      level: anyLive(e) || programId ? 'HIGH' : 'SAFE',
      whatItIs: 'Runs a custom program on every transfer; it can inspect and abort transfers.',
      whyRisky: anyLive(e)
        ? 'The hook authority can install or replace the hook program — transfers can be blocked or hijacked.'
        : programId
          ? 'A hook program is active; transfers depend on its (unverified) logic.'
          : 'No hook program is set and the authority is renounced.',
      remediation: 'Renounce the hook authority and verify any active hook program before integrating.',
    };
  },
  TransferFeeConfig: (e) => {
    const bps = feeBps(e);
    const auth = anyLive(e, 'transferFeeConfigAuthority');
    const level: Severity = auth ? 'HIGH' : bps >= 500 ? 'HIGH' : bps > 0 ? 'CAUTION' : 'SAFE';
    return {
      extension: 'TransferFeeConfig',
      scope: 'mint',
      level,
      whatItIs: `Charges a transfer fee (currently ${bps} bps), deducted from the recipient.`,
      whyRisky: auth
        ? 'The fee authority can change the fee at any time, up to 100%.'
        : bps > 0
          ? 'A fixed fee reduces every transfer; integrations must be fee-aware.'
          : 'No active fee and the authority is renounced.',
      remediation: 'Renounce the fee-config authority and disclose a capped fee.',
    };
  },
  MintCloseAuthority: (e) => ({
    extension: 'MintCloseAuthority',
    scope: 'mint',
    level: anyLive(e) ? 'HIGH' : 'SAFE',
    whatItIs: 'Allows the mint account to be closed and its address reused.',
    whyRisky: anyLive(e)
      ? 'A closed mint can be reinitialized with different rules, bypassing fee/freeze/soulbound assumptions.'
      : 'The close authority is renounced.',
    remediation: 'Renounce the mint close authority for a fixed, immutable mint.',
  }),
  ConfidentialTransferMint: (e) => ({
    extension: 'ConfidentialTransferMint',
    scope: 'mint',
    level: anyLive(e) ? 'CAUTION' : 'SAFE',
    whatItIs: 'Enables encrypted transfer amounts; may designate an auditor key.',
    whyRisky: 'The authority controls account approval and config; an auditor key (if set) can view amounts.',
    remediation: 'Confirm the auditor key and approval policy match your privacy expectations.',
  }),
  ConfidentialTransferFeeConfig: (e) => ({
    extension: 'ConfidentialTransferFeeConfig',
    scope: 'mint',
    level: anyLive(e) ? 'CAUTION' : 'SAFE',
    whatItIs: 'Withheld-fee configuration for confidential transfers.',
    whyRisky: 'A live authority controls withheld confidential fees.',
    remediation: 'Confirm the authority is trusted or renounced.',
  }),
  DefaultAccountState: (e) => {
    const state = String(e.detail.accountState ?? e.detail.state ?? '').toLowerCase();
    const frozen = state.includes('frozen') || state === '2';
    return {
      extension: 'DefaultAccountState',
      scope: 'mint',
      level: frozen ? 'HIGH' : 'SAFE',
      whatItIs: `New token accounts default to "${state || 'initialized'}".`,
      whyRisky: frozen
        ? 'New holders are frozen by default and cannot transact until thawed — integrations silently fail.'
        : 'Accounts initialize in a usable state.',
      remediation: 'Only ship frozen-by-default with a clear thaw process and a trusted freeze authority.',
    };
  },
  InterestBearingConfig: (e) => ({
    extension: 'InterestBearingConfig',
    scope: 'mint',
    level: anyLive(e, 'rateAuthority') ? 'CAUTION' : 'SAFE',
    whatItIs: 'Displays a UI-only accruing balance; the on-chain amount is unchanged.',
    whyRisky: 'A live rate authority can change the displayed rate; never trust uiAmount for accounting.',
    remediation: 'Use raw amounts, not uiAmount, for any value calculation.',
  }),
  ScaledUiAmountConfig: (e) => ({
    extension: 'ScaledUiAmountConfig',
    scope: 'mint',
    level: anyLive(e) ? 'CAUTION' : 'SAFE',
    whatItIs: 'Applies a UI-only multiplier to displayed balances.',
    whyRisky: 'A live authority can change the multiplier; never trust uiAmount for accounting.',
    remediation: 'Use raw amounts, not uiAmount, for any value calculation.',
  }),
  MetadataPointer: (e) => ({
    extension: 'MetadataPointer',
    scope: 'mint',
    level: anyLive(e) ? 'CAUTION' : 'SAFE',
    whatItIs: 'Points to the token’s metadata location.',
    whyRisky: 'A live authority can repoint metadata; verify the pointer references this mint.',
    remediation: 'Confirm the pointer is self-referential and the authority is trusted or renounced.',
  }),
  TokenMetadata: (e) => ({
    extension: 'TokenMetadata',
    scope: 'mint',
    level: anyLive(e, 'updateAuthority') ? 'CAUTION' : 'SAFE',
    whatItIs: 'On-chain name, symbol, and URI for the token.',
    whyRisky: 'A live update authority can change name/symbol/URI — a vector for impersonation.',
    remediation: 'Renounce the metadata update authority once final.',
  }),
  GroupPointer: (e) => ({
    extension: 'GroupPointer',
    scope: 'mint',
    level: anyLive(e) ? 'CAUTION' : 'SAFE',
    whatItIs: 'Points to a token-group account this mint belongs to or governs.',
    whyRisky: 'A live authority can repoint the group reference.',
    remediation: 'Confirm the group pointer and authority are intended.',
  }),
  GroupMemberPointer: (e) => ({
    extension: 'GroupMemberPointer',
    scope: 'mint',
    level: anyLive(e) ? 'CAUTION' : 'SAFE',
    whatItIs: 'Points to the group-member account for this mint.',
    whyRisky: 'A live authority can repoint the member reference.',
    remediation: 'Confirm the member pointer and authority are intended.',
  }),
  TokenGroup: (e) => ({
    extension: 'TokenGroup',
    scope: 'mint',
    level: anyLive(e, 'updateAuthority') ? 'CAUTION' : 'SAFE',
    whatItIs: 'On-chain group configuration (max size, current members).',
    whyRisky: 'A live update authority can change group membership rules.',
    remediation: 'Renounce the group update authority once the group is final.',
  }),
  ConfidentialMintBurn: () => ({
    extension: 'ConfidentialMintBurn',
    scope: 'mint',
    level: 'CAUTION',
    whatItIs: 'Confidential minting and burning; extends confidential transfers.',
    whyRisky: 'Must accompany ConfidentialTransferMint; review its mint/burn policy and authority.',
    remediation: 'Confirm the confidential mint/burn policy is intended.',
  }),
  PermissionedBurn: () => ({
    extension: 'PermissionedBurn',
    scope: 'mint',
    level: 'CAUTION',
    whatItIs: 'Only a designated authority may burn this token.',
    whyRisky: 'A live burn authority can burn holder balances without consent — verify it.',
    remediation: 'Verify or renounce the burn authority.',
  }),
  NonTransferable: () => ({
    extension: 'NonTransferable',
    scope: 'mint',
    level: 'CAUTION',
    whatItIs: 'Tokens cannot be transferred (soulbound).',
    whyRisky: 'Holders can never move the token; confirm this is intended.',
    remediation: 'No action if soulbound behavior is intended.',
  }),
};

function baseFreezeFinding(value: string): Finding {
  return {
    extension: 'FreezeAuthority',
    scope: 'mint',
    level: 'HIGH',
    whatItIs: 'Standard authority that can freeze individual token accounts.',
    whyRisky: 'Any holder account can be frozen at will, trapping funds.',
    authorities: [{ field: 'freezeAuthority', value, live: true }],
    remediation: 'Renounce the freeze authority unless freezing is a required, disclosed control.',
  };
}

function fallbackFinding(ext: ResolvedExtension): Finding {
  return {
    extension: ext.type,
    scope: ext.scope,
    level: anyLive(ext) ? 'CAUTION' : 'SAFE',
    whatItIs: 'Token-2022 extension not individually rule-scored.',
    whyRisky: 'Review this extension manually against the Token Extensions documentation.',
    remediation: 'Inspect the extension state and confirm its authorities are trusted or renounced.',
  };
}

export function evaluate(mint: ResolvedMint): Finding[] {
  if (!mint.isToken2022) return [];
  const findings: Finding[] = [];
  for (const ext of mint.extensions) {
    if (ext.scope === 'account') continue;
    const rule = RULES[ext.type];
    const finding = rule ? rule(ext) : fallbackFinding(ext);
    findings.push({ ...finding, authorities: ext.authorities });
  }
  if (mint.baseFreezeAuthority) findings.push(baseFreezeFinding(mint.baseFreezeAuthority));
  return findings;
}
