---
description: Audit a Solana Token-2022 mint for extension / configuration risk
argument-hint: <MINT_ADDRESS>
---

Use the `token-2022-extension-auditor` skill to audit the mint in `$ARGUMENTS`.

Run from the mintoscope repo (clone it and run `npm install` once; the auditor script ships with the repo):

```bash
npm run audit -- $ARGUMENTS
```

Then summarize for the user:
- the **severity verdict** (SAFE / CAUTION / HIGH / CRITICAL),
- each CRITICAL and HIGH finding with its live authority,
- any illegal or dangerous-legal extension combinations,
- the top remediations.

Lead with the severity tier. Remember: CRITICAL means capability, not intent.
