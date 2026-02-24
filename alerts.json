// src/commands/alert.js — price alerts [NEW]
// by Glaringly

'use strict';

const fs   = require('fs');
const path = require('path');
const api  = require('../api');
const { c, box, fmtPrice, fmtChange } = require('../display');

const ALERT_FILE = path.join(__dirname, '..', '..', 'alerts.json');

function loadAlerts() {
  try { return JSON.parse(fs.readFileSync(ALERT_FILE, 'utf8')); }
  catch { return []; }
}
function saveAlerts(a) {
  fs.writeFileSync(ALERT_FILE, JSON.stringify(a, null, 2));
}

async function alert(args, flags) {
  const action = args[0];

  switch (action) {
    case 'add': {
      // node index.js alert add BTC --above=100000
      // node index.js alert add BTC --below=50000
      const symbol = (args[1] || '').toUpperCase();
      if (!symbol) {
        console.log(c.red('  Usage: node index.js alert add <SYMBOL> [--above=] [--below=]'));
        return;
      }
      const alerts = loadAlerts();
      if (flags.above) {
        alerts.push({ symbol, type: 'above', threshold: parseFloat(flags.above), triggered: false });
        console.log(`\n  ${c.bgreen('✓')} Alert: ${c.cyan(symbol)} ${c.white('>')} ${fmtPrice(flags.above)}\n`);
      }
      if (flags.below) {
        alerts.push({ symbol, type: 'below', threshold: parseFloat(flags.below), triggered: false });
        console.log(`\n  ${c.bgreen('✓')} Alert: ${c.cyan(symbol)} ${c.white('<')} ${fmtPrice(flags.below)}\n`);
      }
      if (!flags.above && !flags.below) {
        console.log(c.red('  Specify --above= or --below='));
        return;
      }
      saveAlerts(alerts);
      break;
    }

    case 'list': {
      const alerts = loadAlerts();
      if (!alerts.length) {
        console.log(c.dim('\n  No alerts set.\n'));
        return;
      }
      console.log('');
      alerts.forEach((a, i) => {
        const status = a.triggered ? c.dim('[triggered]') : c.bgreen('[active]');
        const dir    = a.type === 'above' ? c.green('▲ above') : c.red('▼ below');
        console.log(`  ${c.dim(String(i + 1).padStart(2))}  ${c.cyan(a.symbol.padEnd(8))}  ${dir}  ${fmtPrice(a.threshold)}  ${status}`);
      });
      console.log('');
      break;
    }

    case 'clear': {
      saveAlerts([]);
      console.log(c.bgreen('\n  ✓ All alerts cleared.\n'));
      break;
    }

    case 'check': {
      const alerts  = loadAlerts().filter(a => !a.triggered);
      if (!alerts.length) {
        console.log(c.dim('\n  No active alerts.\n'));
        return;
      }

      const symbols = [...new Set(alerts.map(a => a.symbol))];
      console.log(`\n  ${c.dim('Checking')} ${symbols.length} ${c.dim('symbols...')}\n`);

      const results = await Promise.allSettled(symbols.map(s => api.getCoin(s)));
      const prices  = {};
      symbols.forEach((s, i) => {
        const r = results[i];
        if (r.status === 'fulfilled') {
          const d = r.value?.coin || r.value;
          prices[s] = parseFloat(d?.currentPrice || 0);
        }
      });

      let fired = 0;
      const allAlerts = loadAlerts();
      allAlerts.forEach((a) => {
        if (a.triggered) return;
        const price = prices[a.symbol];
        if (price === undefined) return;
        const hit = a.type === 'above' ? price > a.threshold : price < a.threshold;
        if (hit) {
          a.triggered = true;
          fired++;
          const dir = a.type === 'above' ? c.bgreen('▲ ABOVE') : c.bred('▼ BELOW');
          console.log(`  🔔 ${c.bold(c.cyan(a.symbol))} ${dir} ${fmtPrice(a.threshold)}  →  current: ${fmtPrice(price)}`);
        }
      });

      saveAlerts(allAlerts);

      if (fired === 0) {
        console.log(c.dim('  No alerts triggered.'));
      } else {
        console.log(`\n  ${c.bgreen(`${fired} alert${fired > 1 ? 's' : ''} triggered!`)}`);
      }
      console.log('');
      break;
    }

    default:
      console.log(c.red(`  ✗ Unknown alert action: "${action}"`));
      console.log(`  ${c.dim('Usage:')} alert <add|list|check|clear>`);
  }
}

module.exports = { alert };
