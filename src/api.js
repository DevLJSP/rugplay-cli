const BASE = 'https://rugplay.com/api';

async function get(path, params = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'rugplay-cli/1.0' },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }

  return res.json();
}

export const api = {
  top: () => get('/coins/top'),
  market: (p) => get('/market', p),
  coin: (symbol, timeframe) => get(`/coin/${symbol.toUpperCase()}`, timeframe ? { timeframe } : {}),
  holders: (symbol, limit) => get(`/coin/${symbol.toUpperCase()}/holders`, limit ? { limit } : {}),
  leaderboard: () => get('/leaderboard'),
  trades: (limit, minValue) => get('/trades/recent', { limit: limit ?? 50, minValue: minValue ?? 0 }),
  hopium: (p) => get('/hopium/questions', p),
  hopiumQ: (id) => get(`/hopium/questions/${id}`),
};