// src/commands/hopium.js — prediction markets
// enhanced by Glaringly

'use strict';

const api = require('../api');
const { c, box, table, hr, fmtPrice, fmtTime, progressBar, spinner } = require('../display');

async function hopium(flags) {
  const opts = {
    status: flags.status || 'ACTIVE',
    page:   parseInt(flags.page)  || 1,
    limit:  parseInt(flags.limit) || 20,
  };

  const spin = spinner('Fetching prediction markets');
  let data;
  try {
    data = await api.getHopium(opts);
  } finally {
    spin.stop();
  }

  const list  = data?.questions || data?.data || data || [];
  const total = data?.total || list.length;

  if (!list.length) {
    console.log(c.yellow('  No prediction markets found.'));
    return;
  }

  const cols = [
    { key: 'id',          label: 'ID',       width: 6,  align: 'right',
      format: (v) => c.dim(String(v)) },
    { key: 'question',    label: 'Question', width: 42,
      format: (v) => c.white(String(v || '').slice(0, 42)) },
    { key: 'status',      label: 'Status',   width: 10,
      format: (v) => {
        if (v === 'ACTIVE')   return c.bgreen('ACTIVE');
        if (v === 'RESOLVED') return c.dim('RESOLVED');
        return c.yellow(v);
      }
    },
    { key: 'yesPool',     label: 'YES $',    width: 12, align: 'right',
      format: (v) => fmtPrice(v) },
    { key: 'noPool',      label: 'NO  $',    width: 12, align: 'right',
      format: (v) => fmtPrice(v) },
    { key: '_yesPct',     label: 'YES %',    width: 14,
      format: (v, r) => {
        if (r.yesPool === undefined) return c.dim('—');
        return progressBar(r._yesPct || 0, 10, c.green);
      }
    },
  ];

  const rows = list.map(q => {
    const yes = parseFloat(q.yesPool || 0);
    const no  = parseFloat(q.noPool  || 0);
    const tot = yes + no;
    return { ...q, _yesPct: tot > 0 ? (yes / tot) * 100 : 50 };
  });

  const statusLabel = opts.status === 'ALL' ? 'All' : opts.status;
  console.log('');
  console.log(box(table(rows, cols), `Hopium — ${statusLabel} Markets (${total} total)`));
  console.log('');
  console.log(`  ${c.dim('View detail:')} ${c.cyan('node index.js hopium-q <id>')}`);
  console.log('');
}

async function hopiumQuestion(args) {
  const id = args[0];
  if (!id) {
    console.log(c.red('  Usage: node index.js hopium-q <id>'));
    return;
  }

  const spin = spinner(`Fetching question #${id}`);
  let data;
  try {
    data = await api.getHopiumQuestion(id);
  } finally {
    spin.stop();
  }

  const q = data?.question || data;
  if (!q) {
    console.log(c.red(`  ✗ Question #${id} not found.`));
    return;
  }

  const yes     = parseFloat(q.yesPool || 0);
  const no      = parseFloat(q.noPool  || 0);
  const total   = yes + no;
  const yesPct  = total > 0 ? (yes / total) * 100 : 50;
  const noPct   = 100 - yesPct;

  console.log('');
  console.log(c.bold(`  ${c.cyan(`#${q.id}`)} ${c.white(q.question)}`));
  console.log('');
  console.log(`  ${c.dim('Status:')}    ${q.status === 'ACTIVE' ? c.bgreen('ACTIVE') : c.dim(q.status)}`);
  console.log(`  ${c.dim('Created:')}   ${q.createdAt ? new Date(q.createdAt).toLocaleString() : '—'}`);
  if (q.resolvedAt) {
    console.log(`  ${c.dim('Resolved:')}  ${new Date(q.resolvedAt).toLocaleString()}`);
    console.log(`  ${c.dim('Outcome:')}   ${q.outcome === 'YES' ? c.bgreen('YES') : c.bred('NO')}`);
  }
  console.log('');
  console.log(`  ${c.bgreen('YES')}  ${progressBar(yesPct, 30, c.green)}  ${c.green(yesPct.toFixed(1) + '%')}  ${fmtPrice(yes)}`);
  console.log(`  ${c.bred('NO ')}  ${progressBar(noPct,  30, c.red)}   ${c.red(noPct.toFixed(1) + '%')}  ${fmtPrice(no)}`);
  console.log('');
  console.log(`  ${c.dim('Total pool:')} ${fmtPrice(total)}`);

  // Recent bets
  const bets = q.bets || q.recentBets || [];
  if (bets.length > 0) {
    console.log('');
    console.log(c.dim('  Recent bets:'));
    bets.slice(0, 10).forEach(bet => {
      const side  = bet.side === 'YES' ? c.bgreen('YES') : c.bred(' NO');
      const amt   = fmtPrice(bet.amount);
      const user  = c.dim((bet.userId || 'anon').slice(0, 18));
      const time  = fmtTime(bet.timestamp || bet.createdAt);
      console.log(`    ${side}  ${amt.padStart(12)}  ${user}  ${time}`);
    });
  }

  // Probability chart (text-based if history available)
  const history = q.history || q.probabilityHistory || [];
  if (history.length > 2) {
    const { sparkline } = require('../display');
    const probs = history.map(h => h.yesProbability * 100);
    const spark = sparkline(probs, 40);
    console.log('');
    console.log(`  ${c.dim('Probability history:')} ${spark}  ${c.dim('(YES %)')}`);
  }

  console.log('');
}

module.exports = { hopium, hopiumQuestion };
