"""
TRUSTTRACE Celery Asynchronous Forensic Worker (Hardened & Optimized)
Executes CPU/GPU-intensive forensic pipelines asynchronously via Redis/RabbitMQ message broker
with explicit soft/hard timeouts, memory ceiling recycling, and fair task dispatching.
"""

from __future__ import annotations

import os
import gc
import logging
from typing import Dict, Any

from celery import Celery
from celery.exceptions import SoftTimeLimitExceeded
from ingest_service import IngestionService
from forensic_engine import ImageForensicEngine
from pdf_forensics import PDFDocumentForensics
from report_generator import ReportGenerator
from proof_service import ProofService
from cache_manager import cache_mgr

logger = logging.getLogger("trusttrace.worker")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "trusttrace_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL
)

# Robust Production Tuning
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    result_expires=3600,
    task_track_started=True,
    # Worker Concurrency & Memory Controls
    worker_prefetch_multiplier=1,            # Disable batch prefetching; ensures fair distribution
    worker_max_memory_per_child=350_000,     # Recycle worker after 350 MB to eliminate fragmentation
    worker_max_tasks_per_child=100,          # Periodic worker cycle
    task_acks_late=True,                     # Only ACK when task succeeds
    task_reject_on_worker_lost=True,         # Requeue if worker node dies abruptly
    # Timeout Boundaries
    task_soft_time_limit=60,                 # Raise SoftTimeLimitExceeded at 60s
    task_time_limit=90,                      # SIGKILL hard limit at 90s
)

# Shared instances
ingest_svc = IngestionService()
image_engine = ImageForensicEngine()
pdf_engine = PDFDocumentForensics()
report_gen = ReportGenerator()
proof_svc = ProofService()


@celery_app.task(bind=True, name="tasks.execute_forensic_pipeline")
def execute_forensic_pipeline(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Asynchronous Celery task that executes the multi-tier forensic inspection,
    generates XAI explanations, stamps cryptographic proofs, and utilizes deduplication caching.
    """
    job_id = job_data["job_id"]
    file_path = job_data["quarantine_path"]
    mime_type = job_data["detected_mime_type"]
    filename = job_data["original_filename"]
    sha256_hash = job_data["sha256_hash"]
    sha3_256_hash = job_data["sha3_256_hash"]

    # 1. Deduplication Cache Check
    cached_payload = cache_mgr.get_cached_report(sha256_hash)
    if cached_payload:
        logger.info(f"Returning cached forensic result for Job {job_id} (SHA256: {sha256_hash[:16]})")
        return cached_payload

    try:
        logger.info(f"Worker started forensic pipeline for Job {job_id} ({mime_type})")
        self.update_state(state="PROCESSING", meta={"progress": 20, "stage": "Ingesting and loading evidence bytes"})

        with open(file_path, "rb") as f:
            file_bytes = f.read()

        if mime_type == "application/pdf":
            self.update_state(state="PROCESSING", meta={"progress": 50, "stage": "Analyzing PDF revision trees and xref streams"})
            pdf_report = pdf_engine.inspect_pdf(file_bytes)

            self.update_state(state="PROCESSING", meta={"progress": 80, "stage": "Synthesizing Explainable AI forensic report"})
            final_report = report_gen.generate_pdf_report(
                job_id=job_id,
                filename=filename,
                sha256_hash=sha256_hash,
                sha3_256_hash=sha3_256_hash,
                pdf_inspection=pdf_report
            )
        else:
            self.update_state(state="PROCESSING", meta={"progress": 40, "stage": "Executing vectorized ELA and spatial noise filtering"})
            inspection = image_engine.analyze_image(file_bytes, filename=filename)

            self.update_state(state="PROCESSING", meta={"progress": 80, "stage": "Synthesizing Explainable AI forensic report and heatmaps"})
            final_report = report_gen.generate_image_report(
                job_id=job_id,
                filename=filename,
                sha256_hash=sha256_hash,
                sha3_256_hash=sha3_256_hash,
                inspection=inspection
            )

        self.update_state(state="PROCESSING", meta={"progress": 95, "stage": "Generating cryptographic Certificate of Analysis (RFC 3161)"})
        certificate = proof_svc.generate_certificate_of_analysis(final_report)

        result_payload = {
            "report": final_report.model_dump(),
            "certificate": certificate.model_dump()
        }

        # Cache pre-computed result for 24 hours
        cache_mgr.set_cached_report(sha256_hash, result_payload, ttl_seconds=86400)

        # Force garbage collection
        del file_bytes
        gc.collect()

        logger.info(f"Worker completed Job {job_id} -> Trust Score: {final_report.trust_score}% ({final_report.verdict})")
        return result_payload

    except SoftTimeLimitExceeded:
        logger.error(f"Job {job_id} exceeded maximum processing time limit of 60 seconds.")
        raise RuntimeError("Forensic analysis exceeded compute SLA time limit (60s).")
    except Exception as e:
        logger.error(f"Job {job_id} failed with exception: {e}", exc_info=True)
        raise e
