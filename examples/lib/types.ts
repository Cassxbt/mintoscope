/**
 * Core types for Mintoscope's risk output.
 *
 * Severity is the primary verdict; `score` (0-100) is a secondary, derived signal.
 * Every risk claim is conditional on authority state (live vs. renounced) and is
 * traceable to a source documented in resources/extension-risk-matrix.md.
 */

export type Severity = 'SAFE' | 'CAUTION' | 'HIGH' | 'CRITICAL';

export type ExtensionScope = 'mint' | 'account';

export type ComboClass =
  | 'illegal'
  | 'version-dependent'
  | 'manual-review'
  | 'dangerous-legal';

/** A single authority on an extension, and whether it is still active. */
export interface AuthorityInfo {
  /** e.g. "transfer_fee_config_authority" */
  field: string;
  /** base58 pubkey, or null when renounced/None */
  value: string | null;
  /** true when the authority can still act (non-null) */
  live: boolean;
}

/** One detected risk on a mint (or an account-level advisory). */
export interface Finding {
  /** canonical extension name, e.g. "PermanentDelegate" */
  extension: string;
  level: Severity;
  scope: ExtensionScope;
  whatItIs: string;
  whyRisky: string;
  authority?: AuthorityInfo;
  remediation: string;
}

/** A flagged combination of extensions present on the mint. */
export interface ComboFlag {
  combo: string[];
  classification: ComboClass;
  note: string;
}

/** The full audit result for a mint. */
export interface RiskReport {
  mint: string;
  severity: Severity;
  /** 0-100, secondary to `severity` */
  score: number;
  findings: Finding[];
  combos: ComboFlag[];
  summary: string;
  disclaimer: string;
  /** ISO timestamp the report was produced */
  generatedAt: string;
  /** data/source recency stamp, e.g. "2026-06" */
  accurateAsOf: string;
}
