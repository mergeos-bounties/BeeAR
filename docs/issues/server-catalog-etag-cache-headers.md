import hashlib
import httpx
import pytest
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from typing import Optional

app = FastAPI()

def generate_etag(content: str) -> str:
    """Generate ETag from content using MD5 hash."""
    return hashlib.md5(content.encode()).hexdigest()

@app.get("/catalog")
async def get_catalog(request: Request):
    """Catalog endpoint with ETag and cache headers."""
    catalog_data = {
        "items": [
            {"id": 1, "name": "Item 1"},
            {"id": 2, "name": "Item 2"},
            {"id": 3, "name": "Item 3"}
        ]
    }
    
    # Convert to JSON string for ETag generation
    import json
    content = json.dumps(catalog_data, sort_keys=True)
    etag = f'"{generate_etag(content)}"'
    
    # Check If-None-Match header
    if_none_match = request.headers.get("if-none-match")
    if if_none_match == etag:
        return Response(status_code=304, headers={
            "ETag": etag,
            "Cache-Control": "public, max-age=3600"
        })
    
    # Return full response with cache headers
    return JSONResponse(
        content=catalog_data,
        headers={
            "ETag": etag,
            "Cache-Control": "public, max-age=3600"
        }
    )

# Tests
@pytest.mark.asyncio
async def test_catalog_etag_generation():
    """Test that catalog endpoint returns ETag header."""
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/catalog")
        assert response.status_code == 200
        assert "etag" in response.headers
        assert response.headers["etag"].startswith('"')
        assert response.headers["etag"].endswith('"')

@pytest.mark.asyncio
async def test_catalog_cache_control():
    """Test that catalog endpoint returns Cache-Control header."""
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/catalog")
        assert response.status_code == 200
        assert "cache-control" in response.headers
        assert "max-age" in response.headers["cache-control"]

@pytest.mark.asyncio
async def test_catalog_etag_match_returns_304():
    """Test that matching ETag returns 304 Not Modified."""
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        # First request to get ETag
        response1 = await client.get("/catalog")
        assert response1.status_code == 200
        etag = response1.headers["etag"]
        
        # Second request with If-None-Match
        response2 = await client.get("/catalog", headers={"if-none-match": etag})
        assert response2.status_code == 304
        assert response2.headers["etag"] == etag
        assert len(response2.content) == 0

@pytest.mark.asyncio
async def test_catalog_etag_mismatch_returns_200():
    """Test that non-matching ETag returns 200 with content."""
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/catalog", headers={"if-none-match": '"invalid-etag"'})
        assert response.status_code == 200
        assert "etag" in response.headers
        assert response.json()["items"] is not None

@pytest.mark.asyncio
async def test_catalog_consistent_etag():
    """Test that ETag is consistent for same content."""
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        response1 = await client.get("/catalog")
        response2 = await client.get("/catalog")
        
        assert response1.headers["etag"] == response2.headers["etag"]

@pytest.mark.asyncio
async def test_catalog_cache_headers_on_304():
    """Test that cache headers are present on 304 response."""
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        response1 = await client.get("/catalog")
        etag = response1.headers["etag"]
        
        response2 = await client.get("/catalog", headers={"if-none-match": etag})
        assert response2.status_code == 304
        assert "cache-control" in response2.headers