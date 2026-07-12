package com.beear.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.os.Bundle
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat

/**
 * BeeAR Android shell — WebView over the BeeAR web try-on UI.
 *
 * Emulator: http://10.0.2.2:8860
 * Device on LAN: http://<pc-ip>:8860
 */
class MainActivity : ComponentActivity() {
    // Change for your environment
    private val beearUrl: String = "http://10.0.2.2:8860"

    private lateinit var webView: WebView

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { _ ->
            webView.reload()
        }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this)
        setContentView(webView)

        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.allowFileAccess = true

        webView.webViewClient = WebViewClient()
        webView.webChromeClient =
            object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest?) {
                    request?.grant(request.resources)
                }
            }

        ensurePermissions()
        webView.loadUrl(beearUrl)
    }

    private fun ensurePermissions() {
        val need =
            arrayOf(Manifest.permission.CAMERA, Manifest.permission.INTERNET)
                .filter {
                    ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
                }
        if (need.isNotEmpty()) {
            permissionLauncher.launch(need.toTypedArray())
        }
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
