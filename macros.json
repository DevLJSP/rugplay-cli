// src/commands/macro.js — saved command shortcuts
// enhanced by Glaringly

'use strict';

const fs   = require('fs');
const path = require('path');
const { c, box } = require('../display');

const MACRO_FILE = path.join(__dirname, '..', '..', 'macros.json');

function loadMacros() {
  try {
    return JSON.parse(fs.readFileSync(MACRO_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveMacros(macros) {
  fs.writeFileSync(MACRO_FILE, JSON.stringify(macros, null, 2));
}

async function macro(args, flags) {
  const action = args[0];
  const macros = loadMacros();

  switch (action) {
    case 'list': {
      const entries = Object.entries(macros);
      if (!entries.length) {
        console.log(c.dim('\n  No macros saved yet.\n'));
        return;
      }
      const lines = entries.map(([name, cmd]) =>
        `  ${c.cyan(name.padEnd(20))} ${c.dim('→')} ${c.white(cmd)}`
      ).join('\n');
      console.log('');
      console.log(box(lines, `Saved Macros (${entries.length})`));
      console.log('');
      break;
    }

    case 'add': {
      const name    = args[1];
      const cmdParts = args.slice(2).concat(
        Object.entries(flags).map(([k, v]) => v === true ? `--${k}` : `--${k}=${v}`)
      );
      if (!name || !cmdParts.length) {
        console.log(c.red('  Usage: macro add <name> <command> [flags...]'));
        return;
      }
      const cmdStr  = cmdParts.join(' ');
      macros[name]  = cmdStr;
      saveMacros(macros);
      console.log(`\n  ${c.bgreen('✓')} Macro ${c.cyan(name)} saved → ${c.white(cmdStr)}\n`);
      break;
    }

    case 'run': {
      const name = args[1];
      if (!name) {
        console.log(c.red('  Usage: macro run <name>'));
        return;
      }
      if (!macros[name]) {
        console.log(c.red(`  ✗ Macro "${name}" not found. Run 'macro list' to see saved macros.`));
        return;
      }
      const cmdStr = macros[name];
      console.log(`\n  ${c.dim('▶ Running macro:')} ${c.cyan(name)} ${c.dim('→')} ${c.white(cmdStr)}\n`);

      // Re-invoke CLI with macro args
      const argv = cmdStr.split(/\s+/);
      process.argv = ['node', 'index.js', ...argv];

      // Re-parse and run
      const rawArgs = argv;
      const cmd     = rawArgs[0];
      const mArgs   = rawArgs.slice(1).filter(a => !a.startsWith('--'));
      const mFlags  = {};
      rawArgs.slice(1).filter(a => a.startsWith('--')).forEach(f => {
        const [k, v] = f.slice(2).split('=');
        mFlags[k] = v !== undefined ? v : true;
      });

      const handlers = {
        top:         () => require('./market').top(),
        market:      () => require('./market').market(mArgs, mFlags),
        coin:        () => require('./coin').coin(mArgs, mFlags),
        holders:     () => require('./coin').holders(mArgs, mFlags),
        trades:      () => require('./trades').trades(mFlags),
        leaderboard: () => require('./leaderboard').leaderboard(mArgs),
        hopium:      () => require('./hopium').hopium(mFlags),
        'hopium-q':  () => require('./hopium').hopiumQuestion(mArgs),
      };

      const handler = handlers[cmd];
      if (handler) {
        await handler();
      } else {
        console.log(c.red(`  ✗ Unknown command in macro: "${cmd}"`));
      }
      break;
    }

    case 'remove': {
      const name = args[1];
      if (!name) {
        console.log(c.red('  Usage: macro remove <name>'));
        return;
      }
      if (!macros[name]) {
        console.log(c.red(`  ✗ Macro "${name}" not found.`));
        return;
      }
      delete macros[name];
      saveMacros(macros);
      console.log(`\n  ${c.bgreen('✓')} Macro ${c.cyan(name)} removed.\n`);
      break;
    }

    default: {
      console.log(c.red(`  ✗ Unknown macro action: "${action}"`));
      console.log(`  ${c.dim('Usage:')} macro <list|add|run|remove>`);
    }
  }
}

module.exports = { macro };
