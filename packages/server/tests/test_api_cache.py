import pytest
import httpx

from beear.api import CATALOG_CACHE_CONTROL, app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_catalog_uses_etag_and_cache_headers():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/catalog")

        assert response.status_code == 200
        assert response.headers["cache-control"] == CATALOG_CACHE_CONTROL
        assert response.headers["etag"].startswith('"')
        assert response.json()["frames"]


@pytest.mark.anyio
async def test_catalog_returns_304_for_matching_etag():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/catalog")
        etag = response.headers["etag"]

        cached = await client.get("/api/catalog", headers={"If-None-Match": etag})

        assert cached.status_code == 304
        assert cached.content == b""
        assert cached.headers["cache-control"] == CATALOG_CACHE_CONTROL
        assert cached.headers["etag"] == etag


@pytest.mark.anyio
async def test_catalog_meta_and_frame_are_cacheable():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        catalog = await client.get("/api/catalog")
        frame_id = catalog.json()["frames"][0]["id"]

        for path in ("/api/catalog/meta", f"/api/catalog/{frame_id}"):
            response = await client.get(path)
            assert response.status_code == 200
            assert response.headers["cache-control"] == CATALOG_CACHE_CONTROL
            assert response.headers["etag"].startswith('"')

            cached = await client.get(path, headers={"If-None-Match": response.headers["etag"]})
            assert cached.status_code == 304
            assert cached.headers["etag"] == response.headers["etag"]
