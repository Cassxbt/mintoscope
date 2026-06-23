# Post-Deploy Audit

Audit any live Token-2022 mint by address.

## Run
```bash
npm install
SOLANA_RPC_URL=<rpc> npm run audit -- <MINT_ADDRESS>         # markdown report
SOLANA_RPC_URL=<rpc> npm run audit -- <MINT_ADDRESS> --json  # machine-readable
```
Run these from the cloned `mintoscope` repo root — `install.sh` adds the skill guidance to your agent, and the repo ships the runnable CLI. Defaults to mainnet-beta if `SOLANA_RPC_URL` is unset; use a dedicated RPC (e.g. Helius) to avoid public rate limits.

## Pipeline
`resolveMint` (RPC `jsonParsed`) → `evaluate` (per-extension rules) → `detectCombos` → `score` → `buildReport` → `renderMarkdown`. The interpreter is pure and unit-tested; only the fetch touches the network.

## Reading the report
- The **verdict** is the severity tier — lead with it. The 0–100 score is secondary.
- Each finding states what the extension is, the risk, the exact authority (live/renounced), and the fix.
- Combination flags are conservative: verify `version-dependent` / `manual-review` entries on your target cluster.
- **CRITICAL means capability, not intent.** PYUSD audits as CRITICAL because Paxos holds a live `PermanentDelegate` (and freeze/close) for compliance — legitimate, but you are trusting that controller.

## Example
`2b1kV6Dk…` (PYUSD) → **CRITICAL**: live `PermanentDelegate`, `MintAuthority`, `MintCloseAuthority`, `TransferFeeConfig`, `TransferHook`, and `FreezeAuthority`, all under one Paxos key. No illegal combinations — it carries the legal TransferFee + Confidential trio.
