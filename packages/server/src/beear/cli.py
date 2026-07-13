from __future__ import annotations

from pathlib import Path

import typer
from rich import print as rprint
from rich.console import Console
from rich.table import Table

from beear import __version__
from beear.catalog import get_frame, list_frames, search_frames
from beear.tryon import compare_frames, estimate_fit, landmark_box

app = typer.Typer(help="BeeAR — virtual try-on CLI", no_args_is_help=True)
catalog_app = typer.Typer(help="Frame catalog")
tryon_app = typer.Typer(help="Try-on helpers")
app.add_typer(catalog_app, name="catalog")
app.add_typer(tryon_app, name="tryon")
console = Console()


@app.command("version")
def version_cmd() -> None:
    rprint({"version": __version__})


@app.command("demo")
def demo_cmd() -> None:
    from beear.catalog import list_person_models, load_catalog

    cat = load_catalog()
    frames = list_frames()
    people = list_person_models()
    glb_frames = [f for f in frames if f.get("has_glb")]
    rprint(
        {
            "frames": len(frames),
            "glb_frames": len(glb_frames),
            "person_models": [
                {"id": p.get("id"), "has_glb": p.get("has_glb"), "glb": p.get("glb")}
                for p in people
            ],
            "studio3d": "/studio3d.html",
            "ids": [f["id"] for f in frames[:12]],
        }
    )
    sample = frames[0]
    fit = estimate_fit(sample, pupil_distance_px=118, pd_mm=64)
    fit_wide = estimate_fit(sample, pupil_distance_px=118, pd_mm=70)
    box = landmark_box()
    other = frames[1] if len(frames) > 1 else sample
    cmp = compare_frames(sample, other, pupil_distance_px=118, pd_mm=64)
    rprint({"sample": sample["id"], "fit_pd64": fit, "fit_pd70": fit_wide, "landmarks": box})
    rprint({"compare": cmp})
    rprint(
        {
            "catalog_version": cat.get("version"),
            "glb_count": cat.get("glb_count"),
            "person_count": cat.get("person_count"),
        }
    )
    rprint("BeeAR demo complete (catalog + PD fit + compare + 3D person/GLB).")






@catalog_app.command("count")
def count_cmd() -> None:
    """Show frame / GLB / person counts from the offline catalog."""
    from beear.catalog import list_person_models, load_catalog

    cat = load_catalog()
    frames = list_frames()
    people = list_person_models()
    glb = sum(1 for f in frames if f.get("has_glb"))
    featured = sum(1 for f in frames if f.get("featured"))
    rprint(
        {
            "frames": len(frames),
            "glb_frames": glb,
            "featured": featured,
            "persons": len(people),
            "catalog_version": cat.get("version"),
        }
    )

@catalog_app.command("search")
def search_cmd(
    query: str = typer.Argument(..., help="Substring over id/name/brand/style"),
    limit: int = typer.Option(10, "--limit", "-n"),
) -> None:
    """Search catalog frames offline (id, name, brand, style, category)."""
    hits = search_frames(query, limit=limit)
    table = Table(title=f"Search: {query}")
    table.add_column("id")
    table.add_column("name")
    table.add_column("style")
    table.add_column("glb")
    for f in hits:
        table.add_row(
            str(f.get("id") or ""),
            str(f.get("name") or ""),
            str(f.get("style") or ""),
            "yes" if f.get("has_glb") else "no",
        )
    rprint(table)
    rprint({"count": len(hits), "query": query})

@catalog_app.command("list")
def catalog_list(
    category: str | None = typer.Option(None, "--category", "-c"),
) -> None:
    table = Table(title="BeeAR catalog")
    table.add_column("Id")
    table.add_column("Name")
    table.add_column("Category")
    table.add_column("Style")
    table.add_column("Price")
    for f in list_frames(category=category):
        table.add_row(
            f["id"],
            f["name"],
            f.get("category", ""),
            f.get("style", ""),
            f"${(f.get('price_cents') or 0) / 100:.2f}",
        )
    console.print(table)


@catalog_app.command("show")
def catalog_show(frame_id: str = typer.Argument(...)) -> None:
    f = get_frame(frame_id)
    if not f:
        raise typer.Exit(code=1)
    rprint(f)


@catalog_app.command("search")
def catalog_search(
    query: str = typer.Argument(...),
    limit: int = typer.Option(20, "--limit", "-n"),
) -> None:
    """Search catalog by id/name/brand/style."""
    from beear.catalog import search_frames

    hits = search_frames(query, limit=limit)
    table = Table(title=f"Search “{query}” ({len(hits)})")
    table.add_column("Id")
    table.add_column("Name")
    table.add_column("Style")
    for f in hits:
        table.add_row(f["id"], f["name"], str(f.get("style") or ""))
    console.print(table)


@tryon_app.command("fit")
def tryon_fit(
    frame_id: str = typer.Argument(...),
    pd_mm: float = typer.Option(64.0, "--pd"),
    pupil_px: float = typer.Option(120.0, "--pupil-px"),
) -> None:
    f = get_frame(frame_id)
    if not f:
        raise typer.Exit(1)
    rprint(estimate_fit(f, pupil_distance_px=pupil_px, pd_mm=pd_mm))


@tryon_app.command("compare")
def tryon_compare(
    frame_a: str = typer.Argument(...),
    frame_b: str = typer.Argument(...),
    pd_mm: float = typer.Option(64.0, "--pd"),
) -> None:
    a, b = get_frame(frame_a), get_frame(frame_b)
    if not a or not b:
        raise typer.Exit(1)
    rprint(compare_frames(a, b, pd_mm=pd_mm))


@tryon_app.command("glb")
def tryon_glb(frame_id: str = typer.Argument(...)) -> None:
    """Show GLB 3D asset metadata for a frame (if catalog lists a mesh)."""
    from beear.tryon import frame_glb_info

    f = get_frame(frame_id)
    if not f:
        raise typer.Exit(1)
    rprint(frame_glb_info(f))


@app.command("wishlist")
def wishlist_cmd(
    frame_ids: str = typer.Option("aviator_gold,wayfarer_black", "--frames", "-f"),
    note: str = typer.Option("demo wishlist", "--note"),
    out: Path | None = typer.Option(None, "--out", "-o"),
) -> None:
    """Create a session wishlist and export JSON (privacy-safe frame ids only)."""
    import json

    from beear.sessions import add_wishlist, create_session, get_session

    ids = [x.strip() for x in frame_ids.split(",") if x.strip()]
    session = create_session(frame_ids=ids, note=note)
    for fid in ids:
        add_wishlist(session["id"], fid)
    row = get_session(session["id"]) or session
    export = {
        "session_id": row["id"],
        "wishlist": row.get("wishlist") or [],
        "note": row.get("note") or "",
        "privacy": "no face images stored — frame ids only",
    }
    path = out or Path("data/out/wishlist_export.json")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(export, indent=2) + "\n", encoding="utf-8")
    rprint({"export": str(path), **export})


@app.command("serve")
def serve_cmd(
    host: str = typer.Option("127.0.0.1", "--host"),
    port: int = typer.Option(8860, "--port"),
) -> None:
    import uvicorn
    from beear.api import app as fastapi_app

    rprint(f"BeeAR → http://{host}:{port}")
    uvicorn.run(fastapi_app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    app()

