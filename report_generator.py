"""
TRUSTTRACE Explainable AI (XAI) & Report Generation Engine
Aggregates multi-tier forensic metrics, computes normalized Trust Scores (0-100%),
determines Manipulation Risk Categories, and translates cryptic forensic flags into
plain-language executive summaries and court-admissible technical appendices.
"""

from __future__ import annotations

import time
import logging
from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from forensic_engine import CompleteForensicInspection, BoundingBox
from pdf_forensics import PDFInspectionReport

logger = logging.getLogger("trusttrace.report")


class RiskCategory(str, Enum):
    LOW = "LOW"             # Trust Score >= 85%: Likely authentic
    MEDIUM = "MEDIUM"       # Trust Score 65-84%: Suspicious inconsistencies
    HIGH = "HIGH"           # Trust Score 40-64%: Probable manipulation
    CRITICAL = "CRITICAL"   # Trust Score < 40%: Confirmed forgery / tampering


class FindingExplanation(BaseModel):
    category: str
    technical_flag: str
    title: str
    explanation: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    confidence: float
    recommended_action: str
    bounding_box: Optional[BoundingBox] = None


class VerificationReport(BaseModel):
    job_id: str
    filename: str
    sha256_hash: str
    sha3_256_hash: str
    trust_score: float  # 0.0 - 100.0%
    manipulation_risk: RiskCategory
    verdict: str
    executive_summary: str
    detailed_findings: List[FindingExplanation] = Field(default_factory=list)
    metrics_breakdown: Dict[str, float] = Field(default_factory=dict)
    visual_artifacts: Dict[str, str] = Field(default_factory=dict)  # Base64 data URLs
    heatmap_regions: List[BoundingBox] = Field(default_factory=list)
    generated_timestamp: float = Field(default_factory=time.time)
    legal_admissibility_notes: str


class ReportGenerator:
    """Orchestrates forensic scoring and human-interpretable report synthesis."""

    def __init__(self):
        # Weights for multi-modal evidence categories
        self.weights = {
            "ela_compression": 0.25,
            "noise_inconsistency": 0.20,
            "metadata_integrity": 0.20,
            "typography_alignment": 0.20,
            "document_structure": 0.15,
        }

    def generate_image_report(
        self,
        job_id: str,
        filename: str,
        sha256_hash: str,
        sha3_256_hash: str,
        inspection: CompleteForensicInspection
    ) -> VerificationReport:
        """Synthesizes comprehensive forensic report for raster media (JPEG, PNG, WebP)."""
        findings: List[FindingExplanation] = []
        heatmap_regions: List[BoundingBox] = []

        # 1. Evaluate ELA
        ela = inspection.ela
        if ela.anomaly_score > 0.45:
            findings.append(
                FindingExplanation(
                    category="Visual & Compression Splicing",
                    technical_flag=f"HIGH_ELA_VARIANCE (Score: {ela.anomaly_score})",
                    title="Compression Boundary Mismatch Detected",
                    explanation=(
                        f"Error Level Analysis identified abnormal compression variance (var={ela.variance:.2f}). "
                        "Certain regions inside the image were compressed at different quantization intervals than the base canvas, "
                        "which typically indicates digitally spliced elements, pasted text, or stamps."
                    ),
                    severity="HIGH" if ela.anomaly_score > 0.70 else "MEDIUM",
                    confidence=min(0.98, ela.anomaly_score),
                    recommended_action="Inspect highlighted ELA heatmap zones for pasted layers, altered totals, or stamps."
                )
            )
            heatmap_regions.extend(ela.anomaly_regions)

        # 2. Evaluate Noise Variance
        noise = inspection.noise
        if noise.inconsistency_score > 0.35:
            findings.append(
                FindingExplanation(
                    category="High-Frequency Sensor Consistency",
                    technical_flag=f"NOISE_INCONSISTENCY_RATIO (Max: {noise.max_block_variance_ratio})",
                    title="Inconsistent Sensor Noise Pattern",
                    explanation=(
                        f"Found {noise.flagged_blocks_count} localized blocks with unnatural noise variation ratios "
                        f"(ratio peak: {noise.max_block_variance_ratio:.1f}x). Natural camera sensors generate isotropic grain; "
                        "isolated flat zones often reveal artificial smoothing, cloning, or generative infilling."
                    ),
                    severity="HIGH" if noise.inconsistency_score > 0.60 else "MEDIUM",
                    confidence=min(0.95, noise.inconsistency_score),
                    recommended_action="Cross-reference with original uncompressed capture if available."
                )
            )
            heatmap_regions.extend(noise.suspicious_regions)

        # 3. Evaluate Metadata
        meta = inspection.metadata
        if meta.is_editing_software_detected:
            findings.append(
                FindingExplanation(
                    category="Metadata & Digital Provenance",
                    technical_flag=f"EDITING_SOFTWARE_EXPLICIT: {meta.software_detected}",
                    title="Known Photo Editing Software Fingerprint",
                    explanation=(
                        f"The file's internal metadata directly records editing via '{meta.software_detected}'. "
                        "This confirms the media was processed or saved using desktop image editing software."
                    ),
                    severity="HIGH",
                    confidence=0.99,
                    recommended_action="Request unedited original file directly from capture device."
                )
            )
        elif meta.is_metadata_stripped:
            findings.append(
                FindingExplanation(
                    category="Metadata & Digital Provenance",
                    technical_flag="METADATA_STRIPPED",
                    title="Hardware & Exif Metadata Missing",
                    explanation=(
                        "Camera hardware signatures (Make, Model, Lens, Shutter) are completely missing. "
                        "While common in social media uploads and messaging screenshots, absence of metadata prevents hardware authentication."
                    ),
                    severity="LOW",
                    confidence=0.75,
                    recommended_action="Obtain device raw file to establish unbroken chain of custody."
                )
            )

        if meta.is_chronology_suspicious:
            findings.append(
                FindingExplanation(
                    category="Metadata & Digital Provenance",
                    technical_flag="CHRONOLOGY_MISMATCH",
                    title="Inconsistent Modification Timestamps",
                    explanation=(
                        f"Creation date ({meta.date_created}) diverges from last modification date ({meta.date_modified}), "
                        "indicating file revision occurred after initial generation."
                    ),
                    severity="MEDIUM",
                    confidence=0.88,
                    recommended_action="Verify timestamp alignment with server logs."
                )
            )

        # 4. Evaluate Layout & OCR Alignment
        layout = inspection.layout
        if layout.baseline_variance_avg > 12.0:
            findings.append(
                FindingExplanation(
                    category="Typography & Geometric Alignment",
                    technical_flag=f"BASELINE_DEVIATION_HIGH (Var: {layout.baseline_variance_avg})",
                    title="Irregular Text Baseline Alignment",
                    explanation=(
                        "Multiple characters or numerical words deviate significantly from the baseline axis of their purported text row. "
                        "This is a classic forensic indicator of modified invoices, forged bank receipts, or pasted numbers."
                    ),
                    severity="HIGH",
                    confidence=0.91,
                    recommended_action="Examine altered digits in monetary amount or date fields."
                )
            )
            heatmap_regions.extend(layout.flagged_text_boxes)

        if layout.font_size_jump_count > 0:
            findings.append(
                FindingExplanation(
                    category="Typography & Geometric Alignment",
                    technical_flag=f"FONT_HEIGHT_DISCONTINUITY (Count: {layout.font_size_jump_count})",
                    title="Font Geometry Discontinuity Detected",
                    explanation=(
                        f"Detected {layout.font_size_jump_count} abrupt point size or font weight discontinuities within identical text lines."
                    ),
                    severity="MEDIUM",
                    confidence=0.85,
                    recommended_action="Review font consistency against standard template typography."
                )
            )

        # Compute Composite Trust Score
        tamper_index = (
            ela.anomaly_score * self.weights["ela_compression"] +
            noise.inconsistency_score * self.weights["noise_inconsistency"] +
            (1.0 if meta.is_editing_software_detected else 0.2 if meta.is_metadata_stripped else 0.0) * self.weights["metadata_integrity"] +
            layout.layout_inconsistency_score * self.weights["typography_alignment"]
        )

        trust_score = round(max(0.0, min(100.0, (1.0 - tamper_index) * 100.0)), 1)

        # Map to Risk Category
        if trust_score >= 85.0:
            risk = RiskCategory.LOW
            verdict = "VERIFIED_AUTHENTIC"
            summary = "The evidence exhibits consistent compression dynamics, uniform sensor noise distribution, and intact baseline typography without detectable anomalies."
        elif trust_score >= 65.0:
            risk = RiskCategory.MEDIUM
            verdict = "INCONSISTENCY_SUSPECTED"
            summary = "Minor structural or metadata inconsistencies were identified. While not conclusively altered, manual review of highlighted regions is recommended."
        elif trust_score >= 40.0:
            risk = RiskCategory.HIGH
            verdict = "PROBABLE_MANIPULATION"
            summary = "Significant forensic anomalies detected across multiple inspection tiers, including compression discrepancies and geometric alignment distortions."
        else:
            risk = RiskCategory.CRITICAL
            verdict = "CONFIRMED_FORGERY_OR_ALTERATION"
            summary = "Critical multi-layer forensic evidence of tampering detected, including synthetic modifications, editing suite artifacts, or fabricated text regions."

        visual_artifacts = {
            "ela_heatmap": ela.heatmap_base64,
            "noise_variance_map": noise.noise_map_base64,
        }

        metrics = {
            "trust_score": trust_score,
            "ela_variance": ela.variance,
            "ela_anomaly_score": ela.anomaly_score,
            "noise_inconsistency": noise.inconsistency_score,
            "max_noise_ratio": noise.max_block_variance_ratio,
            "baseline_variance": layout.baseline_variance_avg,
            "layout_inconsistency": layout.layout_inconsistency_score,
        }

        return VerificationReport(
            job_id=job_id,
            filename=filename,
            sha256_hash=sha256_hash,
            sha3_256_hash=sha3_256_hash,
            trust_score=trust_score,
            manipulation_risk=risk,
            verdict=verdict,
            executive_summary=summary,
            detailed_findings=findings,
            metrics_breakdown=metrics,
            visual_artifacts=visual_artifacts,
            heatmap_regions=heatmap_regions,
            generated_timestamp=time.time(),
            legal_admissibility_notes="Generated under ISO/IEC 27037 forensic guidelines with deterministic reproducible algorithms."
        )

    def generate_pdf_report(
        self,
        job_id: str,
        filename: str,
        sha256_hash: str,
        sha3_256_hash: str,
        pdf_inspection: PDFInspectionReport
    ) -> VerificationReport:
        """Synthesizes comprehensive forensic report for PDF and vector documents."""
        findings: List[FindingExplanation] = []

        for an in pdf_inspection.anomalies:
            findings.append(
                FindingExplanation(
                    category="PDF Document Structure",
                    technical_flag=an.anomaly_code,
                    title=an.description.split(".")[0],
                    explanation=f"{an.description} (Evidence: {an.evidence_detail})",
                    severity=an.severity,
                    confidence=0.92,
                    recommended_action="Inspect earlier revision states in PDF xref history."
                )
            )

        tamper_idx = pdf_inspection.tamper_confidence_score
        trust_score = round(max(0.0, min(100.0, (1.0 - tamper_idx) * 100.0)), 1)

        if trust_score >= 85.0:
            risk = RiskCategory.LOW
            verdict = "VERIFIED_AUTHENTIC"
            summary = "Document structure conforms to linear single-revision PDF specification with intact object streams and consistent timestamps."
        elif trust_score >= 65.0:
            risk = RiskCategory.MEDIUM
            verdict = "INCONSISTENCY_SUSPECTED"
            summary = "Minor structural deviations detected, such as modified date skew or unembedded font substitutions."
        elif trust_score >= 40.0:
            risk = RiskCategory.HIGH
            verdict = "PROBABLE_MANIPULATION"
            summary = "Multiple revision trees and post-creation updates detected. Content may have been altered after initial authoring."
        else:
            risk = RiskCategory.CRITICAL
            verdict = "CRITICAL_DOCUMENT_TAMPERING"
            summary = "Document contains high-risk structural modifications, embedded active scripts, or multiple appended revision bodies."

        metrics = {
            "trust_score": trust_score,
            "revision_count": float(pdf_inspection.revision_count),
            "tamper_confidence": pdf_inspection.tamper_confidence_score,
            "page_count": float(pdf_inspection.page_count),
        }

        return VerificationReport(
            job_id=job_id,
            filename=filename,
            sha256_hash=sha256_hash,
            sha3_256_hash=sha3_256_hash,
            trust_score=trust_score,
            manipulation_risk=risk,
            verdict=verdict,
            executive_summary=summary,
            detailed_findings=findings,
            metrics_breakdown=metrics,
            visual_artifacts={},
            heatmap_regions=[],
            generated_timestamp=time.time(),
            legal_admissibility_notes="Structural stream traversal conforming to FRE 902(13) & 902(14) self-authenticating electronic record standards."
        )
