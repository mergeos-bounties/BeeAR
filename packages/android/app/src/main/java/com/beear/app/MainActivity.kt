package com.beear.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import com.beear.webview.BeeARConfig
import com.beear.webview.BeeARWebView

/**
 * Thin host app — all WebView / camera bridging lives in [com.beear.webview] library.
 */
class MainActivity : ComponentActivity() {
    private lateinit var tryOnView: BeeARWebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        tryOnView = BeeARWebView(this)
        setContentView(tryOnView)
        tryOnView.attach(this, BeeARConfig.loopback())
        tryOnView.loadTryOn()
    }

    override fun onDestroy() {
        if (::tryOnView.isInitialized) {
            tryOnView.destroyWebView()
        }
        super.onDestroy()
    }
}
