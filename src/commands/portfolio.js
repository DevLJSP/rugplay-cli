// src/commands/portfolio.js — view a user's portfolio [NEW]
// by Glaringly

'use strict';

const api = require('../api');
const { c, box, table, fmtPrice, fmtChange, fmtMcap, progressBar, spinner } = require('../display');

async function portfolio(args, flags) {
  const userId = args[0];
  if (!userId) {
    console.log(c.red('  Usage: node index.js portfolio <userId>'));
    return;
  }

  const spin = spinner(`Fetching portfolio for ${userId}`);
  let profileData, portfolioData;
  try {
    [profileData, portfolioData] = await Promise.all([
      api.getUserProfile(userId).catch(() => null),
      api.getPortfolio(userId),
    ]);
  } finally {
    spin.stop();
  }

  const profile   = profileData?.user || profileData;
  const positions = portfolioData?.positions || portfolioData?.holdings || portfolioData?.data || portfolioData || [];

  if (!Array.isArray(positions) || positions.length === 0) {
    console.log(c.yellow(`  No portfolio found for user: ${userId}`));
    return;
  }

  // Calculate totals
  const totalValue = positions.reduce((s, p) => s + parseFloat(p.value || 0), 0);
  const cashBalance = parseFloat(portfolioData?.cashBalance || profile?.cashBalance || 0);
  const netWorth = totalValue + cashBalance;

  console.log('');

  // Profile header
  if (profile) {
    console.log(`  ${c.bold(c.cyan(profile.username || userId))}`);
    if (profile.createdAt) {
      console.log(`  ${c.dim('Joined:')} ${new Date(profile.createdAt).toLocaleDateString()}`);
    }
    console.log('');
  }

  // Portfolio summary
  console.log(`  ${c.dim('Portfolio value:')} ${fmtPrice(totalValue)}`);
  console.log(`  ${c.dim('Cash (BUSS):')}     ${fmtPrice(cashBalance)}`);
  console.log(`  ${c.dim('Net worth:')}       ${c.bold(fmtPrice(netWorth))}`);
  console.log('');

  const cols = [
    { key: 'symbol',    label: 'Coin',    width: 10,
      format: (v) => c.bold(c.cyan(v)) },
    { key: 'name',      label: 'Name',    width: 16,
      format: (v) => c.white(String(v || '').slice(0, 16)) },
    { key: 'balance',   label: 'Balance', width: 18, align: 'right',
      format: (v) => c.white(Number(v).toLocaleString(undefined, { maximumFractionDigits: 4 })) },
    { key: 'price',     label: 'Price',   width: 14, align: 'right',
      format: (v) => fmtPrice(v) },
    { key: 'value',     label: 'Value',   width: 14, align: 'right',
      format: (v) => fmtPrice(v) },
    { key: 'change24h', label: '24h %',   width: 10, align: 'right',
      format: (v) => fmtChange(v) },
    { key: '_pct',      label: 'Allocation', width: 18,
      format: (v, r) => progressBar(r._pct || 0, 14, c.cyan) },
  ];

  const rows = positions
    .map(p => ({
      ...p,
      _pct: totalValue > 0 ? (parseFloat(p.value || 0) / totalValue) * 100 : 0,
    }))
    .sort((a, b) => parseFloat(b.value) - parseFloat(a.value));

  console.log(box(table(rows, cols), `${profile?.username || userId} — Portfolio (${positions.length} positions)`));
  console.log('');
}

module.exports = { portfolio };
