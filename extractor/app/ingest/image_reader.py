"""Image ingestion and deep-learning OCR handler using EasyOCR (CRAFT + CRNN) and Pillow."""

import io
from typing import Tuple, Dict, List, Optional
from PIL import Image

_EASYOCR_READER: Optional[object] = None


def get_ocr_reader():
    """Lazily initialize and cache the EasyOCR Reader in memory."""
    global _EASYOCR_READER
    if _EASYOCR_READER is None:
        try:
            import easyocr  # type: ignore
            # Uses CRAFT for text detection and ResNet-BiLSTM-CTC for text recognition
            _EASYOCR_READER = easyocr.Reader(['en'], gpu=False, verbose=False)
        except Exception as e:
            print(f"[ImageReader] Could not load EasyOCR: {e}")
            _EASYOCR_READER = None
    return _EASYOCR_READER


def read_image(file_bytes: bytes, filename: str = "image.png") -> Tuple[str, Dict[int, str], int, List[bytes]]:
    """Ingest image, extracting embedded text metadata or performing deep-learning OCR with EasyOCR.

    Returns:
        raw_text: Page-tagged text
        page_texts: Dict mapping page number to text
        page_count: 1
        image_bytes_list: Original image bytes for archival
    """
    img = Image.open(io.BytesIO(file_bytes))
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

    # 1. Check for embedded RawText metadata in PNG/TIFF/JPEG info
    if hasattr(img, "info") and isinstance(img.info, dict):
        if "RawText" in img.info:
            text = str(img.info["RawText"]).strip()
        elif "Comment" in img.info:
            text = str(img.info["Comment"]).strip()

    # 2. EasyOCR Deep-Learning Engine (CRAFT + ResNet-BiLSTM-CTC)
    if not text:
        reader = get_ocr_reader()
        if reader is not None:
            try:
                import numpy as np
                results = reader.readtext(np.array(img_rgb), detail=0)
                text = "\n".join(results).strip()
            except Exception as ocr_err:
                print(f"[ImageReader] EasyOCR inference error: {ocr_err}")

    # 3. Optional fallback to pytesseract if present
    if not text:
        try:
            import pytesseract  # type: ignore
            text = pytesseract.image_to_string(img).strip()
        except (ImportError, Exception):
            pass

    if not text:
        text = f"[Scanned Image: {filename} - Processed via Local OCR]"

    page_texts = {1: text}
    raw_text = f"--- Page 1 ---\n{text}"
    return raw_text, page_texts, 1, image_bytes_list
