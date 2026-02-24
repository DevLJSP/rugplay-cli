#!/usr/bin/env node
// rugplay-cli — enhanced fork by Glaringly
// original by zt01 | upgraded to the MAX

const { checkForUpdate } = require('./src/updater');
const { printBanner }    = require('./src/display');

const COMMANDS = {
  top:         () => require('./src/commands/market').top(),
  market:      () => require('./src/commands/market').market(args, flags),
  coin:        () => require('./src/commands/coin').coin(args, flags),
  holders:     () => require('./src/commands/coin').holders(args, flags),
  trades:      () => require('./src/commands/trades').trades(flags),
  live:        () => require('./src/commands/live').live(flags),
  leaderboard: () => require('./src/commands/leaderboard').leaderboard(args),
  hopium:      () => require('./src/commands/hopium').hopium(flags),
  'hopium-q':  () => require('./src/commands/hopium').hopiumQuestion(args),
  macro:       () => require('./src/commands/macro').macro(args, flags),
  portfolio:   () => require('./src/commands/portfolio').portfolio(args, flags),
  watch:       () => require('./src/commands/watch').watch(args, flags),
  alert:       () => require('./src/commands/alert').alert(args, flags),
  help:        () => showHelp(),
};

// Parse CLI args
const rawArgs = process.argv.slice(2);
const cmd     = rawArgs[0];
const args    = rawArgs.slice(1).filter(a => !a.startsWith('--'));
const flags   = {};
rawArgs.slice(1).filter(a => a.startsWith('--')).forEach(f => {
  const [k, v] = f.slice(2).split('=');
  flags[k] = v !== undefined ? v : true;
});

async function main() {
  printBanner();
  await checkForUpdate();

  if (!cmd || cmd === 'help') {
    showHelp();
    return;
  }

  const handler = COMMANDS[cmd];
  if (!handler) {
    const { c } = require('./src/display');
    console.log(c.red(`\n  ✗ Unknown command: "${cmd}"\n`));
    console.log(`  Run ${c.cyan('node index.js help')} to see all commands.\n`);
    process.exit(1);
  }

  try {
    await handler();
  } catch (err) {
    const { c } = require('./src/display');
    console.error(c.red(`\n  ✗ Error: ${err.message}\n`));
    if (flags.debug) console.error(err.stack);
    process.exit(1);
  }
}

function showHelp() {
  const { c, box } = require('./src/display');
  const lines = [
    `${c.bold(c.cyan('rugplay-cli'))} ${c.dim('— terminal client for rugplay.com')}`,
    '',
    `${c.bold(c.yellow('MARKET'))}`,
    `  ${c.cyan('top')}                              Top 50 coins by market cap`,
    `  ${c.cyan('market')}  [--search=] [--sort=] [--change=] [--price=] [--page=] [--limit=]`,
    `  ${c.cyan('coin')}    <SYMBOL> [--tf=1m|5m|15m|1h|4h|1d]  ASCII candlestick chart`,
    `  ${c.cyan('holders')} <SYMBOL> [--limit=]      Top holders & liquidation values`,
    '',
    `${c.bold(c.yellow('TRADING'))}`,
    `  ${c.cyan('trades')}  [--limit=] [--min=]      Recent trades snapshot`,
    `  ${c.cyan('live')}    [--min=]                 Real-time WebSocket stream`,
    '',
    `${c.bold(c.yellow('RANKINGS'))}`,
    `  ${c.cyan('leaderboard')} <rugpullers|losers|cash|rich>`,
    '',
    `${c.bold(c.yellow('PREDICTIONS'))}`,
    `  ${c.cyan('hopium')}    [--status=ACTIVE|RESOLVED|ALL] [--page=]`,
    `  ${c.cyan('hopium-q')} <id>                    Question detail + chart`,
    '',
    `${c.bold(c.yellow('TOOLS'))}`,
    `  ${c.cyan('portfolio')} <userId>                View a user portfolio`,
    `  ${c.cyan('watch')}     <SYMBOL> [--interval=5] Live price watcher`,
    `  ${c.cyan('macro')}     <list|add|run|remove>   Saved command shortcuts`,
    '',
    `${c.dim('  Add --debug to any command for verbose error output')}`,
  ];
  console.log(box(lines.join('\n'), 'Commands'));
}

main();
