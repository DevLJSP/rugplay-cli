# rugplay-cli

A terminal client for [rugplay.com](https://rugplay.com) — by zt01

```
┌──────────────────────────────────────────────────────────────┐
│  Top 50 Coins by Market Cap                                  │
├──────────────────────────────────────────────────────────────┤
│  #   Symbol      Name               Price      24h %         │
│  1   TEST        Test           $76.52      +7652377003%     │
│  2   DOGE        Doge            $0.0042        +12.30%      │
│  ...                                                         │
└──────────────────────────────────────────────────────────────┘
```

## Requirements

- Node.js 18+
- No dependencies, no API key

## Setup

```bash
git clone https://github.com/yourname/rugplay-cli
cd rugplay-cli
node index.js help
```

## Commands

### `top`
Top 50 coins ranked by market cap.

```bash
node index.js top
```

---

### `market`
Browse the full market with search, filters, and sorting.

```bash
node index.js market
node index.js market --search=doge
node index.js market --change=gainers --sort=volume24h --limit=10
node index.js market --price=under1 --order=asc --page=2
```

| Flag | Options | Default |
|------|---------|---------|
| `--search` | any string | — |
| `--sort` | `marketCap` `currentPrice` `change24h` `volume24h` `createdAt` | `marketCap` |
| `--order` | `asc` `desc` | `desc` |
| `--price` | `all` `under1` `1to10` `10to100` `over100` | `all` |
| `--change` | `all` `gainers` `losers` `hot` `wild` | `all` |
| `--page` | number | `1` |
| `--limit` | number | `20` |

---

### `coin`
Coin detail with an ASCII candlestick chart.

```bash
node index.js coin TEST
node index.js coin TEST --tf=1h
node index.js coin BTC --tf=4h
```

| Timeframe | `--tf` |
|-----------|--------|
| 1 minute  | `1m` |
| 5 minutes | `5m` |
| 15 minutes | `15m` |
| 1 hour    | `1h` |
| 4 hours   | `4h` |
| 1 day     | `1d` |

---

### `holders`
Top holders of a coin with liquidation values.

```bash
node index.js holders TEST
node index.js holders TEST --limit=100
```

---

### `trades`
Live feed of recent trades across all coins.

```bash
node index.js trades
node index.js trades --limit=50
node index.js trades --limit=100 --min=1000
```

| Flag | Description | Default |
|------|-------------|---------|
| `--limit` | number of trades (max 1000) | `30` |
| `--min` | minimum trade value in $ | `0` |

---

### `leaderboard`
Four different leaderboard categories.

```bash
node index.js leaderboard rugpullers   # biggest 24h net profit from selling
node index.js leaderboard losers       # biggest 24h losses
node index.js leaderboard cash         # highest BUSS cash balance
node index.js leaderboard rich         # highest total portfolio value
```

---

### `hopium`
Browse prediction markets.

```bash
node index.js hopium
node index.js hopium --status=RESOLVED
node index.js hopium --status=ALL --page=2 --limit=30
```

| Flag | Options | Default |
|------|---------|---------|
| `--status` | `ACTIVE` `RESOLVED` `ALL` | `ACTIVE` |
| `--page` | number | `1` |
| `--limit` | number | `20` |

---

### `hopium-q`
Detailed view of a prediction market question, including recent bets and a probability-over-time chart.

```bash
node index.js hopium-q 101
```

---

## Project Structure

```
rugplay-cli/
├── index.js                  # entry point & command router
├── package.json
└── src/
    ├── api.js                # all HTTP calls to rugplay.com/api/*
    ├── display.js            # colors, formatting, ASCII charts
    └── commands/
        ├── market.js         # top, market
        ├── coin.js           # coin, holders
        ├── hopium.js         # hopium, hopium-q
        ├── leaderboard.js    # leaderboard
        └── trades.js         # trades
```

## How It Works

All data comes from the public `rugplay.com/api/*` endpoints (no `/v1`, no auth required). The client hits the same routes the website uses, so everything is real-time.

## Disclaimer

This project is **educational**. It was built to demonstrate how the Rugplay system works — how its public API is structured, how market data flows, and how a terminal client can consume it.

**zt01 is not responsible for any unwanted use, misuse, or illegal scraping of rugplay.com.** Use this tool responsibly and in accordance with Rugplay's terms of service. This project is not affiliated with or endorsed by Rugplay.

## License

MIT
