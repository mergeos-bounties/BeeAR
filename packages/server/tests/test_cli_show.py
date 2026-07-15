from typer.testing import CliRunner

from beear.cli import app

runner = CliRunner()


def test_show_known_frame() -> None:
    """catalog show <known_id> returns table with frame details."""
    result = runner.invoke(app, ["catalog", "show", "aviator_gold"])
    assert result.exit_code == 0
    assert "SKU: aviator_gold" in result.output
    assert "Aviator Gold" in result.output
    assert "Fit (mm)" in result.output
    assert result.exit_code == 0


def test_show_known_frame_json() -> None:
    """catalog show --json returns raw dict."""
    result = runner.invoke(app, ["catalog", "show", "aviator_gold", "--json"])
    assert result.exit_code == 0
    assert "aviator_gold" in result.output
    assert "price_cents" in result.output


def test_show_missing_frame() -> None:
    """catalog show <missing_id> exits with code 1."""
    result = runner.invoke(app, ["catalog", "show", "nonexistent_sku"])
    assert result.exit_code == 1
    assert "not found" in result.output.lower()


def test_show_displays_fit_fields() -> None:
    """catalog show includes width_mm / bridge_mm / temple_mm in output."""
    result = runner.invoke(app, ["catalog", "show", "wayfarer_black"])
    assert result.exit_code == 0
    assert "Width" in result.output or "width" in result.output


def test_show_displays_price() -> None:
    """catalog show shows formatted price."""
    result = runner.invoke(app, ["catalog", "show", "round_tortoise"])
    assert result.exit_code == 0
    assert "$" in result.output
