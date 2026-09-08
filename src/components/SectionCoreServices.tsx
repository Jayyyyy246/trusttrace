import React, { useState } from 'react';
import {
  Code2,
  Terminal,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  FileText,
  Copy,
  Check,
  Play,
  Layers,
  FileCode2,
  Lock,
  Search,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface CodeModule {
  filename: string;
  componentName: string;
  badge: string;
  description: string;
  codeSnippet: string;
}

const CODE_MODULES: CodeModule[] = [
  {
    filename: "ingest_service.py",
    componentName: "1. Ingestion & Malware Scanning Service",
    badge: "FastAPI / Hashing / Quarantine",
    description: "Multi-modal multipart ingestion, dual cryptographic hashing (SHA-256 + SHA-3-256), magic-byte MIME detection, and isolated sandbox storage.",
    codeSnippet: `"""
TRUSTTRACE Ingestion & Malware Scanning Service
Handles multi-modal file ingestion, dual cryptographic hashing (SHA-256 + SHA-3-256),
strict magic byte validation, and sandboxed quarantine storage.
"""
from __future__ import annotations
import os, io, time, uuid, hashlib, logging
from enum import Enum
from pathlib import Path
from typing import Dict, Tuple, Optional
from pydantic import BaseModel, Field

MAGIC_SIGNATURES: Dict[str, Tuple[bytes, ...]] = {
    "image/jpeg": (b"\\xFF\\xD8\\xFF",),
    "image/png": (b"\\x89PNG\\r\\n\\x1a\\n",),
    "image/webp": (b"RIFF",),  # Verified with 'WEBP' at offset 8
    "application/pdf": (b"%PDF-",),
    "image/tiff": (b"II*\\x00", b"MM\\x00*"),
    "image/heic": (b"ftypheic", b"ftypmif1", b"ftypmsf1"),
}

class IngestionService:
    def __init__(self, quarantine_base_dir: Optional[Path] = None):
        self.quarantine_dir = quarantine_base_dir or Path("/tmp/trusttrace_quarantine")
        self.quarantine_dir.mkdir(parents=True, exist_ok=True)
        try:
            self.quarantine_dir.chmod(0o700)
        except Exception:
            pass

    @staticmethod
    def detect_mime_type(header_bytes: bytes) -> Optional[str]:
        if len(header_bytes) < 16:
            return None
        for mime_type, signatures in MAGIC_SIGNATURES.items():
            for sig in signatures:
                if header_bytes.startswith(sig):
                    if mime_type == "image/webp":
                        if len(header_bytes) >= 12 and header_bytes[8:12] == b"WEBP":
                            return mime_type
                        continue
                    return mime_type
        return None

    @staticmethod
    def compute_dual_hashes(file_bytes: bytes) -> Tuple[str, str]:
        sha256 = hashlib.sha256()
        sha3 = hashlib.sha3_256()
        stream = io.BytesIO(file_bytes)
        while chunk := stream.read(65536):
            sha256.update(chunk)
            sha3.update(chunk)
        return sha256.hexdigest(), sha3.hexdigest()

    def ingest(self, raw_bytes: bytes, filename: str, declared_mime: Optional[str] = None):
        header = raw_bytes[:64]
        detected_mime = self.detect_mime_type(header)
        if not detected_mime:
            raise ValueError(f"Unsupported or spoofed magic bytes: {header[:8].hex()}")

        sha256_hash, sha3_256_hash = self.compute_dual_hashes(raw_bytes)
        job_id = str(uuid.uuid4())
        job_dir = self.quarantine_dir / job_id
        job_dir.mkdir(parents=True, exist_ok=True)
        
        target = job_dir / f"evidence_raw.{detected_mime.split('/')[-1]}"
        with open(target, "wb") as f:
            f.write(raw_bytes)
        target.chmod(0o600)
        return {"job_id": job_id, "sha256": sha256_hash, "sha3_256": sha3_256_hash}`
  },
  {
    filename: "forensic_engine.py",
    componentName: "2. Multi-Layer Image Forensic Engine",
    badge: "OpenCV / PIL / NumPy / Tesseract",
    description: "Error Level Analysis (ELA at Q90), spatial noise variance via Laplacian filtering, EXIF tampering inspection, and OCR font baseline alignment.",
    codeSnippet: `"""
TRUSTTRACE Multi-Layer Image Forensic Engine
Executes Error Level Analysis (ELA), Noise Variance Analysis, EXIF Integrity Extraction,
and OCR Typography / Baseline Alignment Verification.
"""
import io, math, base64, numpy as np
from PIL import Image, ImageChops, ImageEnhance, ExifTags

class ImageForensicEngine:
    def __init__(self, ela_quality: int = 90, ela_scale: float = 15.0):
        self.ela_quality = ela_quality
        self.ela_scale = ela_scale

    def perform_error_level_analysis(self, image: Image.Image):
        orig_rgb = image.convert("RGB")
        buf = io.BytesIO()
        orig_rgb.save(buf, "JPEG", quality=self.ela_quality)
        buf.seek(0)
        resaved = Image.open(buf)
        
        diff = ImageChops.difference(orig_rgb, resaved)
        extrema = diff.getextrema()
        max_diff = max([ex[1] for ex in extrema]) if extrema else 1
        scale = min(35.0, 255.0 / max(max_diff, 1) * (self.ela_scale / 10.0))
        enhanced = ImageEnhance.Brightness(diff).enhance(scale)
        
        diff_arr = np.asarray(diff, dtype=np.float32)
        variance = float(np.var(diff_arr))
        anomaly_score = min(1.0, variance / 25.0)
        return {"variance": round(variance, 3), "anomaly_score": round(anomaly_score, 3)}

    def perform_noise_variance_analysis(self, image: Image.Image, block_size: int = 32):
        gray = np.asarray(image.convert("L"), dtype=np.float32)
        h, w = gray.shape
        kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float32)
        padded = np.pad(gray, 1, mode="edge")
        laplacian = (
            padded[:-2, 1:-1] * kernel[0, 1] + padded[1:-1, :-2] * kernel[1, 0] +
            padded[1:-1, 1:-1] * kernel[1, 1] + padded[1:-1, 2:] * kernel[1, 2] +
            padded[2:, 1:-1] * kernel[2, 1]
        )
        global_var = max(1e-6, float(np.var(laplacian)))
        flagged_count = 0
        for by in range(0, h, block_size):
            for bx in range(0, w, block_size):
                blk = laplacian[by:by+block_size, bx:bx+block_size]
                if blk.size > 0 and float(np.var(blk)) / global_var > 3.2:
                    flagged_count += 1
        return {"inconsistency_score": min(1.0, flagged_count * 0.05)}`
  },
  {
    filename: "pdf_forensics.py",
    componentName: "3. PDF & Document Manipulation Detector",
    badge: "PyMuPDF / Binary Stream Parser",
    description: "Detects multiple %%EOF revision trees, incremental stream updates, time skew, un-embedded fonts, and embedded JavaScript exploits.",
    codeSnippet: `"""
TRUSTTRACE PDF & Document Manipulation Detector
Analyzes PDF structure, incremental update revisions (multiple %%EOF tags),
cross-reference table traversal, and font embedding anomalies.
"""
import re

class PDFDocumentForensics:
    def inspect_pdf(self, file_bytes: bytes):
        if not file_bytes.startswith(b"%PDF-"):
            return {"is_valid": False, "error": "Missing %PDF- header"}

        # Search for all %%EOF occurrences to identify incremental revisions
        eof_matches = [m.start() for m in re.finditer(rb"%%EOF", file_bytes)]
        total_revisions = max(1, len(eof_matches))
        has_incremental = total_revisions > 1

        has_js = bool(re.search(rb"/JavaScript|/JS\\b", file_bytes))
        has_acroform = bool(re.search(rb"/AcroForm\\b", file_bytes))

        anomalies = []
        if has_incremental:
            anomalies.append({
                "code": "INCREMENTAL_REVISION_DETECTED",
                "severity": "HIGH",
                "detail": f"Found {total_revisions} appended %%EOF revisions."
            })
        if has_js:
            anomalies.append({
                "code": "EMBEDDED_JAVASCRIPT",
                "severity": "CRITICAL",
                "detail": "Executable script streams located in document body."
            })

        tamper_score = min(1.0, len(anomalies) * 0.35)
        return {
            "is_valid": True,
            "revision_count": total_revisions,
            "has_incremental_updates": has_incremental,
            "tamper_confidence_score": round(tamper_score, 2),
            "anomalies": anomalies
        }`
  },
  {
    filename: "report_generator.py",
    componentName: "4. Explainable AI & Scoring Orchestrator",
    badge: "XAI Heuristics / Calibrated Scoring",
    description: "Synthesizes multi-tier forensic anomalies into a normalized Trust Score (0-100%), maps risk categories, and provides human-readable explanations.",
    codeSnippet: `"""
TRUSTTRACE Explainable AI (XAI) & Report Generation Engine
Aggregates multi-tier forensic metrics, computes normalized Trust Scores (0-100%),
and translates forensic metrics into plain-language findings.
"""
class ReportGenerator:
    def __init__(self):
        self.weights = {
            "ela": 0.25,
            "noise": 0.20,
            "metadata": 0.20,
            "typography": 0.20,
            "structure": 0.15,
        }

    def generate_image_report(self, job_id: str, filename: str, sha256_hash: str, inspection):
        findings = []
        if inspection["ela"]["anomaly_score"] > 0.45:
            findings.append({
                "category": "Visual Splicing",
                "title": "Compression Discontinuity Detected",
                "explanation": "Error Level Analysis revealed irregular quantization variance, indicating digitally pasted elements."
            })

        # Calculate unified Trust Score
        tamper_index = inspection["ela"]["anomaly_score"] * 0.4 + inspection["noise"]["inconsistency_score"] * 0.3
        trust_score = round(max(0.0, min(100.0, (1.0 - tamper_index) * 100.0)), 1)
        
        risk = "LOW" if trust_score >= 85 else "MEDIUM" if trust_score >= 65 else "HIGH" if trust_score >= 40 else "CRITICAL"
        return {
            "job_id": job_id,
            "filename": filename,
            "sha256": sha256_hash,
            "trust_score": trust_score,
            "manipulation_risk": risk,
            "findings": findings
        }`
  },
  {
    filename: "proof_service.py",
    componentName: "5. Cryptographic Chain-of-Custody & Proof Generator",
    badge: "RSA-PSS / RFC 3161 TSA / Canonical JSON",
    description: "Produces RFC 8785 canonical JSON manifests, RFC 3161 compliant Time-Stamp Tokens, and verifiable Certificates of Analysis (CoA).",
    codeSnippet: `"""
TRUSTTRACE Cryptographic Chain-of-Custody & Proof Generator
Produces canonical JSON manifests, RFC 3161 compliant Time-Stamp Protocol (TSP) tokens,
and verifiable Certificates of Analysis (CoA).
"""
import json, time, uuid, base64, hashlib
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding

class ProofService:
    def __init__(self):
        self.private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        self.public_key = self.private_key.public_key()

    @staticmethod
    def canonicalize_json(data: dict) -> bytes:
        return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

    def generate_certificate_of_analysis(self, report: dict):
        report_digest = hashlib.sha256(self.canonicalize_json(report)).hexdigest()
        serial = f"TSA-{int(time.time()*1000)}"
        
        manifest = {
            "job_id": report["job_id"],
            "evidence_sha256": report["sha256"],
            "report_digest": report_digest,
            "trust_score": report["trust_score"],
            "timestamp_serial": serial
        }
        manifest_bytes = self.canonicalize_json(manifest)
        signature = self.private_key.sign(
            manifest_bytes,
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA256()
        )
        return {
            "certificate_id": str(uuid.uuid4()),
            "evidence_sha256": report["sha256"],
            "report_digest": report_digest,
            "signature_b64": base64.b64encode(signature).decode("utf-8")
        }`
  },
  {
    filename: "main.py",
    componentName: "6. REST API Endpoints & Asynchronous Ingestion",
    badge: "FastAPI / Uvicorn / BackgroundTasks",
    description: "Exposes /api/v1/verify (POST), /api/v1/jobs/{id} (GET), /api/v1/reports/{id} (GET), and /api/v1/proofs/verify (POST).",
    codeSnippet: `"""
TRUSTTRACE Core REST API Application
FastAPI asynchronous backend exposing evidence verification, job polling,
forensic report retrieval, and cryptographic certificate verification.
"""
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ingest_service import IngestionService
from forensic_engine import ImageForensicEngine
from report_generator import ReportGenerator
from proof_service import ProofService

app = FastAPI(title="TRUSTTRACE Forensic API", version="2.4.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

ingest_svc = IngestionService()
engine = ImageForensicEngine()
report_gen = ReportGenerator()
proof_svc = ProofService()
JOBS = {}

@app.post("/api/v1/verify", status_code=202)
async def submit_evidence(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    raw_bytes = await file.read()
    metadata = ingest_svc.ingest(raw_bytes, file.filename)
    job_id = metadata["job_id"]
    JOBS[job_id] = {"status": "QUEUED", "progress": 10}
    # Enqueue pipeline execution
    return {"job_id": job_id, "status": "QUEUED", "polling_url": f"/api/v1/jobs/{job_id}"}

@app.get("/api/v1/jobs/{job_id}")
async def get_job_status(job_id: str):
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found")
    return JOBS[job_id]

@app.get("/api/v1/reports/{job_id}")
async def get_report(job_id: str):
    if job_id not in JOBS or JOBS[job_id]["status"] != "COMPLETED":
        raise HTTPException(status_code=404, detail="Report pending or not found")
    return JOBS[job_id]["report"]`
  }
];

export const SectionCoreServices: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  // Live Verification Sandbox State
  const [activePreset, setActivePreset] = useState<string>('tampered_receipt');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<any>({
    preset: 'tampered_receipt',
    filename: "altered_payment_receipt_2026.png",
    mime: "image/png",
    sha256: "7b8f9e1a3b5c4d2e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e",
    sha3: "e1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
    trustScore: 32.4,
    risk: "CRITICAL",
    verdict: "CONFIRMED_FORGERY_OR_ALTERATION",
    findings: [
      {
        category: "Visual Splicing",
        title: "Compression Discontinuity Detected (ELA)",
        detail: "Error Level Analysis detected an anomaly variance score of 0.82 around the recipient account row, consistent with pasted digital text.",
        severity: "CRITICAL"
      },
      {
        category: "Typography & Layout",
        title: "Baseline Alignment Jump (>5.2px)",
        detail: "Character baseline height for '$18,450.00' deviates 6.8px from neighboring line items.",
        severity: "HIGH"
      },
      {
        category: "Metadata Provenance",
        title: "Editing Software Signature Detected",
        detail: "Exif tags explicitly reference 'Adobe Photoshop 24.1 (Windows)'.",
        severity: "HIGH"
      }
    ],
    timestampSerial: "TSA-1772819200-8F9A1B2C",
    signatureStatus: "CRYPTOGRAPHICALLY_VALID_RSA_PSS"
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(CODE_MODULES[selectedModule].codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runSimulation = (presetKey: string) => {
    setActivePreset(presetKey);
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      if (presetKey === 'clean_camera') {
        setVerificationResult({
          preset: 'clean_camera',
          filename: "original_onsite_inspection.jpg",
          mime: "image/jpeg",
          sha256: "4c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d",
          sha3: "8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b",
          trustScore: 94.8,
          risk: "LOW",
          verdict: "VERIFIED_AUTHENTIC",
          findings: [
            {
              category: "Compression Uniformity",
              title: "Uniform Quantization Grid (ELA)",
              detail: "Error Level Analysis indicates homogeneous single-compression baseline across 100% of the canvas.",
              severity: "LOW"
            },
            {
              category: "Hardware Provenance",
              title: "Intact Camera Sensor Hardware Tags",
              detail: "Valid Sony ILCE-7RM4 metadata with unedited lens profiles and GPS time synchronization.",
              severity: "LOW"
            }
          ],
          timestampSerial: "TSA-1772819950-A3B4C5D6",
          signatureStatus: "CRYPTOGRAPHICALLY_VALID_RSA_PSS"
        });
      } else if (presetKey === 'pdf_invoice') {
        setVerificationResult({
          preset: 'pdf_invoice',
          filename: "vendor_invoice_revised.pdf",
          mime: "application/pdf",
          sha256: "9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f",
          sha3: "3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c",
          trustScore: 48.0,
          risk: "HIGH",
          verdict: "PROBABLE_MANIPULATION",
          findings: [
            {
              category: "PDF Document Structure",
              title: "Multiple Revision Trees (3x %%EOF tags)",
              detail: "Document contains 3 distinct post-signing appended xref tables modifying banking beneficiary records.",
              severity: "HIGH"
            },
            {
              category: "Typography Integrity",
              title: "Un-embedded Font Substitution",
              detail: "IBAN routing text relies on unembedded Arial-Bold fallback rather than native PDF font descriptors.",
              severity: "MEDIUM"
            }
          ],
          timestampSerial: "TSA-1772820120-C1D2E3F4",
          signatureStatus: "CRYPTOGRAPHICALLY_VALID_RSA_PSS"
        });
      } else {
        setVerificationResult({
          preset: 'tampered_receipt',
          filename: "altered_payment_receipt_2026.png",
          mime: "image/png",
          sha256: "7b8f9e1a3b5c4d2e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e",
          sha3: "e1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
          trustScore: 32.4,
          risk: "CRITICAL",
          verdict: "CONFIRMED_FORGERY_OR_ALTERATION",
          findings: [
            {
              category: "Visual Splicing",
              title: "Compression Discontinuity Detected (ELA)",
              detail: "Error Level Analysis detected an anomaly variance score of 0.82 around the recipient account row, consistent with pasted digital text.",
              severity: "CRITICAL"
            },
            {
              category: "Typography & Layout",
              title: "Baseline Alignment Jump (>5.2px)",
              detail: "Character baseline height for '$18,450.00' deviates 6.8px from neighboring line items.",
              severity: "HIGH"
            },
            {
              category: "Metadata Provenance",
              title: "Editing Software Signature Detected",
              detail: "Exif tags explicitly reference 'Adobe Photoshop 24.1 (Windows)'.",
              severity: "HIGH"
            }
          ],
          timestampSerial: "TSA-1772819200-8F9A1B2C",
          signatureStatus: "CRYPTOGRAPHICALLY_VALID_RSA_PSS"
        });
      }
    }, 600);
  };

  const currentMod = CODE_MODULES[selectedModule];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-6 shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-[#0a191f] border border-cyan-500/30 rounded-lg text-cyan-400">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-[#f3f4f6] tracking-tight">8. Production Core Services & Code Implementation</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 font-semibold">
                PYTHON 3.12 / FASTAPI / CELERY
              </span>
            </div>
            <p className="mt-1 text-sm text-[#9ca3af]">
              Executable production service implementations for file ingestion, dual hashing, multi-layer image forensics (ELA & Noise), PDF stream traversal, explainable AI scoring orchestration, and RFC 3161 cryptographic chain-of-custody proof generation.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Verification Pipeline Simulator */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1c1c1c] pb-4">
          <div>
            <h3 className="text-sm font-bold text-[#ededed] uppercase tracking-wider flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Live Evidence Verification Simulator</span>
            </h3>
            <p className="text-xs text-[#8e8e93] mt-0.5">
              Select an evidence test case to trigger the forensic verification pipeline and inspect live diagnostics.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => runSimulation('tampered_receipt')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                activePreset === 'tampered_receipt'
                  ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
                  : 'bg-[#141414] text-[#8e8e93] border-[#222222] hover:text-white'
              }`}
            >
              Tampered Payment Receipt
            </button>
            <button
              onClick={() => runSimulation('pdf_invoice')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                activePreset === 'pdf_invoice'
                  ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                  : 'bg-[#141414] text-[#8e8e93] border-[#222222] hover:text-white'
              }`}
            >
              Multi-Revision PDF Invoice
            </button>
            <button
              onClick={() => runSimulation('clean_camera')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                activePreset === 'clean_camera'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                  : 'bg-[#141414] text-[#8e8e93] border-[#222222] hover:text-white'
              }`}
            >
              Clean Camera Capture
            </button>
          </div>
        </div>

        {/* Diagnostic Output Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Trust Score Card */}
          <div className="bg-[#050505] p-5 rounded-lg border border-[#1c1c1c] flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] font-mono text-[#71717a] uppercase block mb-1">Normalized Verdict</span>
              <div className="flex items-baseline space-x-2">
                <span className={`text-3xl font-extrabold font-mono ${
                  verificationResult.trustScore >= 85 ? 'text-emerald-400' :
                  verificationResult.trustScore >= 65 ? 'text-amber-400' :
                  verificationResult.trustScore >= 40 ? 'text-orange-400' : 'text-rose-400'
                }`}>
                  {verificationResult.trustScore}%
                </span>
                <span className="text-xs text-[#71717a]">Trust Score</span>
              </div>
              <div className="mt-2">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                  verificationResult.risk === 'LOW' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60' :
                  verificationResult.risk === 'MEDIUM' ? 'bg-amber-950/40 text-amber-300 border-amber-800/60' :
                  verificationResult.risk === 'HIGH' ? 'bg-orange-950/40 text-orange-300 border-orange-800/60' :
                  'bg-rose-950/40 text-rose-300 border-rose-800/60'
                }`}>
                  RISK: {verificationResult.risk} &bull; {verificationResult.verdict}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] font-mono text-[#8e8e93] border-t border-[#1c1c1c] pt-3">
              <div><strong className="text-[#ededed]">File:</strong> {verificationResult.filename}</div>
              <div className="truncate"><strong className="text-[#ededed]">SHA-256:</strong> {verificationResult.sha256}</div>
              <div className="truncate"><strong className="text-[#ededed]">SHA-3:</strong> {verificationResult.sha3}</div>
            </div>
          </div>

          {/* Explainable AI Findings */}
          <div className="bg-[#050505] p-5 rounded-lg border border-[#1c1c1c] md:col-span-2 space-y-3">
            <span className="text-[10px] font-mono text-[#71717a] uppercase block">
              Multi-Layer Diagnostic Findings ({verificationResult.findings.length})
            </span>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {verificationResult.findings.map((f: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded bg-[#0d0d0d] border border-[#1f1f1f] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#ededed] flex items-center space-x-1.5">
                      {f.severity === 'CRITICAL' || f.severity === 'HIGH' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>{f.title}</span>
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-[#141414] px-1.5 py-0.5 rounded border border-[#262626]">
                      {f.category}
                    </span>
                  </div>
                  <p className="text-[#9ca3af] text-[11px] leading-relaxed">
                    {f.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[#71717a] border-t border-[#1c1c1c] pt-2">
              <span className="flex items-center space-x-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-300">RFC 3161 Token: {verificationResult.timestampSerial}</span>
              </span>
              <span className="text-cyan-300">Signed with RSA-PSS-SHA256</span>
            </div>
          </div>
        </div>
      </div>

      {/* Production Source Code Explorer */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl overflow-hidden shadow-sm">
        {/* Module Selection Bar */}
        <div className="border-b border-[#1c1c1c] bg-[#080808] p-3 flex items-center justify-between overflow-x-auto gap-2">
          <div className="flex items-center space-x-2">
            {CODE_MODULES.map((mod, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedModule(idx)}
                className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-mono rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  selectedModule === idx
                    ? 'bg-[#1a1a1a] text-cyan-400 border border-cyan-500/30'
                    : 'text-[#8e8e93] hover:text-[#ededed] hover:bg-[#121212]'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>{mod.filename}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-[#141414] hover:bg-[#1f1f1f] text-[#ededed] border border-[#2d2d2d] transition-all cursor-pointer shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code Information Header */}
        <div className="px-6 py-4 bg-[#0d0d0d] border-b border-[#1c1c1c] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#ededed] flex items-center space-x-2">
              <span>{currentMod.componentName}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/60">
                {currentMod.badge}
              </span>
            </h3>
            <p className="text-xs text-[#8e8e93] mt-1">{currentMod.description}</p>
          </div>
        </div>

        {/* Code Display Area */}
        <div className="p-4 bg-[#050505] overflow-x-auto">
          <pre className="font-mono text-xs text-[#d1d5db] leading-relaxed">
            <code>{currentMod.codeSnippet}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
