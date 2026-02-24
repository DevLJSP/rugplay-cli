'use strict';

const https = require('https');

const BASE = 'https://rugplay.com/api/v1';
const API_KEY = process.env.RUGPLAY_API_KEY;

if (!API_KEY) {
  throw new Error('Missing API key: set RUGPLAY_API_KEY environment variable');
}

// ─── Core fetch ──────────────────────────────────────────────────────────────

function get(path, params = {}) {
  const qs = Object.keys(params).length
    ? '?' + new URLSearchParams(params).toString()
    : '';

  const url = `${BASE}${path}${qs}`;

  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'rugplay-cli/2.2',
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
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

    req.on('timeout', () => req.destroy(new Error(`Timeout for ${path}`)));
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
  price = 'all',
  change = 'all',
  page = 1,
  limit = 20
} = {}) => {
  const params = { sort, order, page, limit };
  if (search) params.search = search;
  if (price !== 'all') params.priceRange = price;
  if (change !== 'all') params.changeFilter = change;
  return get('/market', params);
};

const getCoin = (symbol) =>
  get(`/coin/${symbol.toUpperCase()}`);

const getCoinCandles = (symbol, timeframe = '1h') =>
  get(`/coin/${symbol.toUpperCase()}/candles`, { timeframe });

const getCoinHolders = (symbol, limit = 50) =>
  get(`/holders/${symbol.toUpperCase()}`, { limit });

// ─── Trades ──────────────────────────────────────────────────────────────────

const getTrades = (limit = 30, minValue = 0) =>
  get('/trades', minValue > 0 ? { limit, minValue } : { limit });

// ─── Leaderboard ─────────────────────────────────────────────────────────────

const getLeaderboard = (type = 'rich', limit = 50) =>
  get('/leaderboard', { type, limit });

// ─── Hopium ──────────────────────────────────────────────────────────────────

const getHopium = ({ status = 'ACTIVE', page = 1, limit = 20 } = {}) =>
  get('/hopium', { status, page, limit });

const getHopiumQuestion = (id) =>
  get(`/hopium/${id}`);

// ─── Portfolio / User ─────────────────────────────────────────────────────────

const getPortfolio = (userId) =>
  get(`/user/${userId}/portfolio`);

const getUserProfile = (userId) =>
  get(`/user/${userId}`);

// ─── Search ──────────────────────────────────────────────────────────────────

const searchCoins = (query) =>
  get('/market', { search: query });

// ─── Exports ─────────────────────────────────────────────────────────────────

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
  searchCoins
};
