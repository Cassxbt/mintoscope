# Mintoscope

> Solana Token-2022 extension risk auditor — a Claude Code / Codex skill.

**Status: WIP** — building toward the Solana AI Kit skills bounty.

Mintoscope detects every Token-2022 extension on a Solana mint (or in your pre-deploy code), decomposes each authority (live vs. renounced), flags dangerous configurations and verified illegal extension combinations, assigns a severity tier, and prescribes fixes — in two modes:

- **Post-deploy:** point it at any mint address → severity tier + findings + fixes.
- **Pre-deploy:** guided review of your token-creation source before launch.

It is **mint-configuration** auditing — complementary to (not duplicating) program-logic auditors (Trail of Bits, Solana Foundation) and trader-facing token scanners.

See [`docs/SPEC.md`](docs/SPEC.md) for the full spec and build plan.

## License

MIT
