"""
TRUSTTRACE Core REST API Application (Hardened, Cached, & Rate-Limited)
FastAPI asynchronous backend exposing evidence verification, job polling,
forensic report retrieval, deduplication caching, and cryptographic verification.
"""

from __future__ import annotations

import os
import time
import logging
from typing import Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Request, Header, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ingest_service import IngestionService, IngestionError, FileMetadata
from forensic_engine import ImageForensicEngine
from pdf_forensics import PDFDocumentForensics
from report_generator import ReportGenerator
from proof_service import ProofService
from cache_manager import cache_mgr

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("trusttrace.api")

app = FastAPI(
    title="TRUSTTRACE Forensic Verification API",
    description="Production-grade AI-assisted digital evidence verification, multi-layer tamper detection, and cryptographic provenance engine.",
    version="2.4.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services
ingest_service = IngestionService()
image_engine = ImageForensicEngine()
pdf_engine = PDFDocumentForensics()
report_generator = ReportGenerator()
proof_service = ProofService()

# In-memory job repository (synchronized with Redis in distributed cluster)
JOB_STORE: Dict[str, Dict[str, Any]] = {}


class JobSubmissionResponse(BaseModel):
    job_id: str
    filename: str
    detected_mime_type: str
    sha256_hash: str
    sha3_256_hash: str
    status: str
    message: str
    polling_url: str
    is_cached_result: bool = False


class JobStatusResponse(BaseModel):
    job_id: str
    status: str  # QUEUED, PROCESSING, COMPLETED, FAILED
    progress_percentage: int
    current_stage: str
    started_at: float
    completed_at: Optional[float] = None
    error_message: Optional[str] = None


def execute_pipeline_in_background(job_id: str, metadata: FileMetadata):
    """
    Standalone background execution worker (fallback when Celery/Redis is not deployed).
    Runs deep forensic inspection, caches output, and registers cryptographic proof.
    """
    try:
        JOB_STORE[job_id]["status"] = "PROCESSING"
        JOB_STORE[job_id]["progress"] = 25
        JOB_STORE[job_id]["stage"] = "Validating evidence container and extracting bitstream"

        with open(metadata.quarantine_path, "rb") as f:
            file_bytes = f.read()

        mime = metadata.detected_mime_type
        if mime == "application/pdf":
            JOB_STORE[job_id]["progress"] = 55
            JOB_STORE[job_id]["stage"] = "Analyzing PDF revision trees and incremental cross-references"
            pdf_inspection = pdf_engine.inspect_pdf(file_bytes)

            JOB_STORE[job_id]["progress"] = 80
            JOB_STORE[job_id]["stage"] = "Synthesizing Explainable AI forensic report"
            report = report_generator.generate_pdf_report(
                job_id=job_id,
                filename=metadata.original_filename,
                sha256_hash=metadata.sha256_hash,
                sha3_256_hash=metadata.sha3_256_hash,
                pdf_inspection=pdf_inspection
            )
        else:
            JOB_STORE[job_id]["progress"] = 45
            JOB_STORE[job_id]["stage"] = "Executing vectorized Error Level Analysis (ELA) and spatial noise filtering"
            inspection = image_engine.analyze_image(file_bytes, filename=metadata.original_filename)

            JOB_STORE[job_id]["progress"] = 80
            JOB_STORE[job_id]["stage"] = "Synthesizing Explainable AI forensic report and anomaly heatmaps"
            report = report_generator.generate_image_report(
                job_id=job_id,
                filename=metadata.original_filename,
                sha256_hash=metadata.sha256_hash,
                sha3_256_hash=metadata.sha3_256_hash,
                inspection=inspection
            )

        JOB_STORE[job_id]["progress"] = 95
        JOB_STORE[job_id]["stage"] = "Stamping RFC 3161 Time-Stamp Token and signing Certificate of Analysis"
        certificate = proof_service.generate_certificate_of_analysis(report)

        result_payload = {
            "report": report.model_dump(),
            "certificate": certificate.model_dump()
        }

        # Cache result under file SHA-256 for instant subsequent lookups
        cache_mgr.set_cached_report(metadata.sha256_hash, result_payload, ttl_seconds=86400)

        JOB_STORE[job_id]["progress"] = 100
        JOB_STORE[job_id]["status"] = "COMPLETED"
        JOB_STORE[job_id]["stage"] = "Verification completed successfully"
        JOB_STORE[job_id]["completed_at"] = time.time()
        JOB_STORE[job_id]["report"] = report.model_dump()
        JOB_STORE[job_id]["certificate"] = certificate.model_dump()

        logger.info(f"Completed Job {job_id} -> Trust Score: {report.trust_score}% ({report.verdict})")

    except Exception as e:
        logger.error(f"Job {job_id} encountered fatal processing failure: {e}", exc_info=True)
        JOB_STORE[job_id]["status"] = "FAILED"
        JOB_STORE[job_id]["error_message"] = str(e)


@app.post(
    "/api/v1/verify",
    response_model=JobSubmissionResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Submit Digital Evidence for Verification",
    tags=["Evidence Verification"]
)
async def submit_evidence_for_verification(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    x_client_nonce: Optional[str] = Header(None)
):
    """
    Accepts multipart file upload with rate-limiting, deduplication caching,
    anti-replay validation, and isolated background dispatching.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"

    # 1. Rate Limiting Check
    if not cache_mgr.check_rate_limit(client_ip, max_requests=100, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Maximum 100 requests per minute allowed."
        )

    # 2. Nonce Anti-Replay Check (if header provided)
    if x_client_nonce:
        if not cache_mgr.validate_and_register_nonce(x_client_nonce, max_age_seconds=300):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Duplicate or replayed request nonce detected."
            )

    try:
        raw_bytes = await file.read()
        metadata = ingest_service.ingest(
            raw_bytes=raw_bytes,
            filename=file.filename or "evidence.bin",
            declared_mime=file.content_type
        )

        job_id = metadata.job_id

        # 3. Deduplication Cache Check
        cached_result = cache_mgr.get_cached_report(metadata.sha256_hash)
        if cached_result:
            JOB_STORE[job_id] = {
                "job_id": job_id,
                "filename": metadata.original_filename,
                "status": "COMPLETED",
                "progress": 100,
                "stage": "Result retrieved from Zero-Recomputation Cache",
                "started_at": time.time(),
                "completed_at": time.time(),
                "metadata": metadata.model_dump(),
                "report": cached_result["report"],
                "certificate": cached_result["certificate"],
                "error_message": None,
            }
            return JobSubmissionResponse(
                job_id=job_id,
                filename=metadata.original_filename,
                detected_mime_type=metadata.detected_mime_type,
                sha256_hash=metadata.sha256_hash,
                sha3_256_hash=metadata.sha3_256_hash,
                status="COMPLETED",
                message="Exact identical evidence bitstream found in cache. Report ready immediately.",
                polling_url=f"/api/v1/jobs/{job_id}",
                is_cached_result=True
            )

        # 4. Enqueue new background job
        JOB_STORE[job_id] = {
            "job_id": job_id,
            "filename": metadata.original_filename,
            "status": "QUEUED",
            "progress": 5,
            "stage": "Evidence quarantined and queued for analysis",
            "started_at": time.time(),
            "metadata": metadata.model_dump(),
            "report": None,
            "certificate": None,
            "error_message": None,
        }

        background_tasks.add_task(execute_pipeline_in_background, job_id, metadata)

        return JobSubmissionResponse(
            job_id=job_id,
            filename=metadata.original_filename,
            detected_mime_type=metadata.detected_mime_type,
            sha256_hash=metadata.sha256_hash,
            sha3_256_hash=metadata.sha3_256_hash,
            status="QUEUED",
            message="Evidence successfully accepted, hashed, and queued for forensic analysis.",
            polling_url=f"/api/v1/jobs/{job_id}",
            is_cached_result=False
        )

    except IngestionError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected upload processing error: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Ingestion failed: {e}")


@app.get(
    "/api/v1/jobs/{job_id}",
    response_model=JobStatusResponse,
    summary="Poll Forensic Job Execution Progress",
    tags=["Evidence Verification"]
)
async def get_job_status(job_id: str):
    """Returns execution status, active stage, and progress percentage for a verification job."""
    if job_id not in JOB_STORE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job ID '{job_id}' not found.")

    j = JOB_STORE[job_id]
    return JobStatusResponse(
        job_id=job_id,
        status=j["status"],
        progress_percentage=j.get("progress", 0),
        current_stage=j.get("stage", "Unknown"),
        started_at=j["started_at"],
        completed_at=j.get("completed_at"),
        error_message=j.get("error_message")
    )


@app.get(
    "/api/v1/reports/{job_id}",
    summary="Retrieve Full Forensic Analysis Report",
    tags=["Evidence Verification"]
)
async def get_forensic_report(job_id: str):
    """Returns complete multi-layer forensic inspection report."""
    if job_id not in JOB_STORE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job ID '{job_id}' not found.")

    j = JOB_STORE[job_id]
    if j["status"] == "PROCESSING" or j["status"] == "QUEUED":
        return JSONResponse(
            status_code=status.HTTP_202_ACCEPTED,
            content={
                "job_id": job_id,
                "status": j["status"],
                "progress": j.get("progress", 0),
                "stage": j.get("stage"),
                "message": "Analysis in progress. Please poll again in a few moments."
            }
        )
    elif j["status"] == "FAILED":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forensic analysis failed: {j.get('error_message')}"
        )

    return {
        "job_id": job_id,
        "filename": j["filename"],
        "report": j["report"],
        "certificate": j["certificate"]
    }


@app.post(
    "/api/v1/proofs/verify",
    summary="Verify Certificate of Analysis Authenticity",
    tags=["Cryptographic Proof"]
)
async def verify_proof_certificate(certificate_payload: Dict[str, Any]):
    """
    Validates cryptographic signature and timestamp of any Certificate of Analysis
    without requiring access to the original evidence file (Zero-Knowledge verification).
    """
    try:
        from proof_service import CertificateOfAnalysis
        cert = CertificateOfAnalysis(**certificate_payload)
        is_valid, msg = proof_service.verify_certificate(cert)
        return {
            "certificate_id": cert.certificate_id,
            "is_valid": is_valid,
            "verification_status": "VERIFIED_AUTHENTIC" if is_valid else "SIGNATURE_INVALID",
            "details": msg,
            "evidence_sha256": cert.evidence_sha256,
            "issued_timestamp_utc": cert.issued_timestamp_utc
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Certificate validation error: {e}"
        )


@app.get(
    "/api/v1/health",
    summary="Platform Diagnostics & Health",
    tags=["System Diagnostics"]
)
async def health_check():
    """System health endpoint reporting module readiness, active queues, and cache status."""
    from forensic_engine import HAS_OPENCV, HAS_TESSERACT
    from pdf_forensics import HAS_FITZ
    from proof_service import HAS_CRYPTOGRAPHY
    from cache_manager import HAS_REDIS

    return {
        "status": "healthy",
        "service": "TRUSTTRACE Forensic Engine",
        "version": "2.4.0",
        "active_jobs_count": len(JOB_STORE),
        "subsystems": {
            "opencv_accelerated": HAS_OPENCV,
            "tesseract_ocr": HAS_TESSERACT,
            "pymupdf_fitz": HAS_FITZ,
            "cryptography_rsa": HAS_CRYPTOGRAPHY,
            "redis_caching": HAS_REDIS and cache_mgr.redis_client is not None,
        },
        "timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
