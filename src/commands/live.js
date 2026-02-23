import { createInterface } from 'readline';
import { c, $$, num, trunc, pad, header, timeAgo, parseFlags, err } from '../display.js';

const WS_URL = 'wss://ws.rugplay.com/';

async function askUserId() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`  ${c.yellow('Your userId')} ${c.dim('(Enter for anonymous)')}${c.bold(': ')}`, (ans) => {
      rl.close();
      resolve(ans.trim() || 'nil');
    });
  });
}

function printTrade(t, minValue) {
  if (!t || !t.coinSymbol) return;
  if (minValue > 0 && (t.totalValue ?? 0) < minValue) return;

  const isBuy  = (t.type ?? '').toUpperCase() === 'BUY';
  const tipo   = isBuy ? c.green('BUY ') : c.red('SELL');
  const valor  = isBuy ? c.green($$(t.totalValue)) : c.red($$(t.totalValue));
  const when   = t.timestamp ? timeAgo(t.timestamp) : 'just now';

  console.log([
    pad(tipo,                                    6),
    pad(c.bold(trunc(t.username ?? '?', 18)),   18),
    pad(c.cyan(t.coinSymbol),                    8),
    pad(num(t.amount ?? 0),                     14, true),
    pad(valor,                                  13, true),
    pad($$(t.price ?? 0),                       13, true),
    pad(c.dim(when),                             8),
  ].join('  '));
}

function printHeader() {
  const bar = '─'.repeat(62);
  console.log(`\n${c.cyan(bar)}`);
  console.log(`${c.bold(c.cyan('  Live Trades'))}  ${c.dim('— Ctrl+C to exit')}`);
  console.log(`${c.cyan(bar)}`);
  console.log([
    pad(c.bold(c.yellow('Type')),    6),
    pad(c.bold(c.yellow('User')),   18),
    pad(c.bold(c.yellow('Coin')),    8),
    pad(c.bold(c.yellow('Amount')), 14, true),
    pad(c.bold(c.yellow('Value')),  13, true),
    pad(c.bold(c.yellow('Price')),  13, true),
    pad(c.bold(c.yellow('When')),    8),
  ].join('  '));
  console.log(c.dim('─'.repeat(84)));
}

function handleMessage(raw, minValue) {
  let msg;
  try { msg = JSON.parse(raw.toString()); } catch { return; }

  if (!msg || typeof msg !== 'object') return;

  const candidates = [];

  if (msg.type === 'trade' || msg.type === 'large_trade' || msg.type === 'new_trade') {
    candidates.push(msg.data ?? msg);
  } else if (msg.type === 'trades' && Array.isArray(msg.data)) {
    candidates.push(...msg.data);
  } else if (msg.coinSymbol && msg.type) {
    candidates.push(msg);
  } else if (Array.isArray(msg)) {
    candidates.push(...msg);
  } else if (msg.data && msg.data.coinSymbol) {
    candidates.push(msg.data);
  }

  for (const t of candidates) {
    printTrade(t, minValue);
  }
}

function bindEvents(ws, isNative, userId, minValue) {
  const onOpen = () => {
    const send = (obj) => ws.send(JSON.stringify(obj));
    send({ type: 'set_user',  userId });
    send({ type: 'set_coin',  coinSymbol: '@global' });
    send({ type: 'subscribe', channel: 'trades:large' });
    send({ type: 'subscribe', channel: 'trades:all' });
    console.log(c.dim(`  connected  •  userId: ${userId}${minValue > 0 ? `  •  min $${minValue}` : ''}\n`));
  };

  const onMessage = (e) => handleMessage(isNative ? e.data : e, minValue);

  const onError = (e) => err(`WebSocket error: ${e.message ?? e}`);

  const onClose = () => {
    console.log(c.dim('\n  connection closed\n'));
    process.exit(0);
  };

  if (isNative) {
    ws.addEventListener('open',    onOpen);
    ws.addEventListener('message', onMessage);
    ws.addEventListener('error',   onError);
    ws.addEventListener('close',   onClose);
  } else {
    ws.on('open',    onOpen);
    ws.on('message', onMessage);
    ws.on('error',   onError);
    ws.on('close',   onClose);
  }
}

export async function cmdLive(args) {
  const { flags } = parseFlags(args);
  const minValue = parseFloat(flags.min ?? flags.minValue ?? '0');

  console.log();
  const userId = await askUserId();

  let WS;
  let isNative = false;

  try {
    const mod = await import('ws');
    WS = mod.default ?? mod.WebSocket;
  } catch {
    if (typeof globalThis.WebSocket !== 'undefined') {
      WS = globalThis.WebSocket;
      isNative = true;
    } else {
      err('Package "ws" not found. Run: npm install ws');
      return;
    }
  }

  printHeader();

  const ws = new WS(WS_URL, {
    headers: {
      'Origin':                'https://rugplay.com',
      'User-Agent':            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'Cache-Control':         'no-cache',
      'Pragma':                'no-cache',
      'Accept-Language':       'en-US,en;q=0.9',
      'Sec-WebSocket-Version': '13',
    },
  });

  bindEvents(ws, isNative, userId, minValue);

  process.on('SIGINT', () => {
    ws.close();
    process.exit(0);
  });

  await new Promise(() => {});
}