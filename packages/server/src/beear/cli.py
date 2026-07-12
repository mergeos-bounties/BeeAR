from __future__ import annotations

import typer
from rich import print as rprint
from rich.console import Console
from rich.table import Table

from beear import __version__
from beear.catalog import get_frame, list_frames
from beear.tryon import estimate_fit, landmark_box

app = typer.Typer(help="BeeAR — virtual try-on CLI", no_args_is_help=True)
catalog_app = typer.Typer(help="Frame catalog")
app.add_typer(catalog_app, name="catalog")
console = Console()


@app.command("version")
def version_cmd() -> None:
    rprint({"version": __version__})


@app.command("demo")
def demo_cmd() -> None:
    frames = list_frames()
    rprint({"frames": len(frames), "ids": [f["id"] for f in frames]})
    sample = frames[0]
    fit = estimate_fit(sample, pupil_distance_px=118)
    box = landmark_box()
    rprint({"sample": sample["id"], "fit": fit, "landmarks": box})
    rprint("BeeAR demo complete (offline catalog + fit).")


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
