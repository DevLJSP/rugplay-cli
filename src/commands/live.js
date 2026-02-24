// src/commands/live.js — real-time WebSocket trade stream
// enhanced by Glaringly

'use strict';

const readline = require('readline');
const { c, fmtPrice, fmtTime, hr } = require('../display');

const WS_URL = 'wss://ws.rugplay.com/';

async function live(flags) {
  const minValue = parseFloat(flags.min) || 0;

  // Get WebSocket — built-in (Node 22+) or ws package
  let WS;
  try {
    WS = WebSocket;
  } catch {
    try {
      WS = require('ws');
    } catch {
      console.log(c.red('\n  ✗ WebSocket not available.'));
      console.log(c.dim('  Run: npm install ws\n'));
      return;
    }
  }

  // Ask for userId
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const userId = await new Promise(resolve => {
    rl.question(c.dim('  Enter your userId (or press Enter for anonymous): '), ans => {
      rl.close();
      resolve(ans.trim() || null);
    });
  });

  console.log('');
  console.log(hr());
  console.log(`  ${c.bgreen('◉')} ${c.bold('LIVE')} ${c.dim('trade stream')}  ${c.dim('Ctrl+C to exit')}`);
  if (minValue > 0) console.log(`  ${c.dim('Filter: min value $' + minValue.toLocaleString())}`);
  console.log(hr());
  console.log('');

  let tradeCount  = 0;
  let totalVolume = 0;

  const ws = new WS(WS_URL);

  ws.on('open', () => {
    const payload = { type: 'subscribe', channel: 'trades' };
    if (userId) payload.userId = userId;
    ws.send(JSON.stringify(payload));
  });

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    const trades = Array.isArray(msg) ? msg : msg.trades ? msg.trades : msg.type === 'trade' ? [msg] : null;
    if (!trades) return;

    trades.forEach(trade => {
      const val = parseFloat(trade.value || trade.amount || 0);
      if (val < minValue) return;

      tradeCount++;
      totalVolume += val;

      const isBuy  = trade.type?.toUpperCase() === 'BUY';
      const arrow  = isBuy ? c.bgreen('▲ BUY ') : c.bred('▼ SELL');
      const coin   = c.bold(c.cyan((trade.symbol || '????').padEnd(8)));
      const value  = fmtPrice(val).padStart(14);
      const user   = c.dim((trade.userId || 'anon').slice(0, 18).padEnd(18));
      const time   = fmtTime(trade.timestamp || Date.now());

      // Whale decoration
      const isWhale = val >= 10000;
      const prefix  = isWhale ? c.byellow('🐋 ') : '   ';

      console.log(`${prefix}${arrow}  ${coin}  ${value}  ${user}  ${time}`);

      // Running stats every 20 trades
      if (tradeCount % 20 === 0) {
        console.log('');
        console.log(c.dim(`  ── ${tradeCount} trades  vol: $${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} ──`));
        console.log('');
      }
    });
  });

  ws.on('error', (err) => {
    console.log(c.red(`\n  ✗ WebSocket error: ${err.message}`));
  });

  ws.on('close', () => {
    console.log('');
    console.log(c.dim(`  Connection closed. ${tradeCount} trades received.`));
  });

  // Graceful exit
  process.on('SIGINT', () => {
    console.log('');
    console.log(c.dim(`\n  Closing... ${tradeCount} trades, $${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} volume`));
    ws.close();
    process.exit(0);
  });

  // Keep alive
  await new Promise(() => {});
}

module.exports = { live };
