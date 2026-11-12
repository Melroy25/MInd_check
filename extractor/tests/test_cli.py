"""CLI command tests for Gemini medical extraction."""

import sys
import subprocess
from app.config import BASE_DIR


def test_cli_help():
    """Verify CLI help display."""
    cmd = [sys.executable, "-m", "app.cli", "--help"]
    res = subprocess.run(cmd, capture_output=True, text=True, cwd=str(BASE_DIR))
    assert res.returncode == 0
    assert "extract" in res.stdout
    assert "batch" in res.stdout


def test_cli_subcommand_options():
    """Verify subcommands support --out and delete command exists."""
    for sub in ["extract", "extract-text", "batch"]:
        cmd = [sys.executable, "-m", "app.cli", sub, "--help"]
        res = subprocess.run(cmd, capture_output=True, text=True, cwd=str(BASE_DIR))
        assert res.returncode == 0
        assert "--out" in res.stdout

    # Verify delete subcommand
    cmd = [sys.executable, "-m", "app.cli", "delete", "--help"]
    res = subprocess.run(cmd, capture_output=True, text=True, cwd=str(BASE_DIR))
    assert res.returncode == 0
    assert "document_id" in res.stdout
