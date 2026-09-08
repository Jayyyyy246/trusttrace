"""
TRUSTTRACE Ingestion & Malware Scanning Service
Handles multi-modal file ingestion, dual cryptographic hashing (SHA-256 + SHA-3-256),
strict magic byte validation, and sandboxed quarantine storage.
"""

from __future__ import annotations

import os
import io
import time
import uuid
import hashlib
import logging
from enum import Enum
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
from pydantic import BaseModel, Field

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("trusttrace.ingest")

# Known Magic Byte Signatures
MAGIC_SIGNATURES: Dict[str, Tuple[bytes, ...]] = {
    "image/jpeg": (b"\xFF\xD8\xFF",),
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "image/webp": (b"RIFF",),  # Sub-verified with 'WEBP' at offset 8
    "application/pdf": (b"%PDF-",),
    "image/tiff": (b"II*\x00", b"MM\x00*"),
    "image/heic": (b"ftypheic", b"ftypmif1", b"ftypmsf1", b"ftyphevc"),
}

# Suspicious Script / Exploit Signatures in non-executable files
SUSPICIOUS_PAYLOAD_PATTERNS = [
    b"<script",
    b"javascript:",
    b"/JavaScript",
    b"/Launch",
    b"/EmbeddedFiles",
    b"/OpenAction",
    b"/SubmitForm",
    b"<?php",
    b"eval(",
    b"powershell",
    b"\x7fELF",  # Embedded ELF binary
    b"MZ\x90\x00",  # Embedded Windows PE binary
]

DEFAULT_QUARANTINE_DIR = Path(os.getenv("QUARANTINE_DIR", "/tmp/trusttrace_quarantine"))
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE_BYTES", 52_428_800))  # 50 MB


class IngestionStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    QUARANTINED = "QUARANTINED"
    FAILED = "FAILED"


class FileMetadata(BaseModel):
    job_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    original_filename: str
    detected_mime_type: str
    declared_mime_type: Optional[str] = None
    file_size_bytes: int
    sha256_hash: str
    sha3_256_hash: str
    quarantine_path: str
    ingestion_timestamp: float = Field(default_factory=time.time)
    quarantine_status: IngestionStatus = IngestionStatus.ACCEPTED
    security_flags: list[str] = Field(default_factory=list)


class IngestionError(Exception):
    """Base exception for file ingestion failure."""
    pass


class MagicByteMismatchError(IngestionError):
    """File contents do not match declared or accepted MIME type."""
    pass


class MaliciousPayloadDetectedError(IngestionError):
    """Malicious binary signatures or active scripts detected in payload."""
    pass


class IngestionService:
    """Production-grade ingestion, hashing, and quarantine isolation manager."""

    def __init__(self, quarantine_base_dir: Optional[Path] = None):
        self.quarantine_dir = quarantine_base_dir or DEFAULT_QUARANTINE_DIR
        self.quarantine_dir.mkdir(parents=True, exist_ok=True)
        # Apply restrictive directory permissions (rwx------)
        try:
            self.quarantine_dir.chmod(0o700)
        except Exception as e:
            logger.warning(f"Could not enforce strict 0700 permissions on {self.quarantine_dir}: {e}")

    @staticmethod
    def detect_mime_type(header_bytes: bytes) -> Optional[str]:
        """
        Validates the true MIME type using exact magic byte signatures.
        Prevents extension-spoofing attacks (e.g. .jpg actually containing an .exe).
        """
        if len(header_bytes) < 4:
            return None

        for mime_type, signatures in MAGIC_SIGNATURES.items():
            for sig in signatures:
                if header_bytes.startswith(sig):
                    if mime_type == "image/webp":
                        # Verify 'WEBP' at offset 8
                        if len(header_bytes) >= 12 and header_bytes[8:12] == b"WEBP":
                            return mime_type
                        continue
                    return mime_type

            # Check for HEIC offset signature
            if mime_type == "image/heic" and len(header_bytes) >= 12:
                for sig in signatures:
                    if header_bytes[4:12] == sig or header_bytes[4:8] == b"ftyp":
                        return mime_type

        return None

    @staticmethod
    def compute_dual_hashes(file_bytes: bytes) -> Tuple[str, str]:
        """
        Computes SHA-256 and SHA-3-256 digests synchronously across the raw bytes.
        Returns hex digests as a tuple (sha256, sha3_256).
        """
        sha256 = hashlib.sha256()
        sha3 = hashlib.sha3_256()

        chunk_size = 65536
        stream = io.BytesIO(file_bytes)
        while chunk := stream.read(chunk_size):
            sha256.update(chunk)
            sha3.update(chunk)

        return sha256.hexdigest(), sha3.hexdigest()

    @staticmethod
    def scan_for_malicious_content(file_bytes: bytes, mime_type: str) -> list[str]:
        """
        Scans raw buffer for dangerous embedded payloads, executable headers,
        and high-risk macros in static documents and images.
        """
        flags: list[str] = []

        # Check for binary executable signatures
        if b"MZ\x90\x00" in file_bytes[:1024]:
            flags.append("EMBEDDED_PE_EXECUTABLE_HEADER")
        if b"\x7fELF" in file_bytes[:1024]:
            flags.append("EMBEDDED_ELF_BINARY_HEADER")

        # Check for active code injections in PDFs or images
        for pattern in SUSPICIOUS_PAYLOAD_PATTERNS:
            if pattern in file_bytes:
                flags.append(f"SUSPICIOUS_PAYLOAD_TOKEN:{pattern.decode('latin-1', errors='ignore')}")

        # PDF Specific heuristics
        if mime_type == "application/pdf":
            if b"/JavaScript" in file_bytes or b"/JS" in file_bytes:
                flags.append("PDF_CONTAINS_EMBEDDED_JAVASCRIPT")
            if b"/Launch" in file_bytes:
                flags.append("PDF_CONTAINS_EXTERNAL_LAUNCH_ACTION")

        return flags

    def ingest(
        self,
        raw_bytes: bytes,
        filename: str,
        declared_mime: Optional[str] = None,
        job_id: Optional[str] = None
    ) -> FileMetadata:
        """
        Full ingestion pipeline:
        1. Size boundary check
        2. Header inspection & magic byte extraction
        3. Cryptographic hash calculation (SHA-256 + SHA-3-256)
        4. Static malware & shellcode quarantine scan
        5. Isolated atomic storage with chmod 0600
        """
        job_id = job_id or str(uuid.uuid4())
        file_size = len(raw_bytes)

        if file_size == 0:
            raise IngestionError("Uploaded file is empty (0 bytes).")

        if file_size > MAX_FILE_SIZE:
            raise IngestionError(
                f"File size ({file_size} bytes) exceeds the platform threshold of {MAX_FILE_SIZE} bytes."
            )

        # Magic bytes detection
        header = raw_bytes[:64]
        detected_mime = self.detect_mime_type(header)
        if not detected_mime:
            raise MagicByteMismatchError(
                f"Unsupported or unrecognized file format. Header bytes: {header[:8].hex()}"
            )

        # Dual Hashing
        sha256_hash, sha3_256_hash = self.compute_dual_hashes(raw_bytes)

        # Static Malware / Exploit Scanning
        security_flags = self.scan_for_malicious_content(raw_bytes, detected_mime)
        status = IngestionStatus.ACCEPTED
        if any("EMBEDDED_" in flag or "LAUNCH" in flag for flag in security_flags):
            status = IngestionStatus.QUARANTINED
            logger.warning(f"File {filename} (Job {job_id}) quarantined due to flags: {security_flags}")

        # Write to isolated temp sandbox
        quarantine_job_dir = self.quarantine_dir / job_id
        quarantine_job_dir.mkdir(parents=True, exist_ok=True)
        try:
            quarantine_job_dir.chmod(0o700)
        except Exception:
            pass

        safe_extension = detected_mime.split("/")[-1]
        target_path = quarantine_job_dir / f"evidence_raw.{safe_extension}"

        # Atomic write
        temp_target = target_path.with_suffix(".tmp")
        with open(temp_target, "wb") as f:
            f.write(raw_bytes)
        temp_target.replace(target_path)

        try:
            target_path.chmod(0o600)
        except Exception:
            pass

        logger.info(
            f"Successfully ingested file '{filename}' into Job {job_id} | "
            f"MIME: {detected_mime} | SHA256: {sha256_hash[:16]}... | Size: {file_size}B"
        )

        return FileMetadata(
            job_id=job_id,
            original_filename=filename,
            detected_mime_type=detected_mime,
            declared_mime_type=declared_mime,
            file_size_bytes=file_size,
            sha256_hash=sha256_hash,
            sha3_256_hash=sha3_256_hash,
            quarantine_path=str(target_path),
            ingestion_timestamp=time.time(),
            quarantine_status=status,
            security_flags=security_flags,
        )
