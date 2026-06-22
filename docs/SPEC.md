# Mintoscope — Spec & Implementation Plan (v2, stress-tested)

> **Working name:** `Mintoscope` (brand) · `token-2022-extension-auditor` (skill slug). Confirm or swap before Task 1.
> **Project home:** `/Users/apple/Downloads/mintoscope/`. All artifacts live here.

### Changelog v1 → v2 (post stress-test)
1. Resolver primary path is now **RPC `jsonParsed`** (validator-parsed extensions, version-proof) with `@solana/spl-token` typed accessors as secondary cross-check.
2. **Mint-level** extensions are the audit target; **account-level** extensions (MemoTransfer, CpiGuard, ImmutableOwner) demoted to an integrator advisory.
3. **Dropped the pre-deploy AST parser.** Pre-deploy = agent-guided review via the risk matrix (no brittle static parser).
4. Removed the `src/` build pipeline — ship lightweight self-contained scripts (no compile step, no bloat).
5. Output leads with **severity tiers**; 0–100 score is secondary.
6. Added disclaimer, accuracy date-stamp, source citations, configurable RPC.
7. Founder-fit (Q3) rewritten around the builder's security record (ArcNode contributions + HackerOne).

**Goal:** A Claude Code / Codex skill that audits Solana Token-2022 mints for risk — detects every mint extension, decomposes authorities, flags dangerous configs and verified illegal combinations, assigns a severity tier, and prescribes fixes — in two modes: post-deploy (any mint address) and pre-deploy (guided review of your own token-creation code).

**Architecture:** A progressive markdown skill (`skill/SKILL.md` router → focused `resources/*.md`) backed by a small, tested TypeScript auditor that reads mint extensions via **RPC `jsonParsed`** (primary) and `@solana/spl-token` typed accessors (secondary), runs a deterministic rule engine, and emits a `RiskReport` (severity tier + findings + markdown). No service, no API keys (configurable RPC). MIT.

**Tech Stack:** TypeScript (run via `tsx`, no build step), `@solana/web3.js` (RPC), `@solana/spl-token` (typed accessors, pinned version), Vitest. Optional adapter note for modern `@solana-program/token-2022`.

## Global Constraints
- MIT; no shady executables, no bloat, nothing opaque (sponsor rule).
- Production-grade, current to the **2026** stack; no pseudocode in shipped code.
- Progressive / token-efficient: `SKILL.md` routes, never an encyclopedia.
- Match the kit reference anatomy (`solanabr/solana-game-skill`): `skill/SKILL.md` frontmatter (`name`, `description`, `user-invocable: true`) + focused `.md` + `install.sh` + `README.md`.
- Every risk claim source-traceable; anything unverified is labeled unverified. Ship a disclaimer.
- This round's deadline: **2026-07-01 02:59:59 UTC**. Submission is **HUMAN_ONLY** (Cass submits).

---

## PART 1 — PRODUCT SPEC

### Problem & positioning
Token-2022 extensions add optional, powerful behaviors to a mint; several are fund-loss-grade if live or misconfigured (PermanentDelegate, TransferHook, Pausable, TransferFee, frozen-by-default). Builders ship footguns; integrators get rugged by hidden extensions. The kit does not close this specific gap:

| Existing kit skill | Covers | White space we own |
|---|---|---|
| SendAI `birdeye` token-security | ~7 coarse post-deploy API flags (`isMintable`, `freezeable`/authority, `transferFeeEnable`, `nonTransferable`, `mutableMetadata`, concentration, honeypot) | Per-authority decomposition, full mint-extension set, verified illegal-combo detection, severity tiers, **pre-deploy guided review** |
| Trail of Bits `token-integration-analyzer` | EVM/ERC20 only (Slither, "weird ERC20") | Entire Solana Token-2022 domain |
| Foundation `solana-dev-skill` token-2022.md | Usage docs ("how to build with it") | Risk-first auditing + automated detection + tiers |

**One-line:** *Detect, decompose, and score the risk of any Solana Token-2022 mint — before you deploy it or integrate it — and get the exact fixes.*

### Modes
- **Post-deploy (deterministic):** mint address → RPC fetch → extensions + authorities → verified combos → severity tier + findings + fixes.
- **Pre-deploy (guided):** the agent reviews the user's token-creation source using `resources/extension-risk-matrix.md` as the rubric (no static parser) — flags dangerous defaults / un-renounced authorities before launch.

### Output — `RiskReport`
- `severity`: `SAFE | CAUTION | HIGH | CRITICAL` (**primary** verdict).
- `score`: 0–100 (secondary, derived from severity weights; documented).
- `findings[]`: `{ extension, level, scope: 'mint'|'account', whatItIs, whyRisky, authority: {field, value, live}, remediation }`.
- `illegalCombos[]`: verified incompatibilities present (+ `versionDependent[]`, `manualReview[]`).
- `summary`: one-paragraph verdict.
- `disclaimer`: informational, not financial/security advice; verify on-chain; accuracy as of 2026-06.

### Mint-level extension risk matrix (full table → `resources/extension-risk-matrix.md`)
Severity is **conditional on authority state** (live/non-renounced = worse). Enum source-verified (`solana-program/token-2022`).

| Mint extension | Live-authority level | Core risk |
|---|---|---|
| PermanentDelegate (12) | CRITICAL | Delegate transfers/burns anyone's tokens — full seizure |
| PausableConfig (26) | CRITICAL | Global transfer halt |
| TransferHook (14) | HIGH→CRITICAL | Blocks transfers / swappable to malicious logic |
| TransferFeeConfig (1) | HIGH | Fee → up to 100%; breaks delta-naive accounting; charged to recipient |
| MintCloseAuthority (3) | HIGH | Close→reinit changes rules; bypasses freeze/fee/soulbound |
| FreezeAuthority (base mint field) | HIGH | Any account frozen at will |
| DefaultAccountState=Frozen (6) | MEDIUM (HIGH if no freeze authority to thaw) | New accounts frozen/bricked by default |
| InterestBearingConfig (10) / ScaledUiAmount (25) | MEDIUM | UI-amount only; phantom value if protocol trusts `amountToUiAmount` |
| ConfidentialTransferMint (4) | MEDIUM | Auditor key sees amounts; pending-balance DoS; gated approvals |
| MetadataPointer/TokenMetadata (18/19) | MEDIUM | Live update authority → name/symbol/URI phishing; validate bidirectional pointer |
| NonTransferable (9) | LOW alone / HIGH with MintCloseAuthority | Soulbound |
| (account-level: MemoTransfer 8, CpiGuard 11, ImmutableOwner 7) | advisory | Not on the mint — surfaced as integrator warnings only |

### Verified illegal combinations (ship as hard rules)
- NonTransferable + TransferFeeConfig
- NonTransferable + TransferHook
- ConfidentialTransfer + TransferHook

**Version-dependent (flag, don't hard-reject):** ConfidentialTransfer + TransferFeeConfig.
**Manual-review only (do NOT assert):** ConfidentialTransfer + PermanentDelegate; NonTransferable + PermanentDelegate.
**Dangerous-but-legal (flag):** MintCloseAuthority + NonTransferable; MintCloseAuthority + DefaultAccountState=Frozen.

### Out of scope (v1)
Program-logic vulns (→ Trail of Bits / Foundation security skills; we link, not duplicate). Price/liquidity/trading risk (→ Birdeye). We audit **mint configuration**.

### Reading extensions (verified, two-tier)
Primary — RPC `jsonParsed` (validator parses all extensions the cluster supports):
```ts
const res = await connection.getParsedAccountInfo(mintPk);
// res.value.data.parsed.info.extensions: [{ extension: 'transferFeeConfig', state: {...} }, ...]
// base info: data.parsed.info.{mintAuthority, freezeAuthority, decimals, supply}
```
Secondary cross-check — `@solana/spl-token` typed accessors:
```ts
import { getMint, getTransferFeeConfig, getPermanentDelegate, getTransferHook,
         getDefaultAccountState, getMintCloseAuthority, getMetadataPointerState,
         TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
const mint = await getMint(connection, mintPk, 'confirmed', TOKEN_2022_PROGRAM_ID);
const fee = getTransferFeeConfig(mint); // typed | null
```
"Renounced" = authority is `null`/`None`. Note: a renounced authority on a *fixed* dangerous value (e.g. 100% fee) is still flagged.

---

## PART 2 — REPO / FILE STRUCTURE (lightweight, no build step)
```
mintoscope/
├── README.md                     # what/why/install/usage + differentiation + 10-mint validation table + disclaimer
├── LICENSE                       # MIT
├── install.sh                    # kit-style install into ~/.claude/skills
├── skill-registry.entry.json     # snippet for the kit's skill-registry.json
├── package.json                  # deps + "test": vitest, run examples via tsx
├── skill/
│   ├── SKILL.md                  # router: when-to-use(+out-of-scope), decision table, routing, anti-rationalizations, deliverables, disclaimer
│   ├── post-deploy-audit.md      # intent → run audit-deployed.ts → read report
│   ├── pre-deploy-review.md      # guided source review using the matrix (no parser)
│   └── resources/
│       ├── extension-risk-matrix.md
│       ├── incompatible-combinations.md   # verified / version-dependent / manual-review
│       └── fix-templates.md
├── examples/
│   ├── audit-deployed.ts         # mint address → RiskReport (self-contained, tsx-runnable)
│   ├── lib/
│   │   ├── resolver.ts           # jsonParsed primary + spl-token secondary → ResolvedMint
│   │   ├── rules.ts              # per-extension level (authority-state conditional)
│   │   ├── combos.ts             # verified combos only
│   │   ├── score.ts              # findings → tier (+ secondary 0–100)
│   │   ├── report.ts             # RiskReport → markdown
│   │   └── types.ts              # Severity, Finding, RiskReport
│   └── fixtures/
│       └── mint-fixtures.ts      # script: mint Token-2022 test tokens w/ known extensions on localnet
└── docs/SPEC.md                  # this file
```

---

## PART 3 — IMPLEMENTATION PLAN (milestones → tasks; each ends testable; TDD)

### Milestone A — Scaffold
- **A1:** `git init`; repo skeleton; `package.json` (`@solana/web3.js`, `@solana/spl-token` pinned, `tsx`, `vitest`); MIT `LICENSE`; `types.ts` (`Severity`, `Finding`, `RiskReport`). Deliverable: `npm test` runs green-empty. Commit.

### Milestone B — Deterministic fixtures + resolver
- **B1 — `fixtures/mint-fixtures.ts`:** reproducible script minting Token-2022 test mints on localnet (Surfpool/LiteSVM): (i) plain SPL, (ii) TransferFee 1000bps live authority, (iii) +PermanentDelegate live, (iv) +TransferHook live, (v) DefaultAccountState=Frozen. Deliverable: `npm run fixtures` prints addresses. Commit.
- **B2 — `resolver.ts`:** `resolveMint(connection, address): ResolvedMint` via `getParsedAccountInfo` primary; reconcile with `@solana/spl-token` accessors; populate authorities + base freeze/mint authority. **Test:** each fixture → asserted extension set + authority fields. Commit.

### Milestone C — Risk engine
- **C1 — `rules.ts`:** `evaluate(resolved): Finding[]` per the matrix, level conditional on authority live/renounced; tag `scope`. **Test:** (ii) fee live→HIGH, renounced→CAUTION; (iii) PermanentDelegate live→CRITICAL.
- **C2 — `score.ts`:** `tier(findings): {severity, score}` (max-rollup; documented weights). **Test:** CRITICAL present→CRITICAL & score≥85; only LOW→CAUTION.

### Milestone D — Combos
- **D1 — `combos.ts`:** detect verified illegal combos + version-dependent + dangerous-legal; never assert manual-review pairs as illegal. **Test:** synthetic sets → expected classification.

### Milestone E — Report
- **E1 — `report.ts` + `audit-deployed.ts`:** assemble `RiskReport`, render markdown, include disclaimer. **Test:** golden-file for fixture (iii); JSON shape matches `types.ts`.

### Milestone F — The skill (submission core)
- **F1 — `SKILL.md`:** frontmatter (`name: token-2022-extension-auditor`, keyword-rich `description`, `user-invocable: true`); when-to-use + explicit out-of-scope (link ToB/Foundation); decision table; routing; anti-rationalization table (≥6); Deliverables; disclaimer.
- **F2 — `resources/*.md`:** full matrix, combos (verification-tagged), fix templates — sourced + date-stamped.
- **F3 — `post-deploy-audit.md` + `pre-deploy-review.md`:** intent → action → read output / guided rubric.

### Milestone G — Package & validate
- **G1 — `install.sh` + `skill-registry.entry.json`:** kit-style install + registry snippet.
- **G2 — Real-world validation:** run against 10+ live mainnet Token-2022 mints (incl. known-risky); record outputs as README evidence; fix mismatches. (The "production-grade, tested" proof.)
- **G3 (optional polish) — `/audit-token` command** under `commands/` for extra Fit signal.

### Milestone H — Submission
- **H1 — `README.md`:** problem, usage, **explicit differentiation vs birdeye/ToB/Foundation**, 10-mint validation table, disclaimer, MIT.
- **H2 — demo + optional tweet** (form has an optional tweet link sponsors repost).

---

## PART 4 — SUBMISSION PLAN
- **Path:** new public repo (branding + founder-fit) vs seed PR. Recommended: new repo.
- **Mechanics:** submit repo link + questionnaire by **2026-07-01 02:59 UTC**; Cass submits (HUMAN_ONLY).
- **Questionnaire (draft):**
  1. *New idea or contribution?* → "New skill — fills a Token-2022 extension-risk gap not covered by the kit's token/security skills."
  2. *Closest competing skill?* → "SendAI `birdeye` token-security (7 coarse post-deploy flags) and Trail of Bits `token-integration-analyzer` (EVM-only). Mintoscope is Solana-native, full mint-extension set, authority-decomposed, verified-combo aware, pre+post-deploy, with severity tiers."
  3. *Founder-market-fit / why you?* → **Security record:** top contributor to Secoo's ArcNode repo + HackerOne submissions [LINKS PENDING]; plus shipped on-chain payments infra (AgentPay x402 MCP — ENS prize, Circle-CEO retweet; Arcadeonarc CCTP v2, 8 networks, 5k+ users) → deep SPL/USDC + token-authority fluency; plus the 10-mint validation table proving the tool works.

---

## PART 5 — OPEN DECISIONS (before Task 1)
1. **Name:** Mintoscope vs ExtensionGuard. (Slug stays `token-2022-extension-auditor`.)
2. **v1 scope:** post-deploy deterministic + pre-deploy guided (recommended); cut nothing else.
3. **Repo vs seed PR:** new repo (recommended).
4. **Provide:** ArcNode contribution link + HackerOne profile for Q3.

## SELF-REVIEW
- Coverage: every Part-1 capability maps to a task (resolver→B, rules→C, combos→D, report→E, skill→F, validate→G, submit→H). ✓
- No unverified claims shipped as fact (combos verification-tagged; matrix authority-conditional; disclaimer). ✓
- Type consistency: `Severity`/`Finding`/`RiskReport` defined A1, consumed C/D/E. ✓
- Stress-test defects 1–6 all resolved above. Residual dupe risk mitigated by depth + validation evidence.
