# Extension Combinations

Classification is conservative: nothing is asserted **illegal** unless verified against the Token-2022 program source. Real mainnet mints disprove several commonly-repeated incompatibility claims — e.g. **PYUSD carries `ConfidentialTransferMint` + `TransferHook` together** — so those are `version-dependent` or `manual-review`, never a hard reject.

| Combination | Classification | Note |
|---|---|---|
| NonTransferable + TransferFeeConfig | manual-review | Logically conflicting (no transfers to charge); not verified against source |
| NonTransferable + TransferHook | manual-review | Logically conflicting (no transfers to hook); not verified against source |
| ConfidentialTransferMint + TransferHook | version-dependent | PYUSD carries both; depends on version/activation |
| ConfidentialTransferMint + TransferFeeConfig | version-dependent | Historically incompatible; depends on runtime version |
| MintCloseAuthority + NonTransferable | dangerous-legal | Close + reinit can drop NonTransferable, making a soulbound token transferable |
| MintCloseAuthority + DefaultAccountState (frozen) | dangerous-legal | Accounts created before a close+reinit bypass the frozen default |
| ConfidentialTransferMint + PermanentDelegate | manual-review | Encrypted amounts vs. forced transfers — interaction unverified |
| NonTransferable + PermanentDelegate | manual-review | Soulbound vs. forced transfer — interaction unverified |

To promote a pair to `illegal`, verify that the Token-2022 program rejects it at mint initialization, then update `combos.ts` and this table together.
