import { resolveMint } from './lib/resolver';
import { buildReport, renderMarkdown } from './lib/report';

const rpc = process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com';
const mint = process.argv[2];

if (!mint) {
  console.error('Usage: npm run audit -- <MINT_ADDRESS> [--json]   (set SOLANA_RPC_URL to override the RPC)');
  process.exit(1);
}

const report = buildReport(await resolveMint(rpc, mint));
console.log(process.argv.includes('--json') ? JSON.stringify(report, null, 2) : renderMarkdown(report));
