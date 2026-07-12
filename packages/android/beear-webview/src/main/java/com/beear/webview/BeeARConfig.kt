package com.beear.webview

/**
 * Configuration for the BeeAR try-on WebView host.
 *
 * Prefer loopback (`http://localhost:8860/`) with `adb reverse` so WebView
 * exposes `getUserMedia` for camera capture.
 */
data class BeeARConfig(
    /** Base URL of the BeeAR web UI (server or offline asset). */
    val baseUrl: String = DEFAULT_URL,
    /** Request Android CAMERA permission when the page asks for video capture. */
    val enableCamera: Boolean = true,
    /** Allow cleartext HTTP (required for localhost development). */
    val allowCleartext: Boolean = true,
    /** Enable DOM storage / localStorage for sessions. */
    val enableDomStorage: Boolean = true,
    /** Optional query string appended to [baseUrl] (e.g. `desktop=1`). */
    val extraQuery: String? = null,
) {
    fun resolveUrl(): String {
        val base = baseUrl.trim().let { if (it.endsWith("/")) it else "$it/" }
        val q = extraQuery?.trim()?.removePrefix("?")?.takeIf { it.isNotEmpty() } ?: return base
        return if (base.contains("?")) "$base&$q" else "$base?$q"
    }

    companion object {
        /** Loopback origin — pair with `adb reverse tcp:8860 tcp:8860`. */
        const val DEFAULT_URL = "http://localhost:8860/"

        /** Offline packaged UI inside the AAR (run sync-web-assets first). */
        const val ASSET_URL = "file:///android_asset/beear/index.html"

        fun loopback(port: Int = 8860): BeeARConfig =
            BeeARConfig(baseUrl = "http://localhost:$port/")

        fun offlineAssets(): BeeARConfig =
            BeeARConfig(baseUrl = ASSET_URL, allowCleartext = true)
    }
}
