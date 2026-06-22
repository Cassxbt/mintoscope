# Pre-Deploy Review (guided)

Before a token reaches mainnet, review its creation code against the risk matrix. There is no static parser — read the source and apply the rubric.

## Steps
1. Find every extension initialized (e.g. `createInitializeTransferFeeConfigInstruction`, `createInitializePermanentDelegateInstruction`, `createInitializeTransferHookInstruction`, …) — they must run before `createInitializeMintInstruction`.
2. For each, check its live-authority severity in [resources/extension-risk-matrix.md](resources/extension-risk-matrix.md).
3. For every dangerous authority (PermanentDelegate, Pausable, TransferHook, TransferFee, Close, Freeze): confirm it is either renounced before launch or intentional and disclosed.
4. Check combinations against [resources/incompatible-combinations.md](resources/incompatible-combinations.md).
5. Apply [resources/fix-templates.md](resources/fix-templates.md) to renounce or cap anything not intended.

## Checklist
- [ ] No live `PermanentDelegate` (unless seizure is a disclosed feature)
- [ ] No live `PausableConfig` authority (or behind timelock/multisig)
- [ ] `TransferHook` authority renounced; any hook program audited
- [ ] `TransferFee` at a disclosed cap; fee authority renounced
- [ ] `MintCloseAuthority` renounced (fixed mint)
- [ ] `FreezeAuthority` renounced (unless required and disclosed)
- [ ] `DefaultAccountState` not frozen (unless a thaw flow + trusted freeze authority exist)
- [ ] Metadata update authority renounced once final
- [ ] No dangerous / manual-review combinations left unaddressed
