// src/api.js — all HTTP calls to rugplay.com/api/*
// enhanced by Glaringly

'use strict';

const https = require('https');
const http  = require('http');

const BASE = 'https://rugplay.com/api';

// ─── Core fetch ──────────────────────────────────────────────────────────────

function get(path, params = {}) {
  const qs  = Object.keys(params).length
    ? '?' + new URLSearchParams(params).toString()
    : '';
  const url = `${BASE}${path}${qs}`;

  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'rugplay-cli/2.0 (github.com/DevLJSP/rugplay-cli)',
        'Accept':     'application/json',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP ${res.statusCode} for ${path}`));
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Invalid JSON from ${path}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy(new Error(`Request timeout for ${path}`));
    });
  });
}

// ─── Market ──────────────────────────────────────────────────────────────────

async function getTopCoins() {
  return get('/coins', { sortBy: 'marketCap', order: 'desc', limit: 50 });
}

async function getMarket({
  search  = '',
  sort    = 'marketCap',
  order   = 'desc',
  price   = 'all',
  change  = 'all',
  page    = 1,
  limit   = 20,
} = {}) {
  const params = { sortBy: sort, order, page, limit };
  if (search) params.search = search;
  if (price  !== 'all') params.priceRange = price;
  if (change !== 'all') params.changeFilter = change;
  return get('/coins', params);
}

async function getCoin(symbol) {
  return get(`/coin/${symbol.toUpperCase()}`);
}

async function getCoinCandles(symbol, timeframe = '1h') {
  return get(`/coin/${symbol.toUpperCase()}/candles`, { timeframe });
}

async function getCoinHolders(symbol, limit = 50) {
  return get(`/coin/${symbol.toUpperCase()}/holders`, { limit });
}

// ─── Trades ──────────────────────────────────────────────────────────────────

async function getTrades(limit = 30, minValue = 0) {
  const params = { limit };
  if (minValue > 0) params.minValue = minValue;
  return get('/trades', params);
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

async function getLeaderboard(type = 'rich', limit = 50) {
  return get('/leaderboard', { type, limit });
}

// ─── Hopium ──────────────────────────────────────────────────────────────────

async function getHopium({ status = 'ACTIVE', page = 1, limit = 20 } = {}) {
  return get('/hopium', { status, page, limit });
}

async function getHopiumQuestion(id) {
  return get(`/hopium/${id}`);
}

// ─── Portfolio / User ─────────────────────────────────────────────────────────

async function getPortfolio(userId) {
  return get(`/user/${userId}/portfolio`);
}

async function getUserProfile(userId) {
  return get(`/user/${userId}`);
}

// ─── Search ──────────────────────────────────────────────────────────────────

async function searchCoins(query) {
  return get('/coins/search', { q: query });
}

module.exports = {
  getTopCoins,
  getMarket,
  getCoin,
  getCoinCandles,
  getCoinHolders,
  getTrades,
  getLeaderboard,
  getHopium,
  getHopiumQuestion,
  getPortfolio,
  getUserProfile,
  searchCoins,
};
