// src/commands/market.js — top, market commands
// enhanced by Glaringly

'use strict';

const api = require('../api');
const {
  c, box, table, hr,
  fmtPrice, fmtChange, fmtMcap, fmtVol,
  sparkline, spinner, termWidth,
} = require('../display');

// ─── top ─────────────────────────────────────────────────────────────────────

async function top() {
  const spin = spinner('Fetching top 50 coins');
  let data;
  try {
    data = await api.getTopCoins();
  } finally {
    spin.stop();
  }

  const coins = data?.coins || data?.data || data || [];
  if (!coins.length) {
    console.log(c.red('  No data returned.'));
    return;
  }

  const cols = [
    { key: 'rank',          label: '#',       width: 4,  align: 'right',
      format: (v, r) => c.dim(String(r._rank || '?').padStart(3)) },
    { key: 'symbol',        label: 'Symbol',  width: 10,
      format: (v) => c.bold(c.cyan(v)) },
    { key: 'name',          label: 'Name',    width: 18,
      format: (v) => c.white(String(v).slice(0, 18)) },
    { key: 'currentPrice',  label: 'Price',   width: 14, align: 'right',
      format: (v) => fmtPrice(v) },
    { key: 'change24h',     label: '24h %',   width: 10, align: 'right',
      format: (v) => fmtChange(v) },
    { key: 'marketCap',     label: 'Mkt Cap', width: 12, align: 'right',
      format: (v) => fmtMcap(v) },
    { key: 'volume24h',     label: 'Vol 24h', width: 12, align: 'right',
      format: (v) => fmtVol(v) },
  ];

  const rows = coins.slice(0, 50).map((coin, i) => ({ ...coin, _rank: i + 1 }));

  console.log('');
  console.log(box(table(rows, cols), `Top 50 Coins by Market Cap`));

  // Mini summary
  const gainers = coins.filter(c => parseFloat(c.change24h) > 0).length;
  const losers  = coins.filter(c => parseFloat(c.change24h) < 0).length;
  console.log('');
  console.log(
    `  ${c.dim('Market sentiment:')} ` +
    `${c.green(`${gainers} gainers`)} ${c.dim('/')} ${c.red(`${losers} losers`)} ` +
    c.dim('in top 50')
  );
  console.log('');
}

// ─── market ───────────────────────────────────────────────────────────────────

async function market(args, flags) {
  const opts = {
    search: flags.search || '',
    sort:   flags.sort   || 'marketCap',
    order:  flags.order  || 'desc',
    price:  flags.price  || 'all',
    change: flags.change || 'all',
    page:   parseInt(flags.page)  || 1,
    limit:  parseInt(flags.limit) || 20,
  };

  const spin = spinner('Fetching market data');
  let data;
  try {
    data = await api.getMarket(opts);
  } finally {
    spin.stop();
  }

  const coins = data?.coins || data?.data || data || [];
  const total = data?.total || coins.length;

  if (!coins.length) {
    console.log(c.yellow('  No coins matched your filters.'));
    return;
  }

  const cols = [
    { key: '_rank',         label: '#',       width: 4,  align: 'right',
      format: (v) => c.dim(String(v).padStart(3)) },
    { key: 'symbol',        label: 'Symbol',  width: 10,
      format: (v) => c.bold(c.cyan(v)) },
    { key: 'name',          label: 'Name',    width: 18,
      format: (v) => c.white(String(v).slice(0, 18)) },
    { key: 'currentPrice',  label: 'Price',   width: 14, align: 'right',
      format: (v) => fmtPrice(v) },
    { key: 'change24h',     label: '24h %',   width: 10, align: 'right',
      format: (v) => fmtChange(v) },
    { key: 'marketCap',     label: 'Mkt Cap', width: 12, align: 'right',
      format: (v) => fmtMcap(v) },
    { key: 'volume24h',     label: 'Volume',  width: 12, align: 'right',
      format: (v) => fmtVol(v) },
    { key: 'createdAt',     label: 'Age',     width: 10,
      format: (v) => {
        if (!v) return c.dim('—');
        const secs = (Date.now() - new Date(v).getTime()) / 1000;
        if (secs < 3600)   return c.bgreen(`${Math.floor(secs/60)}m`);
        if (secs < 86400)  return c.green(`${Math.floor(secs/3600)}h`);
        return c.dim(`${Math.floor(secs/86400)}d`);
      }
    },
  ];

  const startRank = (opts.page - 1) * opts.limit + 1;
  const rows      = coins.map((coin, i) => ({ ...coin, _rank: startRank + i }));

  // Title bar
  let title = 'Market';
  if (opts.search) title += ` › search: ${opts.search}`;
  if (opts.change !== 'all') title += ` › ${opts.change}`;
  if (opts.price  !== 'all') title += ` › ${opts.price}`;
  title += `  (page ${opts.page}, ${opts.limit}/page, ${total} total)`;

  console.log('');
  console.log(box(table(rows, cols), title));

  // Pagination hint
  const totalPages = Math.ceil(total / opts.limit);
  if (totalPages > 1) {
    const prev = opts.page > 1          ? c.cyan(`--page=${opts.page - 1}`) : c.dim('--page=prev');
    const next = opts.page < totalPages ? c.cyan(`--page=${opts.page + 1}`) : c.dim('--page=next');
    console.log(`\n  ${c.dim('◀')} ${prev}   ${next} ${c.dim('▶')}   ${c.dim(`page ${opts.page} of ${totalPages}`)}\n`);
  } else {
    console.log('');
  }
}

module.exports = { top, market };
