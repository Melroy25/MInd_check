"""Base class interface for LLM extraction providers."""

from abc import ABC, abstractmethod
from app.ingest.router import IngestionResult
from app.schemas import MedicalDocumentExtraction


class LLMProvider(ABC):
    """Abstract provider for extracting structured medical data from ingested documents."""

    @abstractmethod
    def extract(self, ingestion: IngestionResult) -> MedicalDocumentExtraction:
        """Extract structured medical information from the ingested document.

        Args:
            ingestion: IngestionResult containing raw_text, page_texts, metadata, and images.

        Returns:
            MedicalDocumentExtraction: Fully populated, structured, and verified extraction.
        """
        pass
