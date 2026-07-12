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

## Windows package

BeeAR Desktop uses `electron-builder` for Windows packaging. The build output is
written to `packages\desktop\out`.

```powershell
cd packages\desktop
npm install

# Portable Windows package
npm run dist
# out\BeeAR-0.1.0-Portable-x64.exe

# NSIS installer
npm run dist:win-installer
# out\BeeAR-0.1.0-Setup-x64.exe
```
