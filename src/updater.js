// src/updater.js — auto-update checker
// enhanced by Glaringly

'use strict';

const https   = require('https');
const path    = require('path');
const fs      = require('fs');
const { c, hr } = require('./display');

const VERSION_URL  = 'https://raw.githubusercontent.com/DevLJSP/rugplay-cli/main/version.txt';
const LOCAL_FILE   = path.join(__dirname, '..', 'version.txt');

function getCurrentVersion() {
  try {
    return fs.readFileSync(LOCAL_FILE, 'utf8').trim();
  } catch {
    return '0.0.0';
  }
}

function fetchRemoteVersion() {
  return new Promise((resolve) => {
    const req = https.get(VERSION_URL, {
      headers: { 'User-Agent': 'rugplay-cli' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data.trim()));
    });
    req.on('error', () => resolve(null));
    req.setTimeout(3000, () => { req.destroy(); resolve(null); });
  });
}

function semverGt(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return false;
}

async function checkForUpdate() {
  const current = getCurrentVersion();
  const remote  = await fetchRemoteVersion();
  if (remote && semverGt(remote, current)) {
    console.log(hr());
    console.log(`  ${c.bgreen('⬆')}  ${c.bold('New version available:')} ${c.cyan(remote)}  ${c.dim(`(current: ${current})`)}`);
    console.log(`     ${c.dim('git pull && npm install')}`);
    console.log(hr());
    console.log('');
  }
}

module.exports = { checkForUpdate, getCurrentVersion };
