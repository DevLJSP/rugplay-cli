// src/api.js — RugPlay Official API Client (fixed)

'use strict';

const https = require('https');
const http  = require('http');

const BASE = 'https://rugplay.com/api/v1';

const API_KEY = process.env.RUGPLAY_API_KEY;

if (!API_KEY) {
  throw new Error('Missing API key: set RUGPLAY_API_KEY environment variable');
}

// ─── Core Fetch ──────────────────────────────────────────────────────────────

function get(path, params = {}) {
  const qs = Object.keys(params).length
    ? '?' + new URLSearchParams(params).toString()
    : '';

  const url = `${BASE}${path}${qs}`;

  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;

    const req = mod.get(url, {
      headers: {
        'User-Agent': 'rugplay-cli/2.2',
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      timeout: 15000
    }, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);

      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }

        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Invalid JSON from ${path}`));
        }
      });
    });

    req.on('timeout', () =>
      req.destroy(new Error(`Timeout for ${path}`))
    );

    req.on('error', reject);
  });
}

// ─── Market ──────────────────────────────────────────────────────────────────

const getTopCoins = () =>
  get('/top');

const getMarket = ({
  search = '',
  sort = 'marketCap',
  order = 'desc',
  page = 1,
  limit = 20,
} = {}) => {
  const params = { sort, order, page, limit };
  if (search) params.search = search;
  return get('/market', params);
};

const getCoin = (symbol) =>
  get(`/coin/${symbol.toUpperCase()}`);

const getCoinHolders = (symbol) =>
  get(`/holders/${symbol.toUpperCase()}`);

// ─── Hopium ──────────────────────────────────────────────────────────────────

const getHopium = ({ page = 1, limit = 20 } = {}) =>
  get('/hopium', { page, limit });

const getHopiumQuestion = (id) =>
  get(`/hopium/${id}`);

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  getTopCoins,
  getMarket,
  getCoin,
  getCoinHolders,
  getHopium,
  getHopiumQuestion,
};
