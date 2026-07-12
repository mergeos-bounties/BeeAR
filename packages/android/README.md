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
# From this directory
./gradlew :app:assembleDebug
```

The first build downloads the pinned Android Gradle plugin and Kotlin plugin.
Set `ANDROID_HOME`, `ANDROID_SDK_ROOT`, or `local.properties` with `sdk.dir=...`
if Gradle cannot find your Android SDK.

## Permissions

- `CAMERA`
- `INTERNET`
- WebView `setMediaPlaybackRequiresUserGesture(false)` for video stream
