# BeeAR Android

Minimal Kotlin app: `WebView` loads the BeeAR web try-on UI.

## Point at the server

| Environment | URL |
| --- | --- |
| Emulator → host PC | `http://10.0.2.2:8860` |
| USB device / same Wi‑Fi | `http://<your-lan-ip>:8860` |

Edit `app/src/main/java/com/beear/app/MainActivity.kt` (`BEEAR_URL`).

## Build

```bash
# With Android Studio / Gradle
./gradlew :app:assembleDebug
```

This repo ships the **source scaffold** (`MainActivity` + README). Full Gradle wrapper can be added via Android Studio **New Project** import of this package.

## Permissions

- `CAMERA`
- `INTERNET`
- WebView `setMediaPlaybackRequiresUserGesture(false)` for video stream
