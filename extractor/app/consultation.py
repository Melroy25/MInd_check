"""FastAPI router for AI Consultation Assistant.

Provides:
1. POST /consultation/transcribe - In-memory Groq Whisper STT with 4-key rotation & zero storage.
2. POST /consultation/suggest - Structured medicine suggestions & clinical reasoning with doctor preference prioritization.
3. GET /consultation/preferred-medicines - Fetch doctor's preferred medicines.
4. POST /consultation/preferred-medicines - Add or increment doctor preferred medicine.
5. DELETE /consultation/preferred-medicines/{med_id} - Remove preferred medicine.
"""

import os
import time
import json
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv

router = APIRouter(prefix="/consultation", tags=["AI Consultation Assistant"])

# Project root directory for reading .env.local
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=ROOT_DIR / ".env.local", override=True)
load_dotenv(dotenv_path=ROOT_DIR / ".env", override=True)

# Cooldown tracking for 4-key rotation pool
_key_cooldowns: Dict[str, float] = {}
_last_working_index: int = 0


def get_groq_keys() -> List[str]:
    """Retrieve up to 4 Groq API keys from environment or .env.local."""
    load_dotenv(dotenv_path=ROOT_DIR / ".env.local", override=True)
    load_dotenv(dotenv_path=ROOT_DIR / ".env", override=True)

    keys = []
    for i in range(1, 5):
        k = os.getenv(f"EXPO_PUBLIC_GROK_API_KEY_{i}") or os.getenv(f"GROK_API_KEY_{i}") or os.getenv(f"GROQ_API_KEY_{i}")
        if k and k.strip():
            keys.append(k.strip())

    # Fallback to single key if pool not configured
    if not keys:
        single = os.getenv("EXPO_PUBLIC_GROK_API_KEY") or os.getenv("GROK_API_KEY") or os.getenv("GROQ_API_KEY")
        if single and single.strip():
            keys.append(single.strip())

    return list(dict.fromkeys(keys))


def is_on_cooldown(key: str) -> bool:
    expiry = _key_cooldowns.get(key, 0.0)
    return time.time() < expiry


def set_cooldown(key: str, seconds: float = 60.0):
    _key_cooldowns[key] = time.time() + seconds


class SuggestionRequest(BaseModel):
    transcript: str
    doctor_id: Optional[str] = "default_doctor"
    preferred_medicines: Optional[List[Dict[str, Any]]] = None


class PreferredMedItem(BaseModel):
    doctor_id: str
    name: str
    strength: Optional[str] = None
    form: Optional[str] = "tablet"
    usual_dosage: Optional[str] = None
    usual_frequency: Optional[str] = None
    usual_timing: Optional[str] = "after food"
    condition_tags: Optional[List[str]] = None
    notes: Optional[str] = None
    usage_count: Optional[int] = 1


@router.post("/transcribe")
async def transcribe_audio_chunk(
    file: UploadFile = File(...),
):
    """Transcribe an in-memory audio chunk via Groq Whisper with 4-key rotation.

    STRICT PRIVACY:
    Audio is processed directly in memory buffer and immediately discarded.
    Zero audio bytes are stored on disk or logged.
    """
    keys = get_groq_keys()
    if not keys:
        raise HTTPException(
            status_code=500,
            detail="No Groq API keys configured. Please define EXPO_PUBLIC_GROK_API_KEY_1 in .env.local",
        )

    # Read audio into memory buffer
    audio_bytes = await file.read()
    if len(audio_bytes) < 500:
        return {"text": "", "segments": []}

    global _last_working_index
    total_keys = len(keys)
    attempts = 0
    idx = _last_working_index % total_keys

    async with httpx.AsyncClient(timeout=30.0) as client:
        while attempts < total_keys:
            key = keys[idx]
            if is_on_cooldown(key):
                idx = (idx + 1) % total_keys
                attempts += 1
                continue

            try:
                files = {
                    "file": ("consultation_chunk.webm", audio_bytes, file.content_type or "audio/webm"),
                }
                data = {
                    "model": os.getenv("EXPO_PUBLIC_GROK_WHISPER_MODEL", "whisper-large-v3-turbo"),
                    "response_format": "verbose_json",
                    "prompt": "Doctor and patient consultation discussing medical symptoms, history, and medications.",
                }
                headers = {"Authorization": f"Bearer {key}"}

                response = await client.post(
                    "https://api.groq.com/openai/v1/audio/transcriptions",
                    headers=headers,
                    data=data,
                    files=files,
                )

                if response.status_code in (429, 500, 503):
                    set_cooldown(key, 60.0)
                    idx = (idx + 1) % total_keys
                    attempts += 1
                    continue

                if response.status_code == 401:
                    set_cooldown(key, 3600.0)
                    idx = (idx + 1) % total_keys
                    attempts += 1
                    continue

                if not response.is_success:
                    err_msg = response.text
                    raise HTTPException(status_code=response.status_code, detail=f"Whisper STT failed: {err_msg}")

                result = response.json()
                _last_working_index = idx
                # Explicitly discard audio buffer from memory
                del audio_bytes
                return {
                    "text": result.get("text", "").strip(),
                    "segments": result.get("segments", []),
                    "duration": result.get("duration", 0),
                }

            except httpx.RequestError as exc:
                set_cooldown(key, 30.0)
                idx = (idx + 1) % total_keys
                attempts += 1

    raise HTTPException(status_code=429, detail="All configured Groq API keys are currently rate-limited.")


@router.post("/suggest")
async def generate_medicine_suggestions(payload: SuggestionRequest):
    """Generate structured medicine suggestions with doctor preferred medicines context."""
    keys = get_groq_keys()
    if not keys:
        raise HTTPException(
            status_code=500,
            detail="No Groq API keys configured. Please define EXPO_PUBLIC_GROK_API_KEY_1 in .env.local",
        )

    if not payload.transcript or len(payload.transcript.strip()) < 10:
        return {
            "symptoms": [],
            "probable_diagnosis": [],
            "allergies": [],
            "current_medications": [],
            "suggested_medicines": [],
            "missing_information": "Listening for consultation details...",
        }

    # Format doctor preferred medicines summary
    pref_summary = "None specified"
    if payload.preferred_medicines:
        pref_summary = "\n".join([
            f"- {m.get('name')} {m.get('strength', '')} ({m.get('form', 'tablet')}): usual {m.get('usual_dosage', '')}, for {m.get('condition_tags', [])} (prescribed {m.get('usage_count', 1)}x)"
            for m in payload.preferred_medicines[:10]
        ])

    system_prompt = """You are a clinical decision-support assistant for a licensed doctor.
Based on the consultation transcript and the doctor's preferred medicines, suggest appropriate medicines with reasoning.
Flag allergies, interactions, and uncertainty.
Never present output as a final diagnosis.
If information is insufficient, say so and state what is missing instead of guessing.

Return strictly a valid JSON object matching this schema:
{
  "symptoms": ["string"],
  "probable_diagnosis": ["string (labeled possible)"],
  "allergies": ["string"],
  "current_medications": ["string"],
  "missing_information": "string or null",
  "suggested_medicines": [
    {
      "name": "string (Generic + Brand)",
      "dosage": "string (e.g. 500mg)",
      "frequency": "string (e.g. 1 tab twice daily)",
      "duration": "string (e.g. 5 days)",
      "timing": "string (e.g. after food)",
      "why": "string (reason tied to symptoms mentioned)",
      "advantages": "string (key clinical benefits)",
      "disadvantages": "string (side effects, contraindications, drug interactions)",
      "warnings": "string (allergies or conditions from transcript that conflict, or 'None detected')",
      "is_preferred": true
    }
  ]
}"""

    user_prompt = f"""DOCTOR'S PREFERRED MEDICINES (Prioritize these if clinically indicated for the symptoms):
{pref_summary}

CONSULTATION TRANSCRIPT:
{payload.transcript}

Analyze this live consultation and provide structured medicine suggestions, clinical rationale, contraindication warnings, and extracted facts. Return ONLY the JSON object."""

    global _last_working_index
    total_keys = len(keys)
    attempts = 0
    idx = _last_working_index % total_keys

    async with httpx.AsyncClient(timeout=30.0) as client:
        while attempts < total_keys:
            key = keys[idx]
            if is_on_cooldown(key):
                idx = (idx + 1) % total_keys
                attempts += 1
                continue

            try:
                body = {
                    "model": os.getenv("EXPO_PUBLIC_GROK_MODEL", "openai/gpt-oss-120b"),
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.1,
                    "response_format": {"type": "json_object"},
                }
                headers = {
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                }

                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=body,
                )

                if response.status_code in (429, 500, 503):
                    set_cooldown(key, 60.0)
                    idx = (idx + 1) % total_keys
                    attempts += 1
                    continue

                if response.status_code == 401:
                    set_cooldown(key, 3600.0)
                    idx = (idx + 1) % total_keys
                    attempts += 1
                    continue

                if not response.is_success:
                    err_msg = response.text
                    raise HTTPException(status_code=response.status_code, detail=f"Groq API Error: {err_msg}")

                data = response.json()
                _last_working_index = idx
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content) if isinstance(content, str) else content
                return parsed

            except httpx.RequestError:
                set_cooldown(key, 30.0)
                idx = (idx + 1) % total_keys
                attempts += 1

    raise HTTPException(status_code=429, detail="All configured Groq API keys are currently rate-limited.")
