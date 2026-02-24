# rugplay-cli

> Terminal client for [rugplay.com](https://rugplay.com) — originally by **zt01**, enhanced by **Glaringly**

```

██████╗ ██╗   ██╗ ██████╗ ██████╗ ██╗      █████╗ ██╗   ██╗
██╔══██╗██║   ██║██╔════╝ ██╔══██╗██║     ██╔══██╗╚██╗ ██╔╝
██████╔╝██║   ██║██║  ███╗██████╔╝██║     ███████║ ╚████╔╝
██╔══██╗██║   ██║██║   ██║██╔═══╝ ██║     ██╔══██║  ╚██╔╝
██║  ██║╚██████╔╝╚██████╔╝██║     ███████╗██║  ██║   ██║
╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝
CLI  ─ terminal client for rugplay.com ─ enhanced by Glaringly

````

---

## What's New in v2.0

- **Full ASCII banner** on startup
- **Revamped table rendering** with box-drawing chars and aligned columns
- **Candlestick charts** with Y-axis price labels and time axis
- **Sparklines** inline in market + watch views
- **Progress bars** for holder distribution, 24h range, prediction markets
- **Spinner** feedback on every network call
- **`portfolio <userId>`** — NEW: view any user's portfolio with allocation %
- **`watch <SYMBOL>`** — NEW: live price watcher with sparkline history
- **`alert add/list/check/clear`** — NEW: price alert system
- **`--debug` flag** on any command for stack traces
- Whale detection (`≥ $10K`) in trades + live stream
- Market sentiment summary after `top`
- Concentration risk warning in `holders`
- Running volume counter in `live`

---

## Requirements

- Node.js 18+
- No required dependencies
- Optional: `npm install ws` for `live` on Node < 22

---

## Setup

### API Key Setup (Required)

RugPlay now requires an API key for all API requests.

1) Generate an API key from your RugPlay dashboard.

2) Set the environment variable:

**Windows (CMD)**

```bat
setx RUGPLAY_API_KEY "YOUR_API_KEY_HERE"
````

**Windows (PowerShell)**

```powershell
$env:RUGPLAY_API_KEY="YOUR_API_KEY_HERE"
```

**macOS / Linux**

```bash
export RUGPLAY_API_KEY="YOUR_API_KEY_HERE"
```

3. **Restart your terminal** so the variable loads.

4. Verify:

**Windows**

```bat
echo %RUGPLAY_API_KEY%
```

**macOS / Linux**

```bash
echo $RUGPLAY_API_KEY
```

If your key prints, setup is complete.

---

### Install & Run

```bash
git clone https://github.com/DevLJSP/rugplay-cli
cd rugplay-cli
node index.js help
```

---

## Commands

### Market

```bash
node index.js top
node index.js market --search=doge --sort=volume24h --change=gainers
node index.js coin BTC --tf=4h
node index.js holders TEST --limit=100
```

### Trading

```bash
node index.js trades --limit=50 --min=1000
node index.js live --min=500
```

### Rankings

```bash
node index.js leaderboard rich
node index.js leaderboard rugpullers
node index.js leaderboard losers
node index.js leaderboard cash
```

### Predictions

```bash
node index.js hopium --status=ACTIVE
node index.js hopium-q 42
```

### New in v2.0

```bash
# Portfolio viewer
node index.js portfolio <userId>

# Live price watcher (refreshes every N seconds)
node index.js watch BTC DOGE TEST --interval=5

# Price alerts
node index.js alert add BTC --above=100000
node index.js alert add DOGE --below=0.05
node index.js alert list
node index.js alert check
node index.js alert clear
```

### Macros

```bash
node index.js macro add whales   trades --min=5000
node index.js macro add btchour  coin BTC --tf=1h
node index.js macro run whales
node index.js macro list
node index.js macro remove btchour
```

---

## Project Structure

```
rugplay-cli/
├── index.js                  # entry point & command router
├── macros.json               # saved macros (auto-created)
├── alerts.json               # saved price alerts (auto-created)
├── version.txt               # current version
└── src/
    ├── api.js                # all HTTP calls to rugplay.com/api/*
    ├── display.js            # ANSI colors, boxes, charts, formatting
    ├── updater.js            # auto-update checker
    └── commands/
        ├── market.js         # top, market
        ├── coin.js           # coin, holders
        ├── hopium.js         # hopium, hopium-q
        ├── leaderboard.js    # leaderboard
        ├── trades.js         # trades
        ├── live.js           # live WebSocket stream
        ├── macro.js          # macro shortcuts
        ├── portfolio.js      # [NEW] portfolio viewer
        ├── watch.js          # [NEW] live price watcher
        └── alert.js          # [NEW] price alert system
```

---

## Disclaimer

Educational project. Not affiliated with or endorsed by Rugplay.
Use responsibly and in accordance with Rugplay's terms of service.

---

## License

MIT
