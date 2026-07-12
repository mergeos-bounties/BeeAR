package com.beear.webview

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment

/**
 * Drop-in Fragment hosting [BeeARWebView] for embedding try-on in any activity.
 *
 * ```kotlin
 * supportFragmentManager.beginTransaction()
 *   .replace(R.id.container, BeeARTryOnFragment.newInstance(BeeARConfig.loopback()))
 *   .commit()
 * ```
 */
class BeeARTryOnFragment : Fragment() {

    private var webView: BeeARWebView? = null
    private lateinit var config: BeeARConfig

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val url = arguments?.getString(ARG_URL) ?: BeeARConfig.DEFAULT_URL
        val camera = arguments?.getBoolean(ARG_CAMERA, true) ?: true
        config = BeeARConfig(baseUrl = url, enableCamera = camera)
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View {
        val activity = requireActivity()
        val view = BeeARWebView(requireContext())
        view.attach(activity, config)
        webView = view
        return view
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        webView?.loadTryOn()
    }

    override fun onDestroyView() {
        webView?.destroyWebView()
        webView = null
        super.onDestroyView()
    }

    companion object {
        private const val ARG_URL = "url"
        private const val ARG_CAMERA = "camera"

        fun newInstance(config: BeeARConfig = BeeARConfig()): BeeARTryOnFragment {
            return BeeARTryOnFragment().apply {
                arguments =
                    Bundle().apply {
                        putString(ARG_URL, config.baseUrl)
                        putBoolean(ARG_CAMERA, config.enableCamera)
                    }
            }
        }
    }
}
