"""DOCX reader for paragraphs and tables using python-docx."""

import io
from typing import Tuple, Dict, List
import docx


def read_docx(file_bytes: bytes) -> Tuple[str, Dict[int, str], int]:
    """Extract text from DOCX paragraphs and tables.

    Returns:
        raw_text: Page-tagged text
        page_texts: Dict mapping page number (1-based) to text
        page_count: Estimated page count (1 for single-stream DOCX)
    """
    doc = docx.Document(io.BytesIO(file_bytes))
    lines: List[str] = []

    # Iterate through body elements in document order
    for elem in doc.element.body:
        tag = elem.tag.split("}")[-1] if "}" in elem.tag else elem.tag
        if tag == "p":
            p = docx.text.paragraph.Paragraph(elem, doc)
            text = p.text.strip()
            if text:
                lines.append(text)
        elif tag == "tbl":
            table = docx.table.Table(elem, doc)
            table_lines: List[str] = []
            for row in table.rows:
                cells = [c.text.strip().replace("\n", " ") for c in row.cells]
                # Filter out adjacent duplicate cells resulting from merges
                deduped = []
                for c in cells:
                    if not deduped or c != deduped[-1]:
                        deduped.append(c)
                if any(deduped):
                    table_lines.append(" | ".join(deduped))
            if table_lines:
                lines.append("\n".join(table_lines))

    page_text = "\n".join(lines).strip()
    page_count = 1
    page_texts = {1: page_text}
    raw_text = f"--- Page 1 ---\n{page_text}"

    return raw_text, page_texts, page_count
