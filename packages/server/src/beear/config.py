from __future__ import annotations

from pathlib import Path

SERVER_ROOT = Path(__file__).resolve().parents[2]
PACKAGES = SERVER_ROOT.parent
REPO_ROOT = PACKAGES.parent
CATALOG_DIR = PACKAGES / "catalog"
WEB_ROOT = PACKAGES / "web"
FRAMES_JSON = CATALOG_DIR / "frames.json"
SVG_DIR = CATALOG_DIR / "svg"
