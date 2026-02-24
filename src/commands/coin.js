// src/commands/coin.js — coin detail + holders
// enhanced by Glaringly

'use strict';

const api = require('../api');
const {
  c, box, table, hr,
  fmtPrice, fmtChange, fmtMcap, fmtVol, fmtTime,
  candlestickChart, sparkline, progressBar, spinner, termWidth,
} = require('../display');

// ─── coin ─────────────────────────────────────────────────────────────────────

async function coin(args, flags) {
  const symbol = (args[0] || '').toUpperCase();
  if (!symbol) {
    console.log(c.red('  Usage: node index.js coin <SYMBOL> [--tf=1h]'));
    return;
  }

  const tf   = flags.tf || '1h';
  const spin = spinner(`Fetching ${symbol}`);

  let detail, candles;
  try {
    [detail, candles] = await Promise.all([
      api.getCoin(symbol),
      api.getCoinCandles(symbol, tf),
    ]);
  } finally {
    spin.stop();
  }

  const d     = detail?.coin || detail;
  const cdata = candles?.candles || candles?.data || candles || [];

  if (!d) {
    console.log(c.red(`  ✗ Coin "${symbol}" not found.`));
    return;
  }

  // ── Header info ────────────────────────────────────────────────────────────
  console.log('');
  const priceLine =
    `  ${c.bold(c.cyan(d.symbol))} ${c.dim('/')} ${c.white(d.name)}   ` +
    `${fmtPrice(d.currentPrice)}  ${fmtChange(d.change24h)}`;

  const statsLine =
    `  ${c.dim('Mkt Cap:')} ${fmtMcap(d.marketCap)}   ` +
    `${c.dim('Vol 24h:')} ${fmtVol(d.volume24h)}   ` +
    `${c.dim('Supply:')} ${c.white(Number(d.totalSupply || 0).toLocaleString())}`;

  const descLine = d.description
    ? `\n  ${c.dim(String(d.description).slice(0, 100))}${d.description.length > 100 ? c.dim('…') : ''}`
    : '';

  const createdLine = d.createdAt
    ? `  ${c.dim('Created:')} ${c.white(new Date(d.createdAt).toLocaleString())}`
    : '';

  console.log(priceLine);
  console.log(statsLine);
  if (descLine)   console.log(descLine);
  if (createdLine) console.log(createdLine);
  console.log('');

  // ── Sparkline preview ──────────────────────────────────────────────────────
  if (cdata.length > 0) {
    const prices = cdata.map(c => c.close);
    const spark  = sparkline(prices, 40);
    console.log(`  ${c.dim('Trend:')} ${spark}  ${c.dim('(' + cdata.length + ' candles)')}`);
    console.log('');
  }

  // ── Candlestick chart ──────────────────────────────────────────────────────
  const tfLabels = { '1m':'1 Min','5m':'5 Min','15m':'15 Min','1h':'1 Hour','4h':'4 Hour','1d':'1 Day' };
  const tfLabel  = tfLabels[tf] || tf;

  if (cdata.length > 0) {
    const chartStr = candlestickChart(cdata, termWidth() - 18);
    console.log(box(chartStr, `${symbol} — ${tfLabel} Chart`));
  } else {
    console.log(c.dim('  No candle data available for this timeframe.'));
  }

  // ── 24h stats ─────────────────────────────────────────────────────────────
  if (d.high24h || d.low24h) {
    console.log('');
    const range = parseFloat(d.high24h) - parseFloat(d.low24h);
    const pos   = parseFloat(d.currentPrice) - parseFloat(d.low24h);
    const pct   = range > 0 ? (pos / range) * 100 : 50;
    console.log(
      `  ${c.dim('24h Range:')} ` +
      `${fmtPrice(d.low24h)} ${progressBar(pct, 24)} ${fmtPrice(d.high24h)}`
    );
  }
  console.log('');

  // Timeframe hint
  const tfs = ['1m','5m','15m','1h','4h','1d'].filter(t => t !== tf);
  console.log(`  ${c.dim('Other timeframes:')} ${tfs.map(t => c.cyan(`--tf=${t}`)).join('  ')}`);
  console.log('');
}

// ─── holders ─────────────────────────────────────────────────────────────────

async function holders(args, flags) {
  const symbol = (args[0] || '').toUpperCase();
  if (!symbol) {
    console.log(c.red('  Usage: node index.js holders <SYMBOL> [--limit=50]'));
    return;
  }

  const limit = parseInt(flags.limit) || 50;
  const spin  = spinner(`Fetching holders of ${symbol}`);

  let data, detail;
  try {
    [data, detail] = await Promise.all([
      api.getCoinHolders(symbol, limit),
      api.getCoin(symbol),
    ]);
  } finally {
    spin.stop();
  }

  const holderList = data?.holders || data?.data || data || [];
  const d          = detail?.coin  || detail;
  const price      = parseFloat(d?.currentPrice || 0);

  if (!holderList.length) {
    console.log(c.yellow(`  No holders found for ${symbol}.`));
    return;
  }

  const total = holderList.reduce((s, h) => s + parseFloat(h.balance || 0), 0);

  const cols = [
    { key: '_rank',    label: '#',          width: 4,  align: 'right',
      format: (v) => c.dim(String(v).padStart(3)) },
    { key: 'userId',   label: 'User',        width: 22,
      format: (v) => c.cyan(String(v || '—').slice(0, 22)) },
    { key: 'balance',  label: 'Balance',     width: 18, align: 'right',
      format: (v) => c.white(Number(v).toLocaleString()) },
    { key: '_pct',     label: 'Share %',     width: 10, align: 'right',
      format: (v) => c.magenta(v.toFixed(2) + '%') },
    { key: '_value',   label: 'Value (USD)', width: 14, align: 'right',
      format: (v) => fmtPrice(v) },
    { key: '_bar',     label: 'Distribution', width: 22,
      format: (v, r) => progressBar(r._pct, 18, r._rank <= 3 ? c.bred : c.cyan) },
  ];

  const rows = holderList.slice(0, limit).map((h, i) => {
    const bal  = parseFloat(h.balance || 0);
    const pct  = total > 0 ? (bal / total) * 100 : 0;
    const val  = bal * price;
    return { ...h, _rank: i + 1, _pct: pct, _value: val, _bar: '' };
  });

  console.log('');
  console.log(box(table(rows, cols), `${symbol} — Top ${Math.min(limit, holderList.length)} Holders`));

  // Concentration warning
  const top1pct  = rows.slice(0, 1).reduce((s, r) => s + r._pct, 0);
  const top10pct = rows.slice(0, 10).reduce((s, r) => s + r._pct, 0);
  console.log('');
  const warn = top10pct > 80 ? c.red('⚠  HIGH concentration risk') : c.green('✓  Relatively distributed');
  console.log(`  ${warn}  ${c.dim(`Top 1: ${top1pct.toFixed(1)}%  Top 10: ${top10pct.toFixed(1)}%`)}`);
  console.log('');
}

module.exports = { coin, holders };
