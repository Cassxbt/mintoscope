---
name: token-2022-extension-auditor
description: Audit Solana Token-2022 (Token Extensions) mints for risk. Use when the user wants to check whether a token is safe to integrate, list, or accept; review their own token's extensions before deploy; understand a mint's PermanentDelegate, TransferHook, TransferFee, freeze/close/pause authorities, confidential transfers, or default-frozen state; or judge whether an extension combination is dangerous. Detects every mint extension, decomposes authorities (live vs renounced), assigns a SAFE/CAUTION/HIGH/CRITICAL severity, and prescribes fixes. Mint-configuration risk only — not program-logic auditing or market/price risk.
user-invocable: true
---

# Token-2022 Extension Risk Auditor

Audits the configuration of a Solana Token-2022 mint: which extensions are present, who controls them, what can go wrong, and how to fix it. Two modes — post-deploy (any mint address) and pre-deploy (review token-creation code before launch).

## When to use
- "Is this token safe to integrate / list / accept?" → post-deploy audit.
- "Review my token's extensions before I deploy." → pre-deploy review.
- "What does PermanentDelegate / TransferHook / TransferFee / DefaultAccountState mean here?"
- "Does this mint still have a live freeze / close / pause authority?"
- "Are these extensions a dangerous or invalid combination?"

## When NOT to use (route elsewhere)
- Program / Anchor logic vulnerabilities → `solana-vulnerability-scanner` (Trail of Bits), `safe-solana-builder`.
- Price, liquidity, holder distribution, honeypot-trading risk → `birdeye`.
- How to implement an extension → `solana-dev-skill` Token-2022 reference.

## Decision table
| User intent | Go to |
| --- | --- |
| Audit a live mint by address | [post-deploy-audit.md](post-deploy-audit.md) |
| Review own token before deploy | [pre-deploy-review.md](pre-deploy-review.md) |
| Understand one extension's risk | [resources/extension-risk-matrix.md](resources/extension-risk-matrix.md) |
| Judge an extension combination | [resources/incompatible-combinations.md](resources/incompatible-combinations.md) |
| Fix a flagged risk | [resources/fix-templates.md](resources/fix-templates.md) |

## How it works
1. Read the mint via RPC `getAccountInfo` (`jsonParsed`) — the validator parses every extension the cluster supports.
2. Decompose each extension's authorities: live (non-null) vs renounced (null). Severity is conditional on this.
3. Detect dangerous / version-dependent / manual-review combinations — conservatively.
4. Score: severity tier (primary), 0–100 (secondary).

## Output
A `RiskReport`: `{ mint, severity, score, findings[], combos[], summary, disclaimer, generatedAt, accurateAsOf }` — markdown or JSON.

## Rules you must not skip
| Shortcut | Why it's wrong | Do instead |
| --- | --- | --- |
| "Extension present = dangerous" | Severity depends on whether the authority is live | Check live vs renounced |
| "Authority renounced = safe" | A fixed harmful value (e.g. 100% fee) still harms | Inspect the value, not just the authority |
| "These two extensions are illegal together" | Real mints (PYUSD) disprove common myths | Use the verified-only combo table; else flag manual-review |
| "CRITICAL means it's a scam" | Regulated stablecoins (PYUSD) are CRITICAL by design | Report capability + context, not intent |
| "The mint has MemoTransfer/CpiGuard" | Those are account-level, not mint-level | Audit mint extensions; treat account ones as advisories |
| "The score is the verdict" | Score is secondary | Lead with the severity tier and findings |

## Scope & disclaimer
Mint-configuration risk only. Informational, not financial or security advice. Extension set verified as of 2026-06 — verify on-chain before acting.
