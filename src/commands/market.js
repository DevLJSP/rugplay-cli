import { api } from '../api.js';
import { c, $$, pct, pad, header, colHead, tip, parseFlags } from '../display.js';

export async function cmdTop() {
  const { coins } = await api.top();

  header('Top 50 Coins by Market Cap');
  colHead([
    ['#',         4],
    ['Symbol',   10],
    ['Name',     18],
    ['Price',    14, true],
    ['24h %',    10, true],
    ['Mkt Cap',  13, true],
    ['Vol 24h',  13, true],
  ]);

  coins.forEach((coin, i) => {
    console.log([
      pad(c.dim(i + 1),         4),
      pad(c.bold(coin.symbol), 10),
      pad(coin.name,           18),
      pad($$(coin.price),      14, true),
      pad(pct(coin.change24h), 10, true),
      pad($$(coin.marketCap),  13, true),
      pad($$(coin.volume24h),  13, true),
    ].join('  '));
  });

  tip('coin <SYMBOL>   — view details + chart');
}

export async function cmdMarket(args) {
  const { flags } = parseFlags(args);

  const params = {
    search:       flags.search  ?? flags.s,
    sortBy:       flags.sort    ?? 'marketCap',
    sortOrder:    flags.order   ?? 'desc',
    priceFilter:  flags.price   ?? 'all',
    changeFilter: flags.change  ?? 'all',
    page:         flags.page    ?? 1,
    limit:        flags.limit   ?? 20,
  };

  const data = await api.market(params);

  header(`Market  •  page ${data.page}/${data.totalPages}  (${data.total} coins)`);
  colHead([
    ['Symbol',   10],
    ['Name',     18],
    ['Price',    14, true],
    ['24h %',    10, true],
    ['Mkt Cap',  13, true],
    ['Vol 24h',  13, true],
    ['Creator',  14],
  ]);

  for (const coin of data.coins) {
    console.log([
      pad(c.bold(coin.symbol),       10),
      pad(coin.name,                 18),
      pad($$(coin.currentPrice),     14, true),
      pad(pct(coin.change24h),       10, true),
      pad($$(coin.marketCap),        13, true),
      pad($$(coin.volume24h),        13, true),
      pad(c.dim(coin.creatorName ?? ''), 14),
    ].join('  '));
  }

  console.log();
  tip(
    '--search=<q>  --sort=marketCap|currentPrice|change24h|volume24h|createdAt\n' +
    '   --order=asc|desc  --price=all|under1|1to10|10to100|over100\n' +
    '   --change=all|gainers|losers|hot|wild  --page=N  --limit=N'
  );
}