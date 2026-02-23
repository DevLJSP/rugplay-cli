const R = '\x1b[0m';
const B = '\x1b[1m';
const DIM = '\x1b[2m';
const G = '\x1b[32m';
const RED = '\x1b[31m';
const Y = '\x1b[33m';
const CY = '\x1b[36m';
const MA = '\x1b[35m';
const WH = '\x1b[37m';

export const c = {
  bold:    (s) => `${B}${s}${R}`,
  dim:     (s) => `${DIM}${s}${R}`,
  green:   (s) => `${G}${s}${R}`,
  red:     (s) => `${RED}${s}${R}`,
  yellow:  (s) => `${Y}${s}${R}`,
  cyan:    (s) => `${CY}${s}${R}`,
  magenta: (s) => `${MA}${s}${R}`,
  white:   (s) => `${WH}${s}${R}`,
};

export function $$(n) {
  if (n == null || isNaN(n)) return 'N/A';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3)  return `${sign}$${(abs / 1e3).toFixed(2)}K`;
  if (abs < 0.001) return `${sign}$${abs.toFixed(8)}`;
  return `${sign}$${abs.toFixed(4)}`;
}

export function pct(n) {
  if (n == null || isNaN(n)) return 'N/A';
  const s = `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
  return n >= 0 ? c.green(s) : c.red(s);
}

export function num(n, d = 2) {
  if (n == null || isNaN(n)) return 'N/A';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(d)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(d)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(d)}K`;
  return n.toFixed(d);
}

export function trunc(s, len) {
  if (!s) return '';
  return s.length > len ? s.slice(0, len - 1) + '…' : s;
}

export function pad(str, len, right = false) {
  const s = String(str ?? '');
  const visual = s.replace(/\x1b\[[0-9;]*m/g, '').length;
  const diff = Math.max(0, len - visual);
  return right ? ' '.repeat(diff) + s : s + ' '.repeat(diff);
}

export function header(title) {
  const bar = '─'.repeat(62);
  console.log(`\n${c.cyan(bar)}`);
  console.log(`${c.bold(c.cyan('  ' + title))}`);
  console.log(`${c.cyan(bar)}`);
}

export function colHead(cols) {
  const cells = cols.map(([label, w, r]) => pad(c.bold(c.yellow(label)), w, r));
  console.log(cells.join('  '));
  const totalW = cols.reduce((a, [, w]) => a + w + 2, -2);
  console.log(c.dim('─'.repeat(totalW)));
}

export function err(msg) {
  console.error(c.red(`✗  ${msg}`));
}

export function info(msg) {
  console.log(c.dim(`   ${msg}`));
}

export function tip(msg) {
  console.log(`\n${c.yellow('?')}  ${c.dim(msg)}\n`);
}

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function probBar(yesPct, width = 20) {
  const fill = Math.round((Math.min(100, Math.max(0, yesPct)) / 100) * width);
  return `${G}${'█'.repeat(fill)}${RED}${'█'.repeat(width - fill)}${R}`;
}

export function miniChart(candles, height = 7, width = 40) {
  const slice = candles.slice(-width);
  const prices = slice.flatMap((c) => [c.high, c.low]);
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  const range = hi - lo || 1;
  const grid = Array.from({ length: height }, () => new Array(slice.length).fill(' '));

  slice.forEach((candle, x) => {
    const bull = candle.close >= candle.open;
    const col = bull ? G : RED;
    const toY = (v) => height - 1 - Math.round(((v - lo) / range) * (height - 1));

    const bodyTop = toY(Math.max(candle.open, candle.close));
    const bodyBot = toY(Math.min(candle.open, candle.close));
    const wickTop = toY(candle.high);
    const wickBot = toY(candle.low);

    for (let y = 0; y < height; y++) {
      if (y >= bodyTop && y <= bodyBot) grid[y][x] = `${col}█${R}`;
      else if (y >= wickTop && y <= wickBot) grid[y][x] = `${col}│${R}`;
    }
  });

  console.log(`  ${c.dim($$(hi))}`);
  grid.forEach((row) => console.log('  ' + row.join('')));
  console.log(`  ${c.dim($$(lo))}`);
}

export function parseFlags(args) {
  const flags = {};
  const pos = [];
  for (const a of args) {
    const m = a.match(/^--?([^=]+)(?:=(.*))?$/);
    if (m) flags[m[1]] = m[2] ?? true;
    else pos.push(a);
  }
  return { flags, pos };
}