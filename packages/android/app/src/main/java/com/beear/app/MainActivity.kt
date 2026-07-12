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
