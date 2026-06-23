# Mintoscope

**A Claude Code / Codex skill that audits Solana Token-2022 (Token Extensions) mints for configuration risk — before you integrate one, or before you ship your own.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE) &nbsp;·&nbsp; ![runtime deps: 0](https://img.shields.io/badge/runtime%20deps-0-brightgreen.svg) &nbsp;·&nbsp; ![Claude Code / Codex](https://img.shields.io/badge/Claude%20Code%20%2F%20Codex-skill-8A2BE2.svg)

Built by [@cassxbt](https://github.com/cassxbt), validated live against mainnet. Token-2022 extensions add powerful optional behaviors to a mint — several are fund-loss-grade when an authority is live or misconfigured (`PermanentDelegate` can seize balances, `TransferHook` can block transfers, `TransferFeeConfig` can be raised to 100%, `PausableConfig` can halt all transfers). Mintoscope audits that surface — the one no existing kit skill covers.

## What it does

Given a mint address (post-deploy) or your token-creation code (pre-deploy), it produces a `RiskReport` that:

- Lists every Token-2022 extension present and what it means.
- Names the exact controlling authority for each, and whether it is **live** (active) or **renounced** (null).
- Scores severity *conditionally* — a renounced `PermanentDelegate` is inert; a live one is `CRITICAL`.
- Flags extension combinations conservatively — never asserting "illegal" without program-source proof.
- Returns markdown or JSON, with a concrete remediation per finding.

## Who it's for

- **Integrators, exchanges, wallets** deciding whether a token is safe to list or accept.
- **Builders** hardening their own token before mainnet.
- **Security researchers** triaging a mint's authority surface in seconds.

## How it works

1. Reads the mint via Solana RPC `getAccountInfo` (`jsonParsed`) — the validator parses every extension the cluster supports, so coverage stays version-proof.
2. Decomposes authorities: live (non-null) vs. renounced (null). Severity depends on this, not on mere presence.
3. Detects combinations conservatively. Real mints (PYUSD carries `ConfidentialTransferMint` + `TransferHook`) disprove several commonly-repeated "incompatible" claims, so those are flagged version-dependent / manual-review rather than illegal.
4. Scores: severity tier (primary) + 0–100 (secondary).

The interpreter is a pure function, unit-tested against captured-mainnet and crafted fixtures; only the RPC fetch touches the network.

## Requirements

- Node.js 18+ (uses native `fetch`).
- A Solana RPC URL (defaults to mainnet-beta; a dedicated RPC such as Helius avoids public rate limits).
- Claude Code or Codex, to use it as a skill.

## Installation

```bash
git clone https://github.com/Cassxbt/mintoscope && cd mintoscope
npm install
bash install.sh   # copies skill/ into ~/.claude/skills (and ~/.codex, ~/.agents if present)
```

## Usage

```bash
npm run audit -- <MINT_ADDRESS>                       # markdown report
npm run audit -- <MINT_ADDRESS> --json                # JSON
SOLANA_RPC_URL=<rpc> npm run audit -- <MINT_ADDRESS>  # custom RPC
```

As a skill, ask the agent: *"Audit Token-2022 mint `<address>`"* or *"Review my token's extensions before I deploy."*

### Example — PYUSD (real mainnet)

```
**Verdict:** CRITICAL (score 99/100)

### [CRITICAL] PermanentDelegate
- Risk: The delegate can seize or burn any holder balance — full fund-seizure capability.
- Authority: delegate = 2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk (live)
- Fix: Renounce the permanent delegate unless seizure is an intended, disclosed feature.
```

PYUSD audits `CRITICAL` because Paxos holds live seize/freeze/close authorities for compliance. **`CRITICAL` means capability, not intent** — Mintoscope reports the power an authority holds and lets you decide whether you trust the controller.

## Validation

`npm run validate` — each row is checked live on mainnet (the auditor self-verifies the program owner, so this reflects on-chain truth, not assumptions):

| Mint | Program | Verdict | Extensions |
|---|---|---|---|
| PYUSD | Token-2022 | CRITICAL | MintCloseAuthority, PermanentDelegate, TransferFeeConfig, ConfidentialTransferMint, ConfidentialTransferFeeConfig, TransferHook, MetadataPointer, TokenMetadata |
| USDC | classic SPL | SAFE | — |
| USDT | classic SPL | SAFE | — |
| BONK | classic SPL | SAFE | — |
| wSOL | classic SPL | SAFE | — |
| JUP | classic SPL | SAFE | — |

PYUSD is the richest real-world Token-2022 case (8 extensions); the classic-SPL rows are negative controls confirming no false positives. Beyond live mints, the test suite exercises the full severity matrix against crafted fixtures — renounced authorities downgrading to SAFE, `PausableConfig` → CRITICAL, frozen-by-default → HIGH, and the five program-verified illegal combinations. Run `npm run validate -- <MINT> <MINT> …` to audit any set of mints.

## How it compares

| Tool | Covers | Mintoscope adds |
|---|---|---|
| SendAI `birdeye` token-security | ~7 coarse post-deploy API flags | Full mint-extension set, per-authority decomposition, severity tiers, pre-deploy review |
| Trail of Bits `token-integration-analyzer` | EVM / ERC-20 | The Solana Token-2022 domain |
| Solana Foundation `token-2022` reference | How to *build* with extensions | Risk-first auditing, detection, scoring |

## What it doesn't do

- **Program / Anchor logic** vulnerabilities → use Trail of Bits `solana-vulnerability-scanner`.
- **Price, liquidity, holder distribution, honeypot-trading** risk → use a market scanner such as `birdeye`.
- **Trust decisions** — it reports an authority's capability; it does not judge whether the controller is trustworthy.

## Known limitations

- Illegal-combination detection mirrors the Token-2022 program's `check_for_invalid_mint_extension_combinations` (verified 2026-06); if the program adds new combination constraints, this list must be updated to match.
- Pre-deploy mode is a guided review — the agent reads your source against the risk matrix — not a static parser.
- The extension set is current as of 2026-06; an unrecognized future extension is surfaced for manual review rather than ignored.

## Security posture

- **Zero runtime dependencies** — reads chain state via native `fetch`; no wallet, no keys, no bundled executables.
- **Clean `npm audit`** (0 advisories).
- Read-only. Informational, not financial or security advice; verify on-chain before acting.

## Project layout

```
skill/
  SKILL.md                  progressive, token-efficient router
  post-deploy-audit.md · pre-deploy-review.md
  resources/                extension-risk-matrix · incompatible-combinations · fix-templates
examples/
  audit-deployed.ts         runnable auditor
  validate.ts               mainnet validation
  lib/                      resolver · rules · combos · score · report (+ tests)
skill-registry.entry.json   entry for the Solana AI Kit registry
```

## License

MIT © [cassxbt](https://github.com/cassxbt)
