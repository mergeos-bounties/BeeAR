# BeeAR

**BeeAR** is a **virtual try-on** stack for **glasses and accessories** — open the camera (or demo face), pick a frame, and preview fit in real time.

| Package | Role |
| --- | --- |
| **BeeAR Web** | Browser try-on (canvas + face landmarks, MediaPipe optional) |
| **BeeAR Server** | Catalog API, sessions, health (Python FastAPI) |
| **BeeAR Desktop** | Windows shell (Electron) wrapping the web app |
| **BeeAR Android** | Kotlin WebView client for on-device try-on |

Org: [mergeos-bounties](https://github.com/mergeos-bounties) · MergeOS MRG bounties.

## Quick start (offline)

```powershell
cd D:\ThanhTrucSolutions\BeeAR\packages\server
python -m venv .venv
.\.venv\Scripts\activate
pip install -e ".[dev]"

beear demo
beear serve --port 8860
```

Open **http://127.0.0.1:8860** — web try-on UI.

### CLI

```powershell
beear catalog list
beear catalog show aviator_gold
beear version
```

## Desktop (Windows)

```powershell
cd packages\desktop
npm install
npm start
# builds against local server at 8860 (start server first)
```

## Android

See [packages/android/README.md](packages/android/README.md) — WebView loads `http://10.0.2.2:8860` (emulator) or your LAN IP.

## How try-on works

1. Camera stream (or **Demo face** offline image)
2. Face landmarks (browser MediaPipe Face Mesh when available; geometric fallback otherwise)
3. Selected SKU mesh/SVG scaled to inter-pupil distance
4. Live overlay + optional snapshot download

## Layout

```
packages/
  server/     # Python CLI + API + static web mount
  web/        # Try-on UI (also served by server)
  desktop/    # Electron Windows shell
  android/    # Kotlin WebView
  catalog/    # Frame SKUs (JSON + SVG assets)
docs/BOUNTY.md
```

## MergeOS bounties

1. Star this repo + [mergeos](https://github.com/mergeos-bounties/mergeos)
2. Claim a `bounty` issue
3. Claim on MergeOS [issue #1](https://github.com/mergeos-bounties/mergeos/issues/1)
4. PR to **BeeAR** with tests / screenshots
5. Credit MRG 25 / 50 / 100 / 200

See [docs/BOUNTY.md](docs/BOUNTY.md).

## License

MIT
