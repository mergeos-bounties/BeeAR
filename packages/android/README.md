# BeeAR Android

Two modules:

| Module | Type | Role |
| --- | --- | --- |
| **`:beear-webview`** | **Android Library (AAR)** | Reusable WebView try-on host + camera permission bridge |
| **`:app`** | Application | Thin demo host that only embeds the library |

The try-on **rendering core** is the shared JS lib **`@beear/tryon`** (`packages/tryon-js`), bundled offline inside the AAR or loaded from the BeeAR server.

**Library version:** `0.4.0` · **Release:** [libs-v0.4.0](https://github.com/mergeos-bounties/BeeAR/releases/tag/libs-v0.4.0)

---

## Install the AAR (host apps)

### Option A — GitHub Release file

1. Download [`beear-webview-0.4.0.aar`](https://github.com/mergeos-bounties/BeeAR/releases/download/libs-v0.4.0/beear-webview-0.4.0.aar)
2. Place it under `app/libs/`
3. In `app/build.gradle.kts`:

```kotlin
dependencies {
    implementation(files("libs/beear-webview-0.4.0.aar"))
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.fragment:fragment-ktx:1.8.5")
    implementation("androidx.appcompat:appcompat:1.7.0")
}
```

### Option B — Project module (this monorepo)

```kotlin
// settings.gradle.kts
include(":beear-webview")
// projectDir = file("path/to/BeeAR/packages/android/beear-webview")

// build.gradle.kts
implementation(project(":beear-webview"))
```

---

## Use the library

```kotlin
import com.beear.webview.BeeARConfig
import com.beear.webview.BeeARWebView

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
| Offline packaged UI | `BeeARConfig.offlineAssets()` (assets shipped in the AAR) |
| Same Wi-Fi device | HTTPS recommended for camera |

```bash
adb reverse tcp:8860 tcp:8860
```

## Sync offline web assets (maintainers)

```bash
# from repo root
node packages/android/scripts/sync-web-assets.mjs
# copies packages/web + tryon-js IIFE → beear-webview/src/main/assets/beear/
```

## Build & release

```bash
cd packages/android
./gradlew :beear-webview:assembleRelease   # AAR
./gradlew :app:assembleDebug               # demo APK
./gradlew test

# full lib release (web + Android) from repo root:
node scripts/release-libs.mjs
node scripts/release-libs.mjs --publish   # GitHub Release libs-v0.4.0
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

## License

MIT · [mergeos-bounties/BeeAR](https://github.com/mergeos-bounties/BeeAR)
