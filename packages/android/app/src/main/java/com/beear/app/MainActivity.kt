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

internal object BeeARConfig {
    const val DEFAULT_URL = "http://localhost:8860/"
}

/**
 * BeeAR Android shell — WebView over the BeeAR web try-on UI.
 *
 * Emulator or USB device: run `adb reverse tcp:8860 tcp:8860`, then use the
 * loopback URL below so WebView exposes camera capture APIs.
 */
class MainActivity : ComponentActivity() {
    private val beearUrl: String = BeeARConfig.DEFAULT_URL

    private lateinit var webView: WebView
    private var pendingWebPermissionRequest: PermissionRequest? = null

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            val request = pendingWebPermissionRequest
            pendingWebPermissionRequest = null

            if (granted && request != null) {
                grantCameraPermission(request)
            } else {
                request?.deny()
            }
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
                    request?.let(::handleWebPermissionRequest)
                }
            }

        webView.loadUrl(beearUrl)
    }

    private fun handleWebPermissionRequest(request: PermissionRequest) {
        if (PermissionRequest.RESOURCE_VIDEO_CAPTURE !in request.resources) {
            request.deny()
            return
        }

        if (hasCameraPermission()) {
            grantCameraPermission(request)
            return
        }

        pendingWebPermissionRequest?.deny()
        pendingWebPermissionRequest = request
        permissionLauncher.launch(Manifest.permission.CAMERA)
    }

    private fun grantCameraPermission(request: PermissionRequest) {
        val resources = request.resources.filter { it == PermissionRequest.RESOURCE_VIDEO_CAPTURE }
        request.grant(resources.toTypedArray())
    }

    private fun hasCameraPermission(): Boolean {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) ==
            PackageManager.PERMISSION_GRANTED
    }

    override fun onDestroy() {
        pendingWebPermissionRequest?.deny()
        webView.destroy()
        super.onDestroy()
    }
}
