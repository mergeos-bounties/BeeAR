package com.beear.webview

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.util.AttributeSet
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity

/**
 * Reusable BeeAR try-on WebView container for host apps.
 *
 * Loads the BeeAR web UI (shared `@beear/tryon` JS lib + app shell).
 * Handles WebView camera permission bridging when [BeeARConfig.enableCamera] is true.
 *
 * ```kotlin
 * val view = BeeARWebView(this)
 * setContentView(view)
 * view.attach(this, BeeARConfig.loopback())
 * view.loadTryOn()
 * ```
 */
class BeeARWebView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0,
) : FrameLayout(context, attrs, defStyleAttr) {

    private val webView: WebView = WebView(context)
    private var config: BeeARConfig = BeeARConfig()
    private var permissionLauncher: ActivityResultLauncher<String>? = null
    private var pendingWebPermissionRequest: PermissionRequest? = null
    private var hostActivity: ComponentActivity? = null

    init {
        addView(
            webView,
            LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT),
        )
    }

    /**
     * Bind to a [ComponentActivity] for permission results, then configure WebView.
     * Call from Activity.onCreate before [loadTryOn].
     */
    @SuppressLint("SetJavaScriptEnabled")
    fun attach(activity: ComponentActivity, config: BeeARConfig = BeeARConfig()) {
        this.hostActivity = activity
        this.config = config

        permissionLauncher =
            activity.registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
                val request = pendingWebPermissionRequest
                pendingWebPermissionRequest = null
                if (granted && request != null) {
                    grantCameraPermission(request)
                } else {
                    request?.deny()
                }
            }

        applyWebSettings(webView.settings)
        webView.webViewClient = WebViewClient()
        webView.webChromeClient =
            object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest?) {
                    if (!config.enableCamera) {
                        request?.deny()
                        return
                    }
                    request?.let(::handleWebPermissionRequest)
                }
            }
    }

    /** Load try-on UI from [BeeARConfig.resolveUrl]. */
    fun loadTryOn() {
        webView.loadUrl(config.resolveUrl())
    }

    fun loadUrl(url: String) {
        webView.loadUrl(url)
    }

    fun getWebView(): WebView = webView

    fun destroyWebView() {
        pendingWebPermissionRequest?.deny()
        pendingWebPermissionRequest = null
        removeView(webView)
        webView.destroy()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun applyWebSettings(settings: WebSettings) {
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = config.enableDomStorage
        settings.mediaPlaybackRequiresUserGesture = false
        settings.allowFileAccess = true
        // Needed for file:///android_asset offline shell talking to relative paths
        settings.allowContentAccess = true
        @Suppress("DEPRECATION")
        settings.allowFileAccessFromFileURLs = true
        @Suppress("DEPRECATION")
        settings.allowUniversalAccessFromFileURLs = false
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
        val launcher = permissionLauncher
        if (launcher == null) {
            request.deny()
            return
        }
        pendingWebPermissionRequest?.deny()
        pendingWebPermissionRequest = request
        launcher.launch(Manifest.permission.CAMERA)
    }

    private fun grantCameraPermission(request: PermissionRequest) {
        val resources =
            request.resources.filter { it == PermissionRequest.RESOURCE_VIDEO_CAPTURE }
        request.grant(resources.toTypedArray())
    }

    private fun hasCameraPermission(): Boolean {
        return ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) ==
            PackageManager.PERMISSION_GRANTED
    }

    companion object {
        const val LIBRARY_NAME = "beear-webview"

        /** Helper for FragmentActivity hosts. */
        fun create(
            activity: FragmentActivity,
            config: BeeARConfig = BeeARConfig(),
        ): BeeARWebView {
            return BeeARWebView(activity).also {
                it.attach(activity, config)
            }
        }
    }
}
