# BeeAR Android

Minimal Kotlin app: `WebView` loads the BeeAR web try-on UI.

## Point at the server

| Environment | URL |
| --- | --- |
| Emulator / USB device → host PC | `http://localhost:8860/` after `adb reverse tcp:8860 tcp:8860` |
| Same Wi‑Fi device | Use an HTTPS URL for camera capture; HTTP LAN IPs can load the UI but WebView will not expose `getUserMedia` |

The default app URL is `BeeARConfig.DEFAULT_URL` in
`app/src/main/java/com/beear/app/MainActivity.kt`.

For local emulator or USB-device testing:

```bash
adb reverse tcp:8860 tcp:8860
```

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
- Camera capture requires a secure or loopback origin. The default loopback URL
  keeps `navigator.mediaDevices.getUserMedia` available while `adb reverse`
  forwards requests to the host BeeAR server.
