// src/commands/trades.js — recent trades snapshot
// enhanced by Glaringly

'use strict';

const api = require('../api');
const {
  c, box, table, fmtPrice, fmtTime, fmtChange, spinner,
} = require('../display');

async function trades(flags) {
  const limit    = parseInt(flags.limit) || 30;
  const minValue = parseFloat(flags.min) || 0;

  const spin = spinner('Fetching recent trades');
  let data;
  try {
    data = await api.getTrades(Math.min(limit, 1000), minValue);
  } finally {
    spin.stop();
  }

  const list = data?.trades || data?.data || data || [];
  if (!list.length) {
    console.log(c.yellow('  No trades found.'));
    return;
  }

  const cols = [
    { key: 'type',      label: 'Type',    width: 6,
      format: (v) => v?.toUpperCase() === 'BUY'
        ? c.bgreen(' BUY ')
        : c.bred(' SELL') },
    { key: 'symbol',    label: 'Coin',    width: 10,
      format: (v) => c.bold(c.cyan(v)) },
    { key: 'value',     label: 'Value',   width: 14, align: 'right',
      format: (v) => fmtPrice(v) },
    { key: 'amount',    label: 'Amount',  width: 16, align: 'right',
      format: (v) => c.white(Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })) },
    { key: 'price',     label: 'Price',   width: 14, align: 'right',
      format: (v) => fmtPrice(v) },
    { key: 'userId',    label: 'User',    width: 20,
      format: (v) => c.dim(String(v || '—').slice(0, 20)) },
    { key: 'timestamp', label: 'Time',    width: 10,
      format: (v) => fmtTime(v) },
  ];

  // Value categories
  const whales = list.filter(t => parseFloat(t.value) >= 10000);
  const big    = list.filter(t => parseFloat(t.value) >= 1000 && parseFloat(t.value) < 10000);

  let title = `Last ${Math.min(limit, list.length)} Trades`;
  if (minValue > 0) title += ` (min $${minValue.toLocaleString()})`;

  console.log('');
  console.log(box(table(list.slice(0, limit), cols), title));

  // Stats
  const buys  = list.filter(t => t.type?.toUpperCase() === 'BUY').length;
  const sells = list.length - buys;
  const vol   = list.reduce((s, t) => s + parseFloat(t.value || 0), 0);

  console.log('');
  console.log(
    `  ${c.dim('Volume:')} ${fmtPrice(vol)}   ` +
    `${c.bgreen(`▲ ${buys} buys`)}  ${c.bred(`▼ ${sells} sells`)}`
  );
  if (whales.length > 0) {
    console.log(`  ${c.byellow('🐋')} ${c.yellow(`${whales.length} whale trade${whales.length > 1 ? 's' : ''}`)} ${c.dim('≥ $10K')}`);
  }
  console.log('');
}

module.exports = { trades };
