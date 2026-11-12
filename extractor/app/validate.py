"""Strict evidence verification engine linking facts to source text and checking numeric consistency."""

import re
from typing import Tuple, Optional, List, Dict, Any
from app.schemas import (
    MedicalDocumentExtraction,
    UnverifiedItem,
    Evidence,
    ExtractionStats,
)


def _find_quote_offsets(quote: str, raw_text: str) -> Optional[Tuple[int, int]]:
    """Locate exact character start and end offsets of a quote in raw_text.

    Normalizes whitespace and case only, returning character offsets in original raw_text.
    """
    if not quote or not raw_text:
        return None

    # 1. Exact match attempt
    idx = raw_text.find(quote)
    if idx != -1:
        return idx, idx + len(quote)

    # 2. Case-insensitive exact match
    idx_lower = raw_text.lower().find(quote.lower())
    if idx_lower != -1:
        return idx_lower, idx_lower + len(quote)

    # 3. Whitespace-normalized regex search
    words = [re.escape(w) for w in quote.split() if w]
    if not words:
        return None

    pattern = r"\s+".join(words)
    match = re.search(pattern, raw_text, re.IGNORECASE)
    if match:
        return match.start(), match.end()

    return None


def _determine_page_from_offset(char_start: int, raw_text: str) -> int:
    """Determine 1-based page number based on standard '--- Page X ---' tags."""
    if char_start <= 0 or not raw_text:
        return 1

    preceding_text = raw_text[:char_start]
    page_markers = list(re.finditer(r"---\s*Page\s*(\d+)\s*---", preceding_text))
    if page_markers:
        last_marker = page_markers[-1]
        try:
            return int(last_marker.group(1))
        except (ValueError, IndexError):
            return 1
    return 1


def _check_numeric_presence(quote: str, item: Any, item_type: str) -> Tuple[bool, Optional[str]]:
    """Verify that any declared numeric values physically appear within the quote.

    Returns:
        (is_valid, failure_reason)
    """
    quote_clean = " ".join(quote.split())

    if item_type == "medication":
        dose_val = getattr(item, "dose_value", None)
        if dose_val:
            # Check if dose_val is present as a token or sub-token in quote
            if str(dose_val) not in quote_clean:
                return False, f"numeric_value_not_found: Medication dose value '{dose_val}' does not appear inside evidence quote '{quote}'"

    elif item_type == "lab_result":
        val_str = getattr(item, "value", "")
        if val_str:
            nums = re.findall(r"\d+(?:\.\d+)?", str(val_str))
            for n in nums:
                if n not in quote_clean:
                    return False, f"numeric_value_not_found: Lab result numeric value '{n}' does not appear inside evidence quote '{quote}'"

    elif item_type == "vital":
        val_str = getattr(item, "value", "")
        if val_str:
            nums = re.findall(r"\d+", str(val_str))
            for n in nums:
                if n not in quote_clean:
                    return False, f"numeric_value_not_found: Vital numeric value '{n}' does not appear inside evidence quote '{quote}'"

    return True, None


def validate_extraction(extraction: MedicalDocumentExtraction) -> MedicalDocumentExtraction:
    """Strictly verify every evidence quote against raw_text and verify numeric consistency.

    - Verified items remain in their primary lists with char_start, char_end, and page filled.
    - Unverifiable items are MOVED to top-level `unverified_items` with reason.
    - Updates `document.extraction_stats` (items_extracted, items_verified, items_unverified).
    """
    raw_text = extraction.raw_text or ""
    verified_count = 0
    unverified_count = 0

    collections = [
        ("medication", extraction.medications),
        ("condition", extraction.conditions),
        ("lab_result", extraction.lab_results),
        ("allergy", extraction.allergies.items),
        ("investigation", extraction.investigations),
        ("event", extraction.events),
        ("vital", extraction.vitals),
    ]

    for item_type, items_list in collections:
        valid_items = []
        for item in items_list:
            ev: Optional[Evidence] = getattr(item, "evidence", None)
            quote = ev.quote.strip() if ev and ev.quote else ""

            # Check 1: Quote presence in raw_text
            if not quote:
                extraction.unverified_items.append(
                    UnverifiedItem(
                        item_type=item_type,
                        reason="missing_evidence_quote",
                        raw_quote="",
                        item_data=item.model_dump(),
                    )
                )
                unverified_count += 1
                continue

            offsets = _find_quote_offsets(quote, raw_text)
            if offsets is None:
                extraction.unverified_items.append(
                    UnverifiedItem(
                        item_type=item_type,
                        reason="quote_not_found_in_raw_text",
                        raw_quote=quote,
                        item_data=item.model_dump(),
                    )
                )
                unverified_count += 1
                continue

            # Check 2: Numeric consistency within quote
            num_ok, num_err = _check_numeric_presence(quote, item, item_type)
            if not num_ok:
                extraction.unverified_items.append(
                    UnverifiedItem(
                        item_type=item_type,
                        reason=num_err or "numeric_value_not_found_in_quote",
                        raw_quote=quote,
                        item_data=item.model_dump(),
                    )
                )
                unverified_count += 1
                continue

            # Item is verified!
            char_start, char_end = offsets
            item.evidence.char_start = char_start
            item.evidence.char_end = char_end
            item.evidence.page = _determine_page_from_offset(char_start, raw_text)
            valid_items.append(item)
            verified_count += 1

        # Replace in-place with only verified items
        items_list.clear()
        items_list.extend(valid_items)

    # Date ambiguity checks
    if extraction.document.document_date:
        raw_d = extraction.document.document_date.raw
        m_num = re.search(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b", raw_d)
        if m_num:
            d_p, m_p = int(m_num.group(1)), int(m_num.group(2))
            if d_p <= 12 and m_p <= 12 and d_p != m_p:
                extraction.document.document_date.ambiguous = True

    # Record extraction stats
    pages_count = max(1, extraction.document.page_count)
    existing_timings = (
        extraction.document.extraction_stats.timings_ms
        if extraction.document and extraction.document.extraction_stats
        else {}
    )
    extraction.document.extraction_stats = ExtractionStats(
        items_extracted=verified_count + unverified_count,
        items_verified=verified_count,
        items_unverified=unverified_count,
        pages_processed=pages_count,
        timings_ms=existing_timings,
    )

    return extraction
