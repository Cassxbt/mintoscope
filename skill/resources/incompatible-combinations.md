# Extension Combinations

The illegal combinations below are taken verbatim from the Token-2022 program's `check_for_invalid_mint_extension_combinations` — mint initialization rejects them on-chain. The dangerous-but-legal pairs are accepted by the program but warrant a warning.

## Illegal (rejected at mint init)

| Condition | Why |
|---|---|
| `ConfidentialTransferFeeConfig` without both `TransferFeeConfig` and `ConfidentialTransferMint` | Fee-config for confidential transfers has nothing to attach to |
| `TransferFeeConfig` + `ConfidentialTransferMint` without `ConfidentialTransferFeeConfig` | A confidential fee-config is required for the pair |
| `ConfidentialMintBurn` without `ConfidentialTransferMint` | Confidential mint/burn extends confidential transfers |
| `ScaledUiAmountConfig` + `InterestBearingConfig` | Two competing UI-amount rescalers cannot coexist |
| `NonTransferable` + `ConfidentialTransferMint` without `ConfidentialMintBurn` | Confidential balances on a non-transferable token need confidential mint/burn |

Note: the `TransferFeeConfig + ConfidentialTransferMint + ConfidentialTransferFeeConfig` trio **is** legal together — PYUSD ships exactly this. The rule fires only when the required third extension is absent.

## Dangerous but legal

| Combination | Why |
|---|---|
| `MintCloseAuthority` + `NonTransferable` | Close + reinitialize can drop NonTransferable, making a soulbound token transferable |
| `MintCloseAuthority` + `DefaultAccountState` (frozen) | Accounts created before a close + reinit bypass the frozen-by-default state |

Source: [`check_for_invalid_mint_extension_combinations`](https://github.com/solana-program/token-2022/blob/main/interface/src/extension/mod.rs) in `solana-program/token-2022` (verified 2026-06).
