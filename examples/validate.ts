import { resolveMint } from './lib/resolver';
import { buildReport } from './lib/report';

const RPC = process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com';

// Default real mainnet mints. The auditor self-verifies the program owner, so each
// row reflects on-chain truth. Pass mint addresses as CLI args to audit your own set.
const DEFAULTS: Array<[string, string]> = [
  ['PYUSD', '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo'],
  ['USDC', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'],
  ['USDT', 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'],
  ['BONK', 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'],
  ['wSOL', 'So11111111111111111111111111111111111111112'],
  ['JUP', 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'],
];

const cli = process.argv.slice(2);
const targets: Array<[string, string]> = cli.length ? cli.map((a) => [a.slice(0, 6), a]) : DEFAULTS;

console.log('Mint   | Program      | Severity | Sc  | Extensions');
console.log('-------|--------------|----------|-----|-----------');
for (const [label, addr] of targets) {
  try {
    const mint = await resolveMint(RPC, addr);
    const report = buildReport(mint);
    const exts = mint.extensions.filter((e) => e.scope === 'mint').map((e) => e.type);
    const kind = mint.isToken2022 ? 'Token-2022' : 'classic SPL';
    console.log(
      `${label.padEnd(6)} | ${kind.padEnd(12)} | ${report.severity.padEnd(8)} | ${String(report.score).padStart(3)} | ${exts.join(', ') || '—'}`,
    );
  } catch (e) {
    console.log(`${label.padEnd(6)} | ERROR        |          |     | ${(e as Error).message}`);
  }
}
