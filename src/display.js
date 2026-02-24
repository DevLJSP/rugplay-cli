// src/display.js — colors, formatting, ASCII charts
// enhanced by Glaringly

'use strict';

// ─── ANSI color helpers ──────────────────────────────────────────────────────

const ESC = '\x1b';
const ansi = (code) => (str) => `${ESC}[${code}m${str}${ESC}[0m`;

const c = {
  reset:   ansi(0),
  bold:    ansi(1),
  dim:     ansi(2),
  italic:  ansi(3),
  under:   ansi(4),

  black:   ansi(30),
  red:     ansi(31),
  green:   ansi(32),
  yellow:  ansi(33),
  blue:    ansi(34),
  magenta: ansi(35),
  cyan:    ansi(36),
  white:   ansi(37),

  bgRed:     ansi(41),
  bgGreen:   ansi(42),
  bgYellow:  ansi(43),
  bgBlue:    ansi(44),
  bgMagenta: ansi(45),
  bgCyan:    ansi(46),

  gray:    ansi(90),
  bred:    ansi(91),
  bgreen:  ansi(92),
  byellow: ansi(93),
  bblue:   ansi(94),
  bmagenta:ansi(95),
  bcyan:   ansi(96),
  bwhite:  ansi(97),
};

// ─── Terminal width ──────────────────────────────────────────────────────────

function termWidth() {
  return process.stdout.columns || 80;
}

// ─── Box drawing ─────────────────────────────────────────────────────────────

function box(content, title = '', color = c.cyan) {
  const w      = Math.min(termWidth() - 2, 90);
  const inner  = w - 2;
  const lines  = content.split('\n');
  const top    = title
    ? color(`┌─ ${title} ${'─'.repeat(Math.max(0, inner - title.length - 3))}┐`)
    : color(`┌${'─'.repeat(inner)}┐`);
  const bot    = color(`└${'─'.repeat(inner)}┘`);
  const mid    = lines.map(l => {
    const stripped = stripAnsi(l);
    const pad      = Math.max(0, inner - 2 - stripped.length);
    return color('│') + ' ' + l + ' '.repeat(pad) + ' ' + color('│');
  }).join('\n');
  return `${top}\n${mid}\n${bot}`;
}

function hr(char = '─', color = c.dim) {
  return color(char.repeat(Math.min(termWidth() - 2, 90)));
}

// ─── Banner ──────────────────────────────────────────────────────────────────

function printBanner() {
  const w = Math.min(termWidth(), 92);
  const art = [
    c.bold(c.cyan('  ██████╗ ██╗   ██╗ ██████╗ ██████╗ ██╗      █████╗ ██╗   ██╗')),
    c.bold(c.cyan('  ██╔══██╗██║   ██║██╔════╝ ██╔══██╗██║     ██╔══██╗╚██╗ ██╔╝')),
    c.bold(c.cyan('  ██████╔╝██║   ██║██║  ███╗██████╔╝██║     ███████║ ╚████╔╝ ')),
    c.bold(c.cyan('  ██╔══██╗██║   ██║██║   ██║██╔═══╝ ██║     ██╔══██║  ╚██╔╝  ')),
    c.bold(c.cyan('  ██║  ██║╚██████╔╝╚██████╔╝██║     ███████╗██║  ██║   ██║   ')),
    c.bold(c.cyan('  ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝  ')),
    c.dim(c.cyan('  CLI  ') + c.dim('─') + c.dim(' terminal client for rugplay.com') + c.dim(' ─') + c.dim(' enhanced by Glaringly')),
  ];
  console.log('');
  art.forEach(l => console.log(l));
  console.log('');
}

// ─── Table ───────────────────────────────────────────────────────────────────

function table(rows, cols) {
  // cols: [{ key, label, width, align, format }]
  const w      = Math.min(termWidth() - 2, 110);
  const sep    = c.dim('│');
  const line   = c.dim('─');

  // Header
  let header = sep + ' ';
  let divider = c.dim('├');
  cols.forEach((col, i) => {
    const lbl   = col.label.padEnd(col.width);
    header     += c.bold(c.white(lbl)) + ' ' + sep + ' ';
    divider    += line.repeat(col.width + 2) + (i < cols.length - 1 ? c.dim('┼') : c.dim('┤'));
  });

  const topBar = c.dim('┌') + cols.map(col => line.repeat(col.width + 2)).join(c.dim('┬')) + c.dim('┐');
  const botBar = c.dim('└') + cols.map(col => line.repeat(col.width + 2)).join(c.dim('┴')) + c.dim('┘');

  const tableRows = rows.map(row => {
    let out = sep + ' ';
    cols.forEach(col => {
      const raw   = col.format ? col.format(row[col.key], row) : (row[col.key] ?? '');
      const str   = String(raw);
      const len   = stripAnsi(str).length;
      const pad   = Math.max(0, col.width - len);
      const cell  = col.align === 'right' ? ' '.repeat(pad) + str : str + ' '.repeat(pad);
      out        += cell + ' ' + sep + ' ';
    });
    return out;
  });

  return [topBar, header, divider, ...tableRows, botBar].join('\n');
}

// ─── Price formatting ─────────────────────────────────────────────────────────

function fmtPrice(n) {
  if (n === null || n === undefined) return c.dim('N/A');
  const num = parseFloat(n);
  if (num >= 1e9)  return c.yellow(`$${(num / 1e9).toFixed(2)}B`);
  if (num >= 1e6)  return c.yellow(`$${(num / 1e6).toFixed(2)}M`);
  if (num >= 1000) return c.yellow(`$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  if (num >= 1)    return c.yellow(`$${num.toFixed(4)}`);
  if (num >= 0.01) return c.yellow(`$${num.toFixed(6)}`);
  return c.yellow(`$${num.toExponential(4)}`);
}

function fmtChange(pct) {
  if (pct === null || pct === undefined) return c.dim('N/A');
  const n = parseFloat(pct);
  const s = (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
  if (n >  10) return c.bgreen(s);
  if (n >   0) return c.green(s);
  if (n < -10) return c.bred(s);
  if (n <   0) return c.red(s);
  return c.dim(s);
}

function fmtMcap(n) {
  if (!n) return c.dim('—');
  const num = parseFloat(n);
  if (num >= 1e9) return c.magenta(`$${(num / 1e9).toFixed(2)}B`);
  if (num >= 1e6) return c.magenta(`$${(num / 1e6).toFixed(2)}M`);
  if (num >= 1e3) return c.magenta(`$${(num / 1e3).toFixed(1)}K`);
  return c.magenta(`$${num.toFixed(0)}`);
}

function fmtVol(n) {
  if (!n) return c.dim('—');
  const num = parseFloat(n);
  if (num >= 1e6) return c.blue(`$${(num / 1e6).toFixed(2)}M`);
  if (num >= 1e3) return c.blue(`$${(num / 1e3).toFixed(1)}K`);
  return c.blue(`$${num.toFixed(0)}`);
}

function fmtTime(ts) {
  const d = new Date(ts);
  return c.dim(d.toLocaleTimeString('en-US', { hour12: false }));
}

function fmtDate(ts) {
  const d = new Date(ts);
  return c.dim(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
}

// ─── Sparkline ───────────────────────────────────────────────────────────────

const SPARK = ['▁','▂','▃','▄','▅','▆','▇','█'];

function sparkline(values, width = 20) {
  if (!values || values.length === 0) return c.dim('─'.repeat(width));
  const slice = values.slice(-width);
  const min   = Math.min(...slice);
  const max   = Math.max(...slice);
  const range = max - min || 1;
  const chars = slice.map(v => SPARK[Math.round(((v - min) / range) * 7)]);
  const color = slice[slice.length - 1] >= slice[0] ? c.green : c.red;
  return color(chars.join(''));
}

// ─── ASCII Candlestick chart ──────────────────────────────────────────────────

function candlestickChart(candles, width, height = 16) {
  // candles: [{ open, high, low, close, time }]
  if (!candles || candles.length === 0) return c.dim('  No data available');

  const W  = Math.min(width || termWidth() - 10, 80);
  const H  = height;
  const N  = Math.min(candles.length, Math.floor(W / 2));
  const cs = candles.slice(-N);

  const allH = cs.map(c => c.high);
  const allL = cs.map(c => c.low);
  const maxP = Math.max(...allH);
  const minP = Math.min(...allL);
  const range = maxP - minP || 1;

  const toRow = (price) => H - 1 - Math.round(((price - minP) / range) * (H - 1));

  // Build grid
  const grid = Array.from({ length: H }, () => Array(W).fill(' '));

  cs.forEach((candle, i) => {
    const x    = i * 2;
    const bull = candle.close >= candle.open;
    const col  = bull ? c.green : c.red;

    const rHigh  = toRow(candle.high);
    const rLow   = toRow(candle.low);
    const rOpen  = toRow(candle.open);
    const rClose = toRow(candle.close);

    const bodyTop = Math.min(rOpen, rClose);
    const bodyBot = Math.max(rOpen, rClose);

    // Wick
    for (let r = rHigh; r <= rLow; r++) {
      if (r >= 0 && r < H) {
        grid[r][x] = col('│');
      }
    }
    // Body
    for (let r = bodyTop; r <= bodyBot; r++) {
      if (r >= 0 && r < H) {
        grid[r][x] = bull ? c.bgGreen(' ') : c.bgRed(' ');
      }
    }
    if (bodyTop === bodyBot) {
      grid[bodyTop][x] = bull ? c.bgreen('─') : c.bred('─');
    }
  });

  // Y-axis labels
  const labelWidth = 12;
  const rows = grid.map((row, i) => {
    const priceFrac = 1 - i / (H - 1);
    const priceVal  = minP + priceFrac * range;
    const label     = fmtPrice(priceVal).padStart(labelWidth);
    return label + ' ' + c.dim('│') + ' ' + row.join('');
  });

  // X-axis
  const xAxis = ' '.repeat(labelWidth + 3) + c.dim('└' + '─'.repeat(N * 2));

  // Time labels
  const step    = Math.ceil(N / 5);
  let timeLine  = ' '.repeat(labelWidth + 4);
  cs.forEach((candle, i) => {
    if (i % step === 0) {
      const label = fmtDate(candle.time * 1000);
      timeLine   += c.dim(stripAnsi(label).slice(0, step * 2 - 1).padEnd(step * 2));
    }
  });

  return rows.join('\n') + '\n' + xAxis + '\n' + timeLine;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function progressBar(pct, width = 20, color = c.cyan) {
  const filled = Math.round((pct / 100) * width);
  const empty  = width - filled;
  return color('█'.repeat(filled)) + c.dim('░'.repeat(empty)) + c.dim(` ${pct.toFixed(1)}%`);
}

// ─── Strip ANSI ──────────────────────────────────────────────────────────────

function stripAnsi(str) {
  return String(str).replace(/\x1b\[[0-9;]*m/g, '');
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

function spinner(label = 'Loading') {
  const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
  let i = 0;
  const iv = setInterval(() => {
    process.stdout.write(`\r  ${c.cyan(frames[i++ % frames.length])} ${c.dim(label)}...`);
  }, 80);
  return {
    stop: (msg = '') => {
      clearInterval(iv);
      process.stdout.write(`\r${' '.repeat(label.length + 10)}\r`);
      if (msg) console.log(msg);
    }
  };
}

module.exports = {
  c, box, hr, table, printBanner,
  fmtPrice, fmtChange, fmtMcap, fmtVol, fmtTime, fmtDate,
  sparkline, candlestickChart, progressBar, stripAnsi, spinner,
  termWidth,
};
