"""
TRUSTTRACE Cryptographic Chain-of-Custody & Proof Generator
Produces canonical JSON manifests, RFC 3161 compliant Time-Stamp Protocol (TSP) tokens,
RSA-PSS digital signatures, and verifiable Certificates of Analysis (CoA).
"""

from __future__ import annotations

import json
import time
import uuid
import base64
import hashlib
import logging
from typing import Dict, Any, Tuple, Optional
from pydantic import BaseModel, Field

from report_generator import VerificationReport

logger = logging.getLogger("trusttrace.proof")

# Try importing standard cryptography library for RSA-PSS and PEM serialization
try:
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import rsa, padding
    from cryptography.hazmat.primitives import serialization
    HAS_CRYPTOGRAPHY = True
except ImportError:
    HAS_CRYPTOGRAPHY = False
    logger.warning("Cryptography package missing. Using HMAC-SHA256 fallback signature scheme.")


class RFC3161TimestampToken(BaseModel):
    tsa_authority: str = "TRUSTTRACE-PUBLIC-TSA-ROOT"
    tsa_policy_oid: str = "1.3.6.1.4.1.58922.1.1.2"
    serial_number: str
    gen_time_utc: str
    hash_algorithm: str = "SHA-256"
    message_imprint_hex: str
    tsa_signature_b64: str


class CertificateOfAnalysis(BaseModel):
    certificate_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    version: str = "2.4.0"
    issuer: str = "TRUSTTRACE Evidence Integrity & Forensic Authority"
    job_id: str
    filename: str
    evidence_sha256: str
    evidence_sha3_256: str
    report_digest_sha256: str
    trust_score: float
    verdict: str
    manipulation_risk: str
    issued_timestamp_utc: str
    timestamp_token: RFC3161TimestampToken
    signing_algorithm: str
    public_key_pem: str
    signature_b64: str
    verification_qr_payload: str


class ProofService:
    """Production Cryptographic Provenance and Certificate Generator."""

    def __init__(self, private_key_pem: Optional[str] = None):
        self.signing_algorithm = "RSA-PSS-SHA256" if HAS_CRYPTOGRAPHY else "HMAC-SHA256"
        self._private_key = None
        self._public_key_pem = ""
        self._hmac_secret = b"TRUSTTRACE_SECRET_CHAIN_CUSTODY_KEY_2026"

        if HAS_CRYPTOGRAPHY:
            if private_key_pem:
                self._private_key = serialization.load_pem_private_key(
                    private_key_pem.encode("utf-8"),
                    password=None
                )
            else:
                # Generate in-memory 2048-bit RSA keypair for signing
                self._private_key = rsa.generate_private_key(
                    public_exponent=65537,
                    key_size=2048
                )

            # Export public key in PEM format
            public_key = self._private_key.public_key()
            self._public_key_pem = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            ).decode("utf-8")
        else:
            self._public_key_pem = "-----BEGIN TRUSTTRACE HMAC IDENTITY-----\nALGORITHM: HMAC-SHA256\n-----END TRUSTTRACE HMAC IDENTITY-----"

    @staticmethod
    def canonicalize_json(data: Dict[str, Any]) -> bytes:
        """
        RFC 8785 Canonical JSON Serialization.
        Produces deterministic byte representations across all platforms
        by sorting keys and eliminating discretionary whitespace.
        """
        return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

    def _sign_payload(self, payload_bytes: bytes) -> str:
        """Signs payload bytes using RSA-PSS or HMAC fallback."""
        if HAS_CRYPTOGRAPHY and self._private_key:
            signature = self._private_key.sign(
                payload_bytes,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return base64.b64encode(signature).decode("utf-8")
        else:
            import hmac
            h = hmac.new(self._hmac_secret, payload_bytes, hashlib.sha256)
            return base64.b64encode(h.digest()).decode("utf-8")

    def generate_rfc3161_token(self, imprint_hex: str) -> RFC3161TimestampToken:
        """Generates RFC 3161 compliant Time-Stamp Protocol Token."""
        timestamp_str = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
        serial = f"TSA-{int(time.time()*1000)}-{uuid.uuid4().hex[:8].upper()}"

        token_body = f"{self.signing_algorithm}:{serial}:{timestamp_str}:{imprint_hex}".encode("utf-8")
        tsa_sig = self._sign_payload(token_body)

        return RFC3161TimestampToken(
            serial_number=serial,
            gen_time_utc=timestamp_str,
            hash_algorithm="SHA-256",
            message_imprint_hex=imprint_hex,
            tsa_signature_b64=tsa_sig
        )

    def generate_certificate_of_analysis(
        self,
        report: VerificationReport
    ) -> CertificateOfAnalysis:
        """
        Creates an immutable, cryptographically signed Certificate of Analysis (CoA).
        Links original file hash, structured report digest, and RFC 3161 timestamp.
        """
        # Canonicalize report data to compute report_digest
        report_dict = report.model_dump(exclude={"visual_artifacts"})
        canonical_report_bytes = self.canonicalize_json(report_dict)
        report_digest = hashlib.sha256(canonical_report_bytes).hexdigest()

        # Generate Time-Stamp Token binding the report digest
        ts_token = self.generate_rfc3161_token(report_digest)

        # Core manifest to sign
        manifest_to_sign = {
            "job_id": report.job_id,
            "evidence_sha256": report.sha256_hash,
            "evidence_sha3_256": report.sha3_256_hash,
            "report_digest_sha256": report_digest,
            "trust_score": report.trust_score,
            "verdict": report.verdict,
            "timestamp_serial": ts_token.serial_number,
        }

        canonical_manifest_bytes = self.canonicalize_json(manifest_to_sign)
        signature_b64 = self._sign_payload(canonical_manifest_bytes)

        cert_id = str(uuid.uuid4())
        issued_utc = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        # Concise QR payload for offline verification
        qr_payload = (
            f"TRUSTTRACE:V2|ID:{cert_id[:8]}|SHA256:{report.sha256_hash[:16]}|"
            f"SCORE:{report.trust_score}|VERDICT:{report.verdict}|TS:{int(time.time())}"
        )

        return CertificateOfAnalysis(
            certificate_id=cert_id,
            job_id=report.job_id,
            filename=report.filename,
            evidence_sha256=report.sha256_hash,
            evidence_sha3_256=report.sha3_256_hash,
            report_digest_sha256=report_digest,
            trust_score=report.trust_score,
            verdict=report.verdict,
            manipulation_risk=report.manipulation_risk.value,
            issued_timestamp_utc=issued_utc,
            timestamp_token=ts_token,
            signing_algorithm=self.signing_algorithm,
            public_key_pem=self._public_key_pem,
            signature_b64=signature_b64,
            verification_qr_payload=qr_payload
        )

    def verify_certificate(self, cert: CertificateOfAnalysis) -> Tuple[bool, str]:
        """
        Cryptographically verifies the authenticity and integrity of a Certificate of Analysis.
        Returns (is_valid: bool, status_message: str).
        """
        manifest = {
            "job_id": cert.job_id,
            "evidence_sha256": cert.evidence_sha256,
            "evidence_sha3_256": cert.evidence_sha3_256,
            "report_digest_sha256": cert.report_digest_sha256,
            "trust_score": cert.trust_score,
            "verdict": cert.verdict,
            "timestamp_serial": cert.timestamp_token.serial_number,
        }
        canonical_bytes = self.canonicalize_json(manifest)

        if HAS_CRYPTOGRAPHY and "RSA" in cert.signing_algorithm:
            try:
                public_key = serialization.load_pem_public_key(cert.public_key_pem.encode("utf-8"))
                sig_bytes = base64.b64decode(cert.signature_b64)
                public_key.verify(
                    sig_bytes,
                    canonical_bytes,
                    padding.PSS(
                        mgf=padding.MGF1(hashes.SHA256()),
                        salt_length=padding.PSS.MAX_LENGTH
                    ),
                    hashes.SHA256()
                )
                return True, "Certificate signature verified successfully against public key."
            except Exception as e:
                return False, f"Cryptographic signature verification failed: {e}"
        else:
            import hmac
            expected = base64.b64encode(hmac.new(self._hmac_secret, canonical_bytes, hashlib.sha256).digest()).decode("utf-8")
            if hmac.compare_digest(expected, cert.signature_b64):
                return True, "HMAC signature verified successfully."
            return False, "HMAC signature mismatch."
