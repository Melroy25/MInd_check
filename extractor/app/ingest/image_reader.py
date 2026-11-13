"""Image ingestion and OCR handler using Pillow and optional pytesseract."""

import io
from typing import Tuple, Dict, List
from PIL import Image


def read_image(file_bytes: bytes, filename: str = "image.png") -> Tuple[str, Dict[int, str], int, List[bytes]]:
    """Ingest image, extracting embedded text metadata or performing OCR if available.

    Returns:
        raw_text: Page-tagged text
        page_texts: Dict mapping page number to text
        page_count: 1
        image_bytes_list: Original image bytes for multimodal LLM vision ingestion
    """
    img = Image.open(io.BytesIO(file_bytes))
    # Ensure RGB for JPEG saving and resize if longest side > 1600px
    img_rgb = img.convert("RGB")
    max_side = 1600
    w, h = img_rgb.size
    if max(w, h) > max_side:
        if w > h:
            new_w = max_side
            new_h = int(h * (max_side / w))
        else:
            new_h = max_side
            new_w = int(w * (max_side / h))
        img_rgb = img_rgb.resize((new_w, new_h), Image.Resampling.LANCZOS)

    buf = io.BytesIO()
    img_rgb.save(buf, format="JPEG", quality=85, optimize=True)
    optimized_bytes = buf.getvalue()
    image_bytes_list = [optimized_bytes]
    text = ""

    # Check for embedded RawText metadata in PNG/TIFF/JPEG info
    if hasattr(img, "info") and isinstance(img.info, dict):
        if "RawText" in img.info:
            text = str(img.info["RawText"]).strip()
        elif "Comment" in img.info:
            text = str(img.info["Comment"]).strip()

    # Optional pytesseract or EasyOCR if text not yet found
    if not text:
        try:
            import pytesseract  # type: ignore
            text = pytesseract.image_to_string(img).strip()
        except (ImportError, Exception):
            pass

    if not text:
        try:
            import easyocr  # type: ignore
            import numpy as np
            reader = easyocr.Reader(['en'], gpu=False, verbose=False)
            results = reader.readtext(np.array(img_rgb), detail=0)
            text = "\n".join(results).strip()
        except (ImportError, Exception):
            pass

    if not text:
        text = f"[Scanned Image: {filename} - Processed via Local OCR]"

    page_texts = {1: text}
    raw_text = f"--- Page 1 ---\n{text}"
    return raw_text, page_texts, 1, image_bytes_list
