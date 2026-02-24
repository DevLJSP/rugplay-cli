// src/commands/leaderboard.js — leaderboard categories
// enhanced by Glaringly

'use strict';

const api = require('../api');
const { c, box, table, fmtPrice, spinner } = require('../display');

const TYPES = ['rugpullers', 'losers', 'cash', 'rich'];

async function leaderboard(args) {
  const type = (args[0] || 'rich').toLowerCase();

  if (!TYPES.includes(type)) {
    console.log(c.red(`  ✗ Unknown leaderboard type: "${type}"`));
    console.log(`  ${c.dim('Valid types:')} ${TYPES.map(t => c.cyan(t)).join('  ')}`);
    return;
  }

  const spin = spinner(`Fetching ${type} leaderboard`);
  let data;
  try {
    data = await api.getLeaderboard(type);
  } finally {
    spin.stop();
  }

  const list = data?.users || data?.data || data || [];
  if (!list.length) {
    console.log(c.yellow('  No data returned.'));
    return;
  }

  const medals = ['🥇','🥈','🥉'];

  const valueKey = {
    rugpullers: { key: 'profit24h',    label: '24h Profit' },
    losers:     { key: 'loss24h',      label: '24h Loss' },
    cash:       { key: 'cashBalance',  label: 'BUSS Balance' },
    rich:       { key: 'totalValue',   label: 'Portfolio Value' },
  }[type];

  const titles = {
    rugpullers: '💰 Biggest Rugpullers (24h)',
    losers:     '💸 Biggest Losers (24h)',
    cash:       '💵 Most Cash (BUSS)',
    rich:       '👑 Richest Portfolios',
  };

  const cols = [
    { key: '_rank',  label: '#',      width: 5,  align: 'right',
      format: (v, r) => {
        const m = medals[r._rank - 1];
        return m ? m + ' ' : c.dim(String(r._rank).padStart(3) + ' ');
      }
    },
    { key: 'userId',   label: 'User',   width: 25,
      format: (v) => c.cyan(String(v || '—').slice(0, 25)) },
    { key: 'username', label: 'Username', width: 18,
      format: (v) => v ? c.white(String(v).slice(0, 18)) : c.dim('—') },
    { key: valueKey.key, label: valueKey.label, width: 16, align: 'right',
      format: (v) => {
        if (!v) return c.dim('—');
        const n = parseFloat(v);
        if (type === 'losers') return c.red(fmtPrice(Math.abs(n)));
        return fmtPrice(n);
      }
    },
  ];

  const rows = list.slice(0, 50).map((u, i) => ({ ...u, _rank: i + 1 }));

  console.log('');
  console.log(box(table(rows, cols), titles[type]));
  console.log('');
}

module.exports = { leaderboard };
