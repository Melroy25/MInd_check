"""Structured typed application errors with error codes, messages, and actionable hints."""

from typing import Dict, Any


class AppException(Exception):
    """Base structured exception for medical JSON extractor."""

    def __init__(
        self,
        error_code: str,
        message: str,
        hint: str,
        status_code: int = 400,
    ):
        super().__init__(message)
        self.error_code = error_code
        self.message = message
        self.hint = hint
        self.status_code = status_code

    def to_dict(self) -> Dict[str, str]:
        return {
            "error_code": self.error_code,
            "message": self.message,
            "hint": self.hint,
        }


class GeminiKeyMissingError(AppException):
    def __init__(self, message: str = "GEMINI_API_KEY environment variable is missing or empty."):
        super().__init__(
            error_code="gemini_key_missing",
            message=message,
            hint="Set a valid GEMINI_API_KEY in your .env file or host environment variables.",
            status_code=503,
        )


class GeminiKeyInvalidError(AppException):
    def __init__(self, message: str = "The provided GEMINI_API_KEY was rejected by Google GenAI."):
        super().__init__(
            error_code="gemini_key_invalid",
            message=message,
            hint="Verify your Gemini API key in Google AI Studio and update your .env file.",
            status_code=401,
        )


class GeminiModelUnavailableError(AppException):
    def __init__(self, model_name: str, message: str = ""):
        super().__init__(
            error_code="gemini_model_unavailable",
            message=message or f"Configured Gemini model '{model_name}' is not available for this API key.",
            hint="Check GEMINI_MODEL in your .env file (e.g., gemini-2.5-flash or gemini-1.5-flash).",
            status_code=503,
        )


class GeminiRateLimitedError(AppException):
    def __init__(self, message: str = "Gemini API rate limit or quota exceeded after retries."):
        super().__init__(
            error_code="gemini_rate_limited",
            message=message,
            hint="Wait a moment before retrying or review your Google AI Studio quota tier.",
            status_code=429,
        )


class GeminiUnreachableError(AppException):
    def __init__(self, message: str = "Unable to connect to Google Gemini service after retries."):
        super().__init__(
            error_code="gemini_unreachable",
            message=message,
            hint="Check your internet connection, proxy settings, or Google Cloud service status.",
            status_code=503,
        )


class ExtractionInvalidOutputError(AppException):
    def __init__(self, message: str = "Gemini output failed schema validation after retries."):
        super().__init__(
            error_code="extraction_invalid_output",
            message=message,
            hint="The document structure produced invalid JSON that could not be validated. Try again or check the document format.",
            status_code=422,
        )


class DocumentUnreadableError(AppException):
    def __init__(self, message: str = "Document is corrupt, password-protected, blank, or completely illegible."):
        super().__init__(
            error_code="document_unreadable",
            message=message,
            hint="Ensure the document is a supported format, unencrypted, and contains readable clinical text or clear images.",
            status_code=422,
        )


class GeminiBlockedError(AppException):
    def __init__(self, reason: str = "Content blocked by safety policy."):
        super().__init__(
            error_code="gemini_blocked",
            message=f"Gemini safety filter blocked the document: {reason}",
            hint="Review document content against Google generative AI content policies.",
            status_code=400,
        )


class ExtractionTimeoutError(AppException):
    def __init__(self, message: str = "Extraction exceeded hard time limit of 90 seconds."):
        super().__init__(
            error_code="timeout",
            message=message,
            hint="The document processing timed out after 90 seconds. Try uploading a smaller document or text excerpt.",
            status_code=504,
        )
