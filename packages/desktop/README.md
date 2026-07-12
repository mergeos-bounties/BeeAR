# BeeAR Desktop (Windows)

Electron shell around the BeeAR web try-on UI.

```powershell
# Terminal 1 — API + web
cd ..\server
pip install -e .
beear serve --port 8860

# Terminal 2 — desktop window
cd ..\desktop
npm install
npm start
```

Override URL: `$env:BEEAR_URL="http://127.0.0.1:8860"; npm start`
