import { api } from '../api.js';
import { c, $$, pad, header, colHead, tip } from '../display.js';

export async function cmdLeaderboard(args) {
  const mode = args[0] ?? 'rugpullers';
  const data = await api.leaderboard();

  const modes = {
    rugpullers:      showRugpullers,
    losers:          showLosers,
    cash:            showCash,
    rich:            showRich,
  };

  const fn = modes[mode];
  if (!fn) {
    console.log(c.red(`Unknown mode "${mode}". Choose: rugpullers | losers | cash | rich`));
    return;
  }

  fn(data);
  tip('leaderboard <mode>   —   rugpullers | losers | cash | rich');
}

function medal(i) {
  if (i === 0) return '🥇';
  if (i === 1) return '🥈';
  if (i === 2) return '🥉';
  return c.dim(String(i + 1));
}

function showRugpullers(data) {
  header('Top Rugpullers (24h net profit from sells)');
  colHead([
    ['',         4],
    ['Username', 22],
    ['Extracted', 14, true],
    ['Sold',      14, true],
    ['Bought',    14, true],
  ]);
  for (const [i, u] of data.topRugpullers.entries()) {
    console.log([
      pad(medal(i),             4),
      pad(c.bold(u.username),  22),
      pad(c.green($$(u.totalExtracted)), 14, true),
      pad($$(Number(u.totalSold)),   14, true),
      pad($$(Number(u.totalBought)), 14, true),
    ].join('  '));
  }
  console.log();
}

function showLosers(data) {
  header('Biggest Losers (24h)');
  colHead([
    ['',         4],
    ['Username', 22],
    ['Loss',     14, true],
    ['Spent',    14, true],
    ['Received', 14, true],
    ['Cur Val',  12, true],
  ]);
  for (const [i, u] of data.biggestLosers.entries()) {
    console.log([
      pad(medal(i),                      4),
      pad(c.bold(u.username),           22),
      pad(c.red($$(u.totalLoss)),       14, true),
      pad($$(u.moneySpent),             14, true),
      pad($$(u.moneyReceived),          14, true),
      pad($$(u.currentValue),           12, true),
    ].join('  '));
  }
  console.log();
}

function showCash(data) {
  header('Cash Kings (highest BUSS balance)');
  colHead([
    ['',         4],
    ['Username', 22],
    ['Balance',  14, true],
    ['Coin Val', 14, true],
    ['Total',    14, true],
  ]);
  for (const [i, u] of data.cashKings.entries()) {
    console.log([
      pad(medal(i),                             4),
      pad(c.bold(u.username),                  22),
      pad(c.green($$(u.baseCurrencyBalance)),  14, true),
      pad($$(u.coinValue),                     14, true),
      pad(c.bold($$(u.totalPortfolioValue)),   14, true),
    ].join('  '));
  }
  console.log();
}

function showRich(data) {
  header('Paper Millionaires (highest total portfolio)');
  colHead([
    ['',         4],
    ['Username', 22],
    ['Total',    14, true],
    ['Cash',     14, true],
    ['Coins',    14, true],
  ]);
  for (const [i, u] of data.paperMillionaires.entries()) {
    console.log([
      pad(medal(i),                             4),
      pad(c.bold(u.username),                  22),
      pad(c.bold($$(u.totalPortfolioValue)),   14, true),
      pad($$(u.baseCurrencyBalance),           14, true),
      pad($$(u.coinValue),                     14, true),
    ].join('  '));
  }
  console.log();
}