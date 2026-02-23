import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { c, pad, header, colHead, err } from '../display.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MACROS_PATH = resolve(__dirname, '../../macros.json');

function load() {
  if (!existsSync(MACROS_PATH)) return {};
  try { return JSON.parse(readFileSync(MACROS_PATH, 'utf8')); }
  catch { return {}; }
}

function save(macros) {
  writeFileSync(MACROS_PATH, JSON.stringify(macros, null, 2));
}

function listMacros() {
  const macros = load();
  const entries = Object.entries(macros);

  header('Macros');

  if (entries.length === 0) {
    console.log(c.dim('  no macros saved yet.\n'));
    console.log(c.dim('  macro add <name> <command> [flags...]'));
    console.log(c.dim('  e.g.  macro add whales trades --min=5000\n'));
    return;
  }

  colHead([
    ['Name',    16],
    ['Command',  8],
    ['Args',    40],
  ]);

  for (const [name, { command, args }] of entries) {
    console.log([
      pad(c.bold(c.green(name)),   16),
      pad(c.cyan(command),          8),
      pad(c.dim(args.join(' ')),   40),
    ].join('  '));
  }
  console.log();
}

function addMacro(args) {
  const name = args[0];
  const command = args[1];
  const flags = args.slice(2);

  if (!name || !command) {
    err('Usage: macro add <name> <command> [flags...]');
    err('e.g.   macro add whales trades --min=5000');
    return;
  }

  const macros = load();

  if (macros[name]) {
    console.log(c.yellow(`  overwriting existing macro "${name}"`));
  }

  macros[name] = { command, args: flags };
  save(macros);
  console.log(`\n  ${c.green('✓')}  macro ${c.bold(name)} saved  →  ${c.cyan(command)} ${c.dim(flags.join(' '))}\n`);
}

function removeMacro(name) {
  if (!name) { err('Usage: macro remove <name>'); return; }

  const macros = load();
  if (!macros[name]) { err(`macro "${name}" not found`); return; }

  delete macros[name];
  save(macros);
  console.log(`\n  ${c.green('✓')}  macro ${c.bold(name)} removed\n`);
}

export async function runMacro(name) {
  if (!name) { err('Usage: macro run <name>'); return; }

  const macros = load();
  const macro = macros[name];

  if (!macro) {
    err(`macro "${name}" not found`);
    listMacros();
    return;
  }

  console.log(c.dim(`  running macro: ${c.bold(name)}  →  ${macro.command} ${macro.args.join(' ')}\n`));

  const { COMMANDS } = await import('../../index.js');
  const entry = COMMANDS[macro.command.toLowerCase()];

  if (!entry) {
    err(`unknown command in macro: "${macro.command}"`);
    return;
  }

  await entry.fn(macro.args);
}

export async function cmdMacro(args) {
  const sub = args[0];

  const subs = {
    list:   () => listMacros(),
    add:    () => addMacro(args.slice(1)),
    remove: () => removeMacro(args[1]),
    rm:     () => removeMacro(args[1]),
    run:    () => runMacro(args[1]),
  };

  if (!sub || !subs[sub]) {
    header('Macro Usage');
    console.log(`  ${c.bold(c.green('macro list'))}                              list all macros`);
    console.log(`  ${c.bold(c.green('macro add'))}  ${c.cyan('<name> <cmd> [flags]')}   save a macro`);
    console.log(`  ${c.bold(c.green('macro run'))}  ${c.cyan('<name>')}                 run a macro`);
    console.log(`  ${c.bold(c.green('macro remove'))}  ${c.cyan('<name>')}              delete a macro`);
    console.log(`\n  ${c.yellow('Examples:')}`);
    console.log(`  ${c.dim('macro add whales trades --min=5000')}`);
    console.log(`  ${c.dim('macro add topcap market --sort=marketCap --limit=5')}`);
    console.log(`  ${c.dim('macro add btc coin BTC --tf=1h')}`);
    console.log(`  ${c.dim('macro run whales')}\n`);
    return;
  }

  await subs[sub]();
}