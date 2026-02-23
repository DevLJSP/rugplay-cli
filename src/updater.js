import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { c } from './display.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REMOTE_VERSION_URL = 'https://raw.githubusercontent.com/DevLJSP/rugplay-cli/main/version.txt';

function parseVer(s) {
  return s.trim().split('.').map(Number);
}

function isNewer(remote, local) {
  for (let i = 0; i < 3; i++) {
    if ((remote[i] ?? 0) > (local[i] ?? 0)) return true;
    if ((remote[i] ?? 0) < (local[i] ?? 0)) return false;
  }
  return false;
}

export async function checkForUpdates() {
  try {
    const localRaw = readFileSync(resolve(__dirname, '../version.txt'), 'utf8');
    const local = parseVer(localRaw);

    const res = await fetch(REMOTE_VERSION_URL, {
      headers: { 'User-Agent': 'rugplay-cli/1.0' },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return;

    const remoteRaw = await res.text();
    const remote = parseVer(remoteRaw);

    if (isNewer(remote, local)) {
      const bar = '─'.repeat(62);
      console.log(`\n${c.yellow(bar)}`);
      console.log(c.yellow(`  ⬆  Nova versão disponível: ${c.bold(remoteRaw.trim())}  (atual: ${localRaw.trim()})`));
      console.log(c.yellow(`     git pull && npm install`));
      console.log(`${c.yellow(bar)}\n`);
    }
  } catch {
  }
}