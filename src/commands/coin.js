import { api } from '../api.js';
import { c, $$, pct, num, trunc, pad, header, colHead, miniChart, tip, parseFlags, err } from '../display.js';

export async function cmdCoin(args) {
  const { pos, flags } = parseFlags(args);
  const symbol = pos[0];
  if (!symbol) { err('Usage: coin <SYMBOL> [--tf=1m|5m|15m|1h|4h|1d]'); return; }

  const tf = flags.tf ?? flags.timeframe ?? '1m';
  const data = await api.coin(symbol, tf);
  const coin = data.coin;

  header(`${coin.name}  (${coin.symbol})`);

  const row = (label, value) =>
    console.log(`  ${pad(c.yellow(label), 16)} ${value}`);

  row('Price',        $$(coin.currentPrice));
  row('24h Change',   pct(coin.change24h));
  row('Market Cap',   $$(coin.marketCap));
  row('Volume 24h',   $$(coin.volume24h));
  row('Supply',       num(coin.circulatingSupply, 0));
  row('Pool Coins',   num(coin.poolCoinAmount));
  row('Pool Base',    $$(coin.poolBaseCurrencyAmount));
  row('Creator',      `${coin.creatorName} ${c.dim('@' + coin.creatorUsername)}`);
  row('Created',      new Date(coin.createdAt).toLocaleString());
  row('Listed',       coin.isListed ? c.green('Yes') : c.red('No'));
  if (coin.isLocked) {
    const secs = Math.max(0, Math.ceil((new Date(coin.tradingUnlocksAt) - Date.now()) / 1000));
    row('Locked',     c.red(`${secs}s remaining`));
  }

  if (data.candlestickData?.length > 0) {
    console.log(`\n  ${c.bold(c.cyan(`Chart  [${data.timeframe}]`))}\n`);
    miniChart(data.candlestickData, 8, 50);
  }

  tip(`holders ${symbol}   — top holders\ncoin ${symbol} --tf=1h   — hourly chart`);
}

export async function cmdHolders(args) {
  const { pos, flags } = parseFlags(args);
  const symbol = pos[0];
  if (!symbol) { err('Usage: holders <SYMBOL> [--limit=N]'); return; }

  const limit = parseInt(flags.limit ?? pos[1] ?? '50');
  const data = await api.holders(symbol, limit);

  header(`Top Holders  —  ${data.coinSymbol}`);

  console.log(`  ${c.yellow('Total Holders')}   ${data.totalHolders}`);
  console.log(`  ${c.yellow('Circulating')}     ${num(data.circulatingSupply, 0)}`);
  console.log(`  ${c.yellow('Pool Price')}      ${$$(data.poolInfo.currentPrice)}\n`);

  colHead([
    ['#',         5],
    ['Username', 20],
    ['Quantity', 18, true],
    ['% Supply',  9, true],
    ['Liq Val',  13, true],
  ]);

  for (const h of data.holders) {
    const pctColor = h.percentage > 50 ? c.red : h.percentage > 20 ? c.yellow : (s) => s;
    console.log([
      pad(c.dim(h.rank),                       5),
      pad(c.bold(h.username),                 20),
      pad(num(h.quantity),                    18, true),
      pad(pctColor(h.percentage.toFixed(2) + '%'), 9, true),
      pad($$(h.liquidationValue),             13, true),
    ].join('  '));
  }

  console.log();
}