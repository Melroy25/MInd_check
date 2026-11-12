"""Ingest package for parsing multiple document formats."""

from app.ingest.router import ingest_file, ingest_text, IngestionResult

__all__ = ["ingest_file", "ingest_text", "IngestionResult"]
