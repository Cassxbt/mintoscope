# Mintoscope

> Token-2022 extension risk auditor for Solana — a Claude Code / Codex skill.

Mintoscope audits the **configuration** of a Solana Token-2022 mint: which extensions are present, who controls them (live vs. renounced authorities), what can go wrong, and how to fix it. It returns a `SAFE / CAUTION / HIGH / CRITICAL` verdict with specific remediations — in two modes:

- **Post-deploy** — point it at any mint address.
- **Pre-deploy** — guided review of your token-creation code before launch.

Mint-configuration risk only — it complements, rather than duplicates, program-logic auditors and trader-facing scanners.

## Why it exists

Token-2022 extensions add powerful optional behaviors to a mint, several of which are fund-loss-grade when an authority is live or misconfigured: `PermanentDelegate` can seize any balance, `TransferHook` can block or hijack transfers, `TransferFeeConfig` can be raised to 100%, `PausableConfig` can halt all transfers. Builders ship these by accident; integrators get caught by hidden ones — and nothing audits this surface inside the coding loop.

| Existing tool | Covers | What Mintoscope adds |
|---|---|---|
| SendAI `birdeye` token-security | ~7 coarse post-deploy API flags | Full mint-extension set, per-authority decomposition, severity tiers, pre-deploy review |
| Trail of Bits `token-integration-analyzer` | EVM / ERC-20 | The Solana Token-2022 domain |
| Solana Foundation `token-2022` reference | How to *build* with extensions | Risk-first auditing, detection, and scoring |

## Install

```bash
git clone https://github.com/Cassxbt/mintoscope && cd mintoscope
npm install
```

Add the skill to a Claude Code / Codex agent:

```bash
bash install.sh   # copies skill/ into ~/.claude/skills (and ~/.codex, ~/.agents if present)
```

## Usage

```bash
npm run audit -- <MINT_ADDRESS>                       # markdown report
npm run audit -- <MINT_ADDRESS> --json                # machine-readable
SOLANA_RPC_URL=<rpc> npm run audit -- <MINT_ADDRESS>  # custom RPC
```

### Example (real mainnet)

PayPal USD (PYUSD) audits as **CRITICAL** — the issuer holds a live `PermanentDelegate` plus freeze/close/fee/hook authorities under a single key. Legitimate compliance controls, but full capability over holder funds:

```
**Verdict:** CRITICAL (score 99/100)

### [CRITICAL] PermanentDelegate
- Risk: The delegate can seize or burn any holder balance — full fund-seizure capability.
- Authority: delegate = 2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk (live)
- Fix: Renounce the permanent delegate unless seizure is an intended, disclosed feature.
```

`CRITICAL` means *capability*, not intent — Mintoscope reports the power an authority holds and lets you decide whether you trust the controller.

## Validation (live mainnet — `npm run validate`)

| Mint | Program | Verdict | Extensions |
|---|---|---|---|
| PYUSD | Token-2022 | CRITICAL | MintCloseAuthority, PermanentDelegate, TransferFeeConfig, ConfidentialTransferMint, ConfidentialTransferFeeConfig, TransferHook, MetadataPointer, TokenMetadata |
| USDC | classic SPL | SAFE | — |
| USDT | classic SPL | SAFE | — |
| BONK | classic SPL | SAFE | — |
| wSOL | classic SPL | SAFE | — |
| JUP | classic SPL | SAFE | — |

Classic SPL mints are correctly out of scope (no false positives); the Token-2022 case is decomposed in full.

## How it works

1. Reads the mint via RPC `getAccountInfo` (`jsonParsed`) — the validator parses every extension the cluster supports, so coverage is version-proof.
2. Decomposes each extension's authorities: live (non-null) vs. renounced (null). Severity is conditional on this, not on mere presence.
3. Detects extension combinations **conservatively** — nothing is asserted "illegal" without program-source proof. Real mints such as PYUSD carry `ConfidentialTransferMint` + `TransferHook` together, disproving a commonly-repeated incompatibility claim, so such pairs are flagged version-dependent / manual-review instead.
4. Scores: severity tier (primary), 0–100 (secondary).

The interpreter is a pure function, unit-tested against captured-mainnet and crafted fixtures; only the RPC fetch touches the network.

## Security posture

- **Zero runtime dependencies** — reads chain state via native `fetch`; no wallet, no keys, no bundled executables.
- **Clean `npm audit`** (0 advisories).
- Read-only. Informational, not financial or security advice; verify on-chain before acting. Extension set current as of 2026-06.

## Project layout

```
skill/
  SKILL.md                  progressive, token-efficient router
  post-deploy-audit.md
  pre-deploy-review.md
  resources/                extension-risk-matrix, incompatible-combinations, fix-templates
examples/
  audit-deployed.ts         runnable auditor
  validate.ts               mainnet validation
  lib/                      resolver, rules, combos, score, report (+ tests)
skill-registry.entry.json   entry for the Solana AI Kit registry
```

## License

MIT
