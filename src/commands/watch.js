// src/commands/watch.js — live price watcher [NEW]
// by Glaringly

'use strict';

const api = require('../api');
const { c, fmtPrice, fmtChange, fmtMcap, sparkline, hr } = require('../display');

async function watch(args, flags) {
  const symbols  = args.map(s => s.toUpperCase()).filter(Boolean);
  const interval = parseInt(flags.interval) || 5;

  if (!symbols.length) {
    console.log(c.red('  Usage: node index.js watch <SYMBOL> [SYMBOL2 ...] [--interval=5]'));
    return;
  }

  console.log('');
  console.log(hr());
  console.log(`  ${c.bgreen('◉')} ${c.bold('PRICE WATCH')}  ${c.dim(`Refreshing every ${interval}s`)}  ${c.dim('Ctrl+C to exit')}`);
  console.log(`  ${c.dim('Watching:')} ${symbols.map(s => c.cyan(s)).join('  ')}`);
  console.log(hr());

  const history = {};
  symbols.forEach(s => { history[s] = []; });

  let running = true;
  process.on('SIGINT', () => {
    running = false;
    console.log(c.dim('\n  Stopped watching.\n'));
    process.exit(0);
  });

  let tick = 0;
  while (running) {
    const results = await Promise.allSettled(symbols.map(s => api.getCoin(s)));

    // Clear previous lines
    if (tick > 0) {
      process.stdout.write(`\x1b[${symbols.length + 3}A`);
    }

    console.log('');
    console.log(c.dim(`  Last update: ${new Date().toLocaleTimeString()}  Tick #${tick + 1}`));
    console.log('');

    results.forEach((result, i) => {
      const s = symbols[i];
      if (result.status === 'rejected') {
        console.log(`  ${c.bold(c.cyan(s.padEnd(8)))}  ${c.red('error fetching data')}`);
        return;
      }

      const d      = result.value?.coin || result.value;
      const price  = parseFloat(d?.currentPrice || 0);

      history[s].push(price);
      if (history[s].length > 40) history[s].shift();

      const prevPrice = history[s].length > 1 ? history[s][history[s].length - 2] : price;
      const flash     = price > prevPrice
        ? c.bgreen
        : price < prevPrice
          ? c.bred
          : c.white;

      const spark = history[s].length > 2
        ? sparkline(history[s], 20)
        : c.dim('─'.repeat(20));

      console.log(
        `  ${c.bold(c.cyan(s.padEnd(8)))}  ` +
        `${flash(fmtPrice(price)).padEnd(18)}  ` +
        `${fmtChange(d?.change24h).padEnd(12)}  ` +
        `${spark}  ` +
        `${c.dim('mcap:')} ${fmtMcap(d?.marketCap)}`
      );
    });

    tick++;

    // Wait interval seconds
    await new Promise(r => setTimeout(r, interval * 1000));
  }
}

module.exports = { watch };
