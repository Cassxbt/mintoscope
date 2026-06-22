# Fix Templates

Most remediations are: renounce an authority (set it to null) before mainnet, or cap a value and then renounce.

## Renounce an authority — spl-token CLI
```bash
# Disable an authority on a Token-2022 mint (irreversible).
spl-token authorize <MINT> <AUTHORITY_TYPE> --disable
```
Common `<AUTHORITY_TYPE>` values: `mint`, `freeze`, `close`, `transfer-fee-config`, `withheld-withdraw`, `permanent-delegate`, `transfer-hook-program-id`, `interest-rate`, `metadata`. (Run against the Token-2022 program; confirm the exact type names with `spl-token authorize --help` for your CLI version.)

## Renounce an authority — @solana/spl-token (TypeScript)
```ts
import { setAuthority, AuthorityType, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

await setAuthority(
  connection,
  payer,
  mint,
  currentAuthority,
  AuthorityType.PermanentDelegate, // or CloseMint, TransferFeeConfig, TransferHookProgramId, FreezeAccount, ...
  null,                            // null = renounce
  [],
  undefined,
  TOKEN_2022_PROGRAM_ID,
);
```
Confirm the exact `AuthorityType` member names against your installed `@solana/spl-token` version.

## Cap or remove a transfer fee
Set basis points to a disclosed cap (or 0), then renounce `transferFeeConfigAuthority`. A renounced authority with a fixed, disclosed fee is acceptable; a live authority is not.

## Verify a transfer hook
Read the hook `programId`. Confirm it is an audited, immutable program before integrating. Renounce the hook `authority` so it cannot be swapped later.

## Frozen-by-default
Only ship `DefaultAccountState = frozen` with a documented thaw flow and a trusted, live freeze authority. Otherwise new holders are bricked on first receive.
