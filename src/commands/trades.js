import { api } from '../api.js';
import { c, $$, num, trunc, pad, header, colHead, timeAgo, tip, parseFlags, err } from '../display.js';

export async function cmdTrades(args) {
  const { flags, pos } = parseFlags(args);
  const limit = parseInt(flags.limit ?? pos[0] ?? '30');
  const minValue = parseFloat(flags.min ?? flags.minValue ?? '0');

  if (isNaN(limit) || limit < 1 || limit > 1000) {
    err('--limit must be between 1 and 1000');
    return;
  }

  const data = await api.trades(limit, minValue);
  const trades = data.trades;

  header(`Recent Trades  (${trades.length} shown${minValue > 0 ? `  •  min $${minValue}` : ''})`);
  colHead([
    ['Type',     6],
    ['User',    18],
    ['Coin',     8],
    ['Amount',  14, true],
    ['Value',   13, true],
    ['Price',   13, true],
    ['When',     8],
  ]);

  for (const t of trades) {
    const isBuy = t.type === 'BUY';
    const typeTxt = isBuy ? c.green('BUY') : c.red('SELL');
    console.log([
      pad(typeTxt,                                    6),
      pad(c.bold(trunc(t.username, 18)),             18),
      pad(c.cyan(t.coinSymbol),                       8),
      pad(num(t.amount),                             14, true),
      pad(isBuy ? c.green($$(t.totalValue)) : c.red($$(t.totalValue)), 13, true),
      pad($$(t.price),                               13, true),
      pad(c.dim(timeAgo(t.timestamp)),                8),
    ].join('  '));
  }

  tip('--limit=N   --min=<min_value>   e.g. trades --limit=50 --min=1000');
}