import { api } from '../api.js';
import { c, $$, num, trunc, pad, header, colHead, probBar, timeAgo, tip, parseFlags, err } from '../display.js';

export async function cmdHopium(args) {
  const { flags } = parseFlags(args);

  const params = {
    status: (flags.status ?? 'ACTIVE').toUpperCase(),
    page:   flags.page  ?? 1,
    limit:  flags.limit ?? 20,
  };

  const data = await api.hopium(params);

  header(`Prediction Markets  •  ${params.status}  •  page ${data.page}/${data.totalPages}  (${data.total})`);
  colHead([
    ['ID',         6],
    ['Question',  40],
    ['YES',       22],
    ['Pool',      12, true],
    ['Expires',   10],
  ]);

  for (const q of data.questions) {
    const bar = probBar(q.yesPercentage, 10);
    const yesTxt = `${q.yesPercentage.toFixed(0)}%`;
    const expires = timeAgo(q.resolutionDate);

    console.log([
      pad(c.dim(q.id),         6),
      pad(trunc(q.question,   40), 40),
      `${bar} ${c.green(pad(yesTxt, 4, true))}`,
      pad($$(q.totalAmount),  12, true),
      pad(c.dim(expires),     10),
    ].join('  '));
  }

  tip('hopium-q <ID>   — see details + probability chart\n   --status=ACTIVE|RESOLVED|ALL  --page=N  --limit=N');
}

export async function cmdHopiumQ(args) {
  const { pos } = parseFlags(args);
  const id = pos[0];
  if (!id || isNaN(Number(id))) { err('Usage: hopium-q <ID>'); return; }

  const data = await api.hopiumQ(id);
  const q = data.question;

  header(`Prediction #${q.id}`);
  console.log(`\n  ${c.bold(q.question)}\n`);

  const total = q.totalAmount;
  const barW = 36;
  console.log(`  ${probBar(q.yesPercentage, barW)}`);
  console.log(
    `  ${c.green('YES ' + q.yesPercentage.toFixed(1) + '%')}` +
    `  ${c.dim('·')}  ` +
    `${c.red('NO ' + q.noPercentage.toFixed(1) + '%')}\n`
  );

  const row = (label, value) =>
    console.log(`  ${pad(c.yellow(label), 16)} ${value}`);

  row('Status',        q.status === 'ACTIVE' ? c.green('ACTIVE') : c.dim(q.status));
  row('Total Pool',    $$(total));
  row('YES Pool',      $$(q.yesAmount));
  row('NO Pool',       $$(q.noAmount));
  row('Resolution',    new Date(q.resolutionDate).toLocaleString());
  row('Creator',       `${q.creator.name} ${c.dim('@' + q.creator.username)}`);
  row('Needs Search',  q.requiresWebSearch ? c.yellow('Yes') : 'No');
  if (q.resolvedAt) row('Resolved At', new Date(q.resolvedAt).toLocaleString());
  if (q.aiResolution) row('AI Result',  c.bold(q.aiResolution));

  if (q.recentBets?.length > 0) {
    console.log(`\n  ${c.bold(c.cyan('Recent Bets'))}\n`);
    colHead([
      ['Side',    6],
      ['Amount', 12, true],
      ['User',   20],
      ['When',   10],
    ]);
    for (const b of q.recentBets) {
      console.log([
        pad(b.side ? c.green('YES') : c.red('NO'), 6),
        pad($$(b.amount),                         12, true),
        pad(b.user?.username ?? '?',              20),
        pad(c.dim(timeAgo(b.createdAt)),          10),
      ].join('  '));
    }
  }

  if (data.probabilityHistory?.length > 1) {
    console.log(`\n  ${c.bold(c.cyan('Probability Over Time'))}\n`);
    renderProbChart(data.probabilityHistory, 6, 50);
  }

  console.log();
}

function renderProbChart(history, height, width) {
  const slice = history.slice(-width);
  const grid = Array.from({ length: height }, () => new Array(slice.length).fill(' '));

  slice.forEach((p, x) => {
    const y = height - 1 - Math.round(((Math.min(100, Math.max(0, p.value)) / 100)) * (height - 1));
    const col = p.value >= 50 ? '\x1b[32m' : '\x1b[31m';
    for (let i = y; i < height; i++) grid[i][x] = `${col}▄\x1b[0m`;
  });

  console.log(`  ${c.dim('100%')}`);
  grid.forEach((row) => console.log('  ' + row.join('')));
  console.log(`  ${c.dim('  0%')}`);
}