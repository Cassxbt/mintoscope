import { Connection, PublicKey } from '@solana/web3.js';
import type { AuthorityInfo, ExtensionScope } from './types';

export const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
export const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

export interface ResolvedExtension {
  type: string;
  raw: string;
  scope: ExtensionScope;
  authorities: AuthorityInfo[];
  detail: Record<string, unknown>;
}

export interface ResolvedMint {
  address: string;
  programId: string;
  isToken2022: boolean;
  decimals: number | null;
  baseMintAuthority: string | null;
  baseFreezeAuthority: string | null;
  extensions: ResolvedExtension[];
}

export interface ParsedMintAccount {
  owner: string;
  info: {
    decimals?: number;
    mintAuthority?: string | null;
    freezeAuthority?: string | null;
    extensions?: Array<{ extension: string; state?: Record<string, unknown> }>;
  };
}

interface ExtSpec {
  name: string;
  scope: ExtensionScope;
  authorityFields: string[];
}

// jsonParsed extension key -> canonical name, scope, and which state fields are authorities.
const REGISTRY: Record<string, ExtSpec> = {
  transferFeeConfig: { name: 'TransferFeeConfig', scope: 'mint', authorityFields: ['transferFeeConfigAuthority', 'withdrawWithheldAuthority'] },
  permanentDelegate: { name: 'PermanentDelegate', scope: 'mint', authorityFields: ['delegate'] },
  transferHook: { name: 'TransferHook', scope: 'mint', authorityFields: ['authority'] },
  mintCloseAuthority: { name: 'MintCloseAuthority', scope: 'mint', authorityFields: ['closeAuthority'] },
  confidentialTransferMint: { name: 'ConfidentialTransferMint', scope: 'mint', authorityFields: ['authority'] },
  confidentialTransferFeeConfig: { name: 'ConfidentialTransferFeeConfig', scope: 'mint', authorityFields: ['authority'] },
  defaultAccountState: { name: 'DefaultAccountState', scope: 'mint', authorityFields: [] },
  interestBearingConfig: { name: 'InterestBearingConfig', scope: 'mint', authorityFields: ['rateAuthority'] },
  scaledUiAmountConfig: { name: 'ScaledUiAmountConfig', scope: 'mint', authorityFields: ['authority'] },
  pausableConfig: { name: 'PausableConfig', scope: 'mint', authorityFields: ['authority'] },
  nonTransferable: { name: 'NonTransferable', scope: 'mint', authorityFields: [] },
  metadataPointer: { name: 'MetadataPointer', scope: 'mint', authorityFields: ['authority'] },
  tokenMetadata: { name: 'TokenMetadata', scope: 'mint', authorityFields: ['updateAuthority'] },
  groupPointer: { name: 'GroupPointer', scope: 'mint', authorityFields: ['authority'] },
  groupMemberPointer: { name: 'GroupMemberPointer', scope: 'mint', authorityFields: ['authority'] },
  tokenGroup: { name: 'TokenGroup', scope: 'mint', authorityFields: ['updateAuthority'] },
  memoTransfer: { name: 'MemoTransfer', scope: 'account', authorityFields: [] },
  cpiGuard: { name: 'CpiGuard', scope: 'account', authorityFields: [] },
  immutableOwner: { name: 'ImmutableOwner', scope: 'account', authorityFields: [] },
};

function readAuthority(field: string, state: Record<string, unknown>): AuthorityInfo {
  const raw = state[field];
  const value = typeof raw === 'string' && raw.length > 0 ? raw : null;
  return { field, value, live: value !== null };
}

export function interpretParsedMint(address: string, account: ParsedMintAccount): ResolvedMint {
  const info = account.info ?? {};
  const extensions: ResolvedExtension[] = (info.extensions ?? []).map((entry) => {
    const spec = REGISTRY[entry.extension];
    const state = (entry.state ?? {}) as Record<string, unknown>;
    return {
      type: spec?.name ?? entry.extension,
      raw: entry.extension,
      scope: spec?.scope ?? 'mint',
      authorities: (spec?.authorityFields ?? []).map((field) => readAuthority(field, state)),
      detail: state,
    };
  });

  return {
    address,
    programId: account.owner,
    isToken2022: account.owner === TOKEN_2022_PROGRAM_ID,
    decimals: info.decimals ?? null,
    baseMintAuthority: info.mintAuthority ?? null,
    baseFreezeAuthority: info.freezeAuthority ?? null,
    extensions,
  };
}

export async function fetchParsedMint(rpcUrl: string, address: string): Promise<ParsedMintAccount> {
  const connection = new Connection(rpcUrl, 'confirmed');
  const res = await connection.getParsedAccountInfo(new PublicKey(address));
  if (!res.value) throw new Error(`account not found: ${address}`);
  const data = res.value.data;
  if (!('parsed' in data)) throw new Error(`account is not a parsed SPL token mint: ${address}`);
  const parsed = data.parsed as { type?: string; info?: ParsedMintAccount['info'] };
  if (parsed.type && parsed.type !== 'mint') {
    throw new Error(`account is a "${parsed.type}", not a mint: ${address}`);
  }
  return { owner: res.value.owner.toBase58(), info: parsed.info ?? {} };
}

export async function resolveMint(rpcUrl: string, address: string): Promise<ResolvedMint> {
  return interpretParsedMint(address, await fetchParsedMint(rpcUrl, address));
}
