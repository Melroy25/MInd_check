"""PDF text extraction and page rendering using PyMuPDF (fitz)."""

from typing import Tuple, List, Dict
import fitz  # PyMuPDF


def read_pdf(file_bytes: bytes) -> Tuple[str, Dict[int, str], int, bool, List[bytes]]:
    """Extract page-tagged text, detect if scanned, and render page images if needed.

    Returns:
        raw_text: Full page-tagged extracted text
        page_texts: Dict mapping page number (1-based) to extracted text
        page_count: Total number of pages
        is_scanned: True if minimal/no text layer is present
        image_bytes_list: List of PNG image bytes rendered per page
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    page_count = len(doc)
    page_texts: Dict[int, str] = {}
    rendered_images: List[bytes] = []

    total_chars = 0
    raw_text_parts: List[str] = []

    for i in range(page_count):
        page_num = i + 1
        page = doc.load_page(i)
        text = page.get_text("text").strip()
        page_texts[page_num] = text
        total_chars += len(text)

        raw_text_parts.append(f"--- Page {page_num} ---\n{text}")

    # Determine if document lacks digital text layer (scanned)
    avg_chars_per_page = total_chars / max(1, page_count)
    is_scanned = avg_chars_per_page < 30

    # If scanned, render pages as PNG pixmaps for vision extraction
    if is_scanned:
        for i in range(page_count):
            page = doc.load_page(i)
            pix = page.get_pixmap(dpi=150)
            rendered_images.append(pix.tobytes("png"))

    raw_text = "\n\n".join(raw_text_parts)
    return raw_text, page_texts, page_count, is_scanned, rendered_images
