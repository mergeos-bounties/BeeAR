package com.beear.app

import com.beear.webview.BeeARConfig
import java.net.URI
import org.junit.Assert.assertEquals
import org.junit.Test

/** Host app still verifies default loopback URL from the library. */
class BeeARConfigTest {
    @Test
    fun defaultUrlUsesLoopbackOriginForWebViewCameraCapture() {
        val url = URI(BeeARConfig.DEFAULT_URL)
        assertEquals("http", url.scheme)
        assertEquals("localhost", url.host)
        assertEquals(8860, url.port)
    }
}
