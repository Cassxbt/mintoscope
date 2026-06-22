# Token-2022 Extension Risk Matrix

Severity is conditional on authority state: a **live** (non-null) authority is worse than a **renounced** (null) one. Verified against the Token-2022 program enum and real mainnet mints, 2026-06.

## Mint-level extensions
| Extension | Authority field(s) | Live-authority severity | Risk |
|---|---|---|---|
| PermanentDelegate | `delegate` | CRITICAL | Seize or burn any holder's balance |
| PausableConfig | `authority` | CRITICAL | Halt all transfers globally |
| TransferHook | `authority` (+ `programId`) | HIGH | Block or hijack transfers; swap the hook program |
| TransferFeeConfig | `transferFeeConfigAuthority`, `withdrawWithheldAuthority` | HIGH | Fee changeable up to 100% (recipient pays); sweep withheld |
| MintCloseAuthority | `closeAuthority` | HIGH | Close + reinitialize changes rules; bypass fee/freeze/soulbound |
| FreezeAuthority (base) | `freezeAuthority` | HIGH | Freeze any account at will |
| DefaultAccountState (frozen) | governed by freeze authority | HIGH | New accounts frozen by default → silent integration failure |
| ConfidentialTransferMint | `authority` (+ `auditorElgamalPubkey`) | CAUTION | Auditor key can view amounts; gated account approval |
| InterestBearingConfig | `rateAuthority` | CAUTION | UI-only rate; phantom value if a protocol trusts `uiAmount` |
| ScaledUiAmountConfig | `authority` | CAUTION | UI-only multiplier; phantom value if trusted |
| MetadataPointer | `authority` | CAUTION | Repoint metadata away from this mint |
| TokenMetadata | `updateAuthority` | CAUTION | Mutable name/symbol/URI → impersonation |
| NonTransferable | — | CAUTION | Soulbound; confirm it is intended |

## Account-level extensions (advisory only — not on the mint)
`MemoTransfer`, `CpiGuard`, `ImmutableOwner` live on token accounts. They never appear when auditing a mint; surface them only as integrator advisories. `ImmutableOwner` is beneficial (phishing protection).

## Notes
- A renounced authority on a fixed harmful value (e.g. a 1000 bps fee) is still flagged.
- **CRITICAL = capability, not intent.** Regulated stablecoins (PYUSD) are CRITICAL by design because the issuer holds `PermanentDelegate`/`FreezeAuthority` for compliance. Report the capability; let the integrator weigh trust in the controller.
- The interpreter degrades gracefully: an unrecognized extension is reported for manual review rather than ignored.
