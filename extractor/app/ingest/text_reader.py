"""Raw text ingestion."""

from typing import Tuple, Dict


def read_text(text: str) -> Tuple[str, Dict[int, str], int]:
    """Format raw text with standard page tagging.

    Returns:
        raw_text: Page-tagged text
        page_texts: Dict mapping page number (1) to text
        page_count: 1
    """
    cleaned = text.strip()
    # If the text already has page markers, keep them; otherwise wrap
    if "--- Page " in cleaned:
        raw_text = cleaned
        # Parse existing pages
        parts = cleaned.split("--- Page ")
        page_texts = {}
        for p in parts:
            if not p.strip():
                continue
            lines = p.split("\n", 1)
            try:
                page_num = int(lines[0].split("---")[0].strip())
                page_texts[page_num] = lines[1].strip() if len(lines) > 1 else ""
            except (ValueError, IndexError):
                pass
        page_count = max(page_texts.keys()) if page_texts else 1
    else:
        page_count = 1
        page_texts = {1: cleaned}
        raw_text = f"--- Page 1 ---\n{cleaned}"

    return raw_text, page_texts, page_count
