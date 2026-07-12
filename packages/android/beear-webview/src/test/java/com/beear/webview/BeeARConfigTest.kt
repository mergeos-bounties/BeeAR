package com.beear.webview

import java.net.URI
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class BeeARConfigTest {
    @Test
    fun defaultUrlUsesLoopbackForWebViewCamera() {
        val url = URI(BeeARConfig.DEFAULT_URL)
        assertEquals("http", url.scheme)
        assertEquals("localhost", url.host)
        assertEquals(8860, url.port)
    }

    @Test
    fun resolveUrlAppendsQuery() {
        val cfg = BeeARConfig(baseUrl = "http://localhost:8860/", extraQuery = "desktop=1")
        assertTrue(cfg.resolveUrl().contains("desktop=1"))
    }

    @Test
    fun offlineAssetPathIsFileScheme() {
        val url = URI(BeeARConfig.ASSET_URL)
        assertEquals("file", url.scheme)
        assertTrue(url.path.contains("android_asset/beear"))
    }
}
