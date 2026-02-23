#!/usr/bin/env node

import { cmdTop, cmdMarket }        from './src/commands/market.js';
import { cmdCoin, cmdHolders }      from './src/commands/coin.js';
import { cmdHopium, cmdHopiumQ }    from './src/commands/hopium.js';
import { cmdLeaderboard }           from './src/commands/leaderboard.js';
import { cmdTrades }                from './src/commands/trades.js';
import { c, err }                   from './src/display.js';

const COMMANDS = {
  top:         { fn: cmdTop,          desc: 'Top 50 coins by market cap' },
  market:      { fn: cmdMarket,       desc: 'Browse market  [--search --sort --page ...]' },
  coin:        { fn: cmdCoin,         desc: 'Coin detail + chart  <SYMBOL> [--tf=1m|1h|...]' },
  holders:     { fn: cmdHolders,      desc: 'Top holders  <SYMBOL> [--limit=N]' },
  trades:      { fn: cmdTrades,       desc: 'Recent trades  [--limit=N] [--min=VALUE]' },
  leaderboard: { fn: cmdLeaderboard,  desc: 'Leaderboard  <rugpullers|losers|cash|rich>' },
  lb:          { fn: cmdLeaderboard,  desc: 'Alias for leaderboard' },
  hopium:      { fn: cmdHopium,       desc: 'Prediction markets  [--status=ACTIVE|ALL]' },
  'hopium-q':  { fn: cmdHopiumQ,      desc: 'Prediction detail  <ID>' },
};

function showHelp() {
  console.log(`
${c.bold(c.cyan('rugplay-cli'))}  ${c.dim('— rugplay.com terminal client (no API key needed)')}

${c.yellow('Usage:')}  node index.js <command> [args]

${c.yellow('Commands:')}
`);
  for (const [name, { desc }] of Object.entries(COMMANDS)) {
    if (name === 'lb') continue;
    console.log(`  ${c.bold(c.green(name.padEnd(14)))}  ${desc}`);
  }
  console.log(`
${c.yellow('Examples:')}
  node index.js top
  node index.js coin BTC --tf=1h
  node index.js market --search=doge --change=gainers --limit=10
  node index.js holders TEST --limit=20
  node index.js trades --limit=50 --min=500
  node index.js leaderboard rich
  node index.js hopium --status=ALL --page=2
  node index.js hopium-q 101
`);
}

async function main() {
  const [,, cmd, ...args] = process.argv;

  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    showHelp();
    return;
  }

  const entry = COMMANDS[cmd.toLowerCase()];
  if (!entry) {
    err(`Unknown command: "${cmd}"`);
    showHelp();
    process.exit(1);
  }

  try {
    await entry.fn(args);
  } catch (e) {
    err(e.message);
    process.exit(1);
  }
}

main();