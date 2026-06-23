# Mintoscope — Token-2022 Risk Report

**Mint:** `2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo`
**Verdict:** CRITICAL (score 100/100)
**Summary:** CRITICAL: 8 extension(s), driven by PermanentDelegate.

## Findings

### [CRITICAL] PermanentDelegate
- What: A delegate that can transfer or burn this token from any account without the holder’s approval.
- Risk: The delegate can seize or burn any holder balance — full fund-seizure capability.
- Authority: delegate = 2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk (live)
- Fix: Renounce the permanent delegate unless seizure is an intended, disclosed feature.

### [HIGH] MintCloseAuthority
- What: Allows the mint account to be closed and its address reused.
- Risk: A closed mint can be reinitialized with different rules, bypassing fee/freeze/soulbound assumptions.
- Authority: closeAuthority = 2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk (live)
- Fix: Renounce the mint close authority for a fixed, immutable mint.

### [HIGH] TransferFeeConfig
- What: Charges a transfer fee (currently 0 bps), deducted from the recipient.
- Risk: The fee authority can change the fee at any time, up to 100%.
- Authority: transferFeeConfigAuthority = 2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk (live)
- Authority: withdrawWithheldAuthority = 2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk (live)
- Fix: Renounce the fee-config authority and disclose a capped fee.

### [HIGH] TransferHook
- What: Runs a custom program on every transfer; it can inspect and abort transfers.
- Risk: The hook authority can install or replace the hook program — transfers can be blocked or hijacked.
- Authority: authority = 2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk (live)
- Fix: Renounce the hook authority and verify any active hook program before integrating.

### [HIGH] MintAuthority
- What: The authority that can mint new supply of this token.
- Risk: A live mint authority can inflate supply without limit, diluting every holder.
- Authority: mintAuthority = 8Jornc27vtAYPkwDzsZVgLQchAYyC8nD7aCNPCDV8Qk2 (live)
- Fix: Renounce the mint authority for a fixed-supply token, or disclose the minting policy.

### [HIGH] FreezeAuthority
- What: Standard authority that can freeze individual token accounts.
- Risk: Any holder account can be frozen at will, trapping funds.
- Authority: freezeAuthority = 2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk (live)
- Fix: Renounce the freeze authority unless freezing is a required, disclosed control.

### [CAUTION] ConfidentialTransferMint
- What: Enables encrypted transfer amounts; may designate an auditor key.
- Risk: The authority controls account approval and config; an auditor key (if set) can view amounts.
- Authority: authority = 2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk (live)
- Fix: Confirm the auditor key and approval policy match your privacy expectations.

### [CAUTION] ConfidentialTransferFeeConfig
- What: Withheld-fee configuration for confidential transfers.
- Risk: A live authority controls withheld confidential fees.
- Authority: authority = 2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk (live)
- Fix: Confirm the authority is trusted or renounced.

### [CAUTION] MetadataPointer
- What: Points to the token’s metadata location.
- Risk: A live authority can repoint metadata; verify the pointer references this mint.
- Authority: authority = 2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk (live)
- Fix: Confirm the pointer is self-referential and the authority is trusted or renounced.

### [CAUTION] TokenMetadata
- What: On-chain name, symbol, and URI for the token.
- Risk: A live update authority can change name/symbol/URI — a vector for impersonation.
- Authority: updateAuthority = 2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk (live)
- Fix: Renounce the metadata update authority once final.

---
Informational only; not financial or security advice. Mintoscope audits mint configuration, not program logic or market risk. Verify on-chain before acting.

_Generated 2026-06-23T04:34:31.773Z · data accurate as of 2026-06_
