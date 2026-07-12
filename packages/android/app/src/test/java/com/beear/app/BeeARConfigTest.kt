package com.beear.app

import java.net.URI
import org.junit.Assert.assertEquals
import org.junit.Test

class BeeARConfigTest {
    @Test
    fun defaultUrlUsesLoopbackOriginForWebViewCameraCapture() {
        val url = URI(BeeARConfig.DEFAULT_URL)

        assertEquals("http", url.scheme)
        assertEquals("localhost", url.host)
        assertEquals(8860, url.port)
    }
}
