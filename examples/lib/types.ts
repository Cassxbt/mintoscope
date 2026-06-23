export type Severity = 'SAFE' | 'CAUTION' | 'HIGH' | 'CRITICAL';
export type ExtensionScope = 'mint' | 'account';
export type ComboClass = 'illegal' | 'dangerous-legal';

export interface AuthorityInfo {
  field: string;
  value: string | null;
  live: boolean;
}

export interface Finding {
  extension: string;
  level: Severity;
  scope: ExtensionScope;
  whatItIs: string;
  whyRisky: string;
  authorities?: AuthorityInfo[];
  remediation: string;
}

export interface ComboFlag {
  combo: string[];
  classification: ComboClass;
  note: string;
}

export interface RiskReport {
  mint: string;
  severity: Severity;
  score: number;
  findings: Finding[];
  combos: ComboFlag[];
  summary: string;
  disclaimer: string;
  generatedAt: string;
  accurateAsOf: string;
}
