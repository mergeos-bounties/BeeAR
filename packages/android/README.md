# BeeAR Android

Two modules:

| Module | Type | Role |
| --- | --- | --- |
| **`:beear-webview`** | **Android Library (AAR)** | Reusable WebView try-on host + camera permission bridge |
| **`:app`** | Application | Thin demo host that only embeds the library |

The try-on **rendering core** is the shared JS lib **`@beear/tryon`** (`packages/tryon-js`), loaded inside the WebView (from the BeeAR server or offline assets).

## Use the library in your app

```kotlin
// settings.gradle.kts
include(":beear-webview")
// projectDir = file("path/to/BeeAR/packages/android/beear-webview")

// build.gradle.kts
implementation(project(":beear-webview"))
// or future: implementation("com.beear:beear-webview:0.1.0")
```

```kotlin
class HostActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val view = BeeARWebView(this)
    setContentView(view)
    view.attach(this, BeeARConfig.loopback()) // or BeeARConfig.offlineAssets()
    view.loadTryOn()
  }
}
```

Fragment:

```kotlin
supportFragmentManager.beginTransaction()
  .replace(R.id.container, BeeARTryOnFragment.newInstance(BeeARConfig.loopback()))
  .commit()
```

## Point at the server

| Environment | URL |
| --- | --- |
| Emulator / USB → host PC | `BeeARConfig.loopback()` + `adb reverse tcp:8860 tcp:8860` |
| Offline packaged UI | `BeeARConfig.offlineAssets()` after syncing web assets |
| Same Wi‑Fi device | HTTPS recommended for camera |

```bash
adb reverse tcp:8860 tcp:8860
```

## Sync offline web assets (optional)

```bash
# from repo root
node packages/android/scripts/sync-web-assets.mjs
# copies packages/web + tryon-js IIFE → beear-webview/src/main/assets/beear/
```

## Build

```bash
cd packages/android
./gradlew :beear-webview:assembleRelease   # AAR
./gradlew :app:assembleDebug               # demo APK
./gradlew test
```

## Permissions (host app)

- `CAMERA` (if camera try-on enabled)
- `INTERNET`
- `android:usesCleartextTraffic="true"` for localhost HTTP
- Hardware acceleration on

## Layout

```text
packages/android/
  beear-webview/     # library AAR  ← reuse this
  app/               # demo shell
  scripts/sync-web-assets.mjs
packages/tryon-js/   # @beear/tryon JS core (web + WebView)
packages/web/        # web host UI using the JS lib
```
