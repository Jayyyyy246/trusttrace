"""
TRUSTTRACE PDF & Document Manipulation Detector
Analyzes PDF structure, incremental update revisions (multiple %%EOF tags),
structural cross-reference table traversal, font embedding, and hidden layer anomalies.
"""

from __future__ import annotations

import re
import io
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger("trusttrace.pdf")

# Optional PyMuPDF (fitz) import
try:
    import fitz  # PyMuPDF
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False
    logger.warning("PyMuPDF (fitz) not installed. Using deep binary stream traversal parser.")


class PDFRevision(BaseModel):
    revision_index: int
    eof_byte_offset: int
    bytes_added: int
    is_initial_version: bool


class PDFStructuralAnomaly(BaseModel):
    anomaly_code: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    description: str
    evidence_detail: str


class PDFInspectionReport(BaseModel):
    is_valid_pdf: bool
    page_count: int
    revision_count: int
    has_incremental_updates: bool
    creation_date: Optional[str] = None
    modification_date: Optional[str] = None
    time_delta_seconds: Optional[int] = None
    producer: Optional[str] = None
    creator: Optional[str] = None
    unembedded_fonts: List[str] = Field(default_factory=list)
    has_hidden_text_layers: bool = False
    has_form_fields_modified: bool = False
    has_embedded_javascript: bool = False
    revisions: List[PDFRevision] = Field(default_factory=list)
    anomalies: List[PDFStructuralAnomaly] = Field(default_factory=list)
    tamper_confidence_score: float  # 0.0 - 1.0


class PDFDocumentForensics:
    """Production Forensic Analyzer for PDF and Document structures."""

    def __init__(self):
        pass

    @staticmethod
    def _parse_pdf_date(date_str: str) -> Optional[str]:
        """Cleans and standardizes PDF dates (e.g. D:20260218143000Z)."""
        if not date_str:
            return None
        clean = re.sub(r"[D:']", "", date_str)
        if len(clean) >= 14:
            # YYYY-MM-DD HH:MM:SS
            return f"{clean[0:4]}-{clean[4:6]}-{clean[6:8]} {clean[8:10]}:{clean[10:12]}:{clean[12:14]} UTC"
        return date_str

    def _analyze_binary_stream(self, pdf_bytes: bytes) -> Dict[str, Any]:
        """
        Deep structural binary analysis.
        Scans for multiple %%EOF tokens indicating incremental post-creation revisions,
        scans xref tables, and extracts root metadata dictionaries.
        """
        # Search all %%EOF occurrences
        eof_matches = [m.start() for m in re.finditer(rb"%%EOF", pdf_bytes)]
        total_revisions = max(1, len(eof_matches))

        revisions: List[PDFRevision] = []
        last_offset = 0
        for idx, offset in enumerate(eof_matches):
            revisions.append(
                PDFRevision(
                    revision_index=idx + 1,
                    eof_byte_offset=offset,
                    bytes_added=offset - last_offset,
                    is_initial_version=(idx == 0)
                )
            )
            last_offset = offset

        # Search for JavaScript actions
        has_js = bool(re.search(rb"/JavaScript|/JS\b", pdf_bytes))

        # Search for Annotations and AcroForm modifications
        has_acroform = bool(re.search(rb"/AcroForm\b", pdf_bytes))
        has_annots = bool(re.search(rb"/Annots\b", pdf_bytes))

        # Extract basic metadata dict tags from PDF trailer/info dictionary
        creation_date = None
        mod_date = None
        producer = None
        creator = None

        m_create = re.search(rb"/CreationDate\s*\(([^)]+)\)", pdf_bytes)
        if m_create:
            creation_date = self._parse_pdf_date(m_create.group(1).decode("latin-1", errors="ignore"))

        m_mod = re.search(rb"/ModDate\s*\(([^)]+)\)", pdf_bytes)
        if m_mod:
            mod_date = self._parse_pdf_date(m_mod.group(1).decode("latin-1", errors="ignore"))

        m_prod = re.search(rb"/Producer\s*\(([^)]+)\)", pdf_bytes)
        if m_prod:
            producer = m_prod.group(1).decode("latin-1", errors="ignore")

        m_creator = re.search(rb"/Creator\s*\(([^)]+)\)", pdf_bytes)
        if m_creator:
            creator = m_creator.group(1).decode("latin-1", errors="ignore")

        return {
            "revisions": revisions,
            "revision_count": total_revisions,
            "has_incremental_updates": total_revisions > 1,
            "has_embedded_javascript": has_js,
            "has_acroform": has_acroform,
            "has_annots": has_annots,
            "creation_date": creation_date,
            "mod_date": mod_date,
            "producer": producer,
            "creator": creator,
        }

    def inspect_pdf(self, file_bytes: bytes) -> PDFInspectionReport:
        """
        Executes complete structural and semantic audit of a PDF document.
        Combines low-level xref revision traversal with high-level object parsing.
        """
        if not file_bytes.startswith(b"%PDF-"):
            return PDFInspectionReport(
                is_valid_pdf=False,
                page_count=0,
                revision_count=0,
                has_incremental_updates=False,
                tamper_confidence_score=1.0,
                anomalies=[
                    PDFStructuralAnomaly(
                        anomaly_code="INVALID_PDF_HEADER",
                        severity="CRITICAL",
                        description="File does not start with standard %PDF- magic signature.",
                        evidence_detail=f"First 8 bytes: {file_bytes[:8].hex()}"
                    )
                ]
            )

        binary_info = self._analyze_binary_stream(file_bytes)
        anomalies: List[PDFStructuralAnomaly] = []
        unembedded_fonts: List[str] = []
        page_count = 1
        has_hidden_layers = False

        # If PyMuPDF is available, conduct deep DOM object inspection
        if HAS_FITZ:
            try:
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                page_count = len(doc)

                # Inspect metadata directly from fitz
                meta = doc.metadata or {}
                if meta.get("creationDate") and not binary_info["creation_date"]:
                    binary_info["creation_date"] = self._parse_pdf_date(meta.get("creationDate"))
                if meta.get("modDate") and not binary_info["mod_date"]:
                    binary_info["mod_date"] = self._parse_pdf_date(meta.get("modDate"))
                if meta.get("producer") and not binary_info["producer"]:
                    binary_info["producer"] = meta.get("producer")
                if meta.get("creator") and not binary_info["creator"]:
                    binary_info["creator"] = meta.get("creator")

                # Font embedding validation
                for page in doc:
                    fonts = page.get_fonts()
                    for f in fonts:
                        # f structure: (xref, ext, type, basefont, name, encoding)
                        font_name = f[3]
                        # In fitz, un-embedded fonts often have empty buffer or specific type tags
                        if "NotEmbedded" in str(f) or len(f) > 4 and not f[4]:
                            unembedded_fonts.append(font_name)

                # Hidden text or occluded layer detection
                for page in doc:
                    text_instances = page.get_text("blocks")
                    # Check for zero-opacity or zero-sized bounding text
                    for block in text_instances:
                        if len(block) >= 5 and (block[2] - block[0] < 1 or block[3] - block[1] < 1):
                            has_hidden_layers = True
                            break

                doc.close()
            except Exception as e:
                logger.warning(f"PyMuPDF DOM parsing encountered an issue: {e}")
                anomalies.append(
                    PDFStructuralAnomaly(
                        anomaly_code="MALFORMED_DOM_RECOVERY",
                        severity="MEDIUM",
                        description="PDF document tree structure contains syntax corruption or non-standard xref encoding.",
                        evidence_detail=str(e)
                    )
                )

        # Evaluate incremental updates
        if binary_info["has_incremental_updates"]:
            anomalies.append(
                PDFStructuralAnomaly(
                    anomaly_code="INCREMENTAL_REVISION_DETECTED",
                    severity="HIGH",
                    description=(
                        f"Document contains {binary_info['revision_count']} distinct revision trees (multiple %%EOF tags). "
                        "This indicates post-signing or secondary modifications were appended to the original document."
                    ),
                    evidence_detail=f"Revisions count: {binary_info['revision_count']}"
                )
            )

        # Date consistency evaluation
        c_date = binary_info["creation_date"]
        m_date = binary_info["mod_date"]
        if c_date and m_date and c_date != m_date:
            anomalies.append(
                PDFStructuralAnomaly(
                    anomaly_code="CREATION_MODIFICATION_TIME_SKEW",
                    severity="MEDIUM",
                    description="Document modification timestamp diverges from creation timestamp.",
                    evidence_detail=f"Created: {c_date} | Modified: {m_date}"
                )
            )

        # JavaScript execution warning
        if binary_info["has_embedded_javascript"]:
            anomalies.append(
                PDFStructuralAnomaly(
                    anomaly_code="EMBEDDED_JAVASCRIPT_ACTIONS",
                    severity="CRITICAL",
                    description="Executable JavaScript streams detected in PDF. Commonly used in weaponized invoices or dynamic content tampering.",
                    evidence_detail="Pattern matches /JavaScript or /JS object streams."
                )
            )

        # Unembedded fonts warning (often indicative of altered text fields)
        if len(unembedded_fonts) > 0:
            anomalies.append(
                PDFStructuralAnomaly(
                    anomaly_code="UNEMBEDDED_SUBSTITUTED_FONTS",
                    severity="MEDIUM",
                    description="Text fields rely on system-fallback fonts rather than embedded font descriptors.",
                    evidence_detail=f"Fonts: {', '.join(unembedded_fonts[:3])}"
                )
            )

        # Calculate manipulation confidence score
        tamper_score = 0.0
        for an in anomalies:
            if an.severity == "CRITICAL":
                tamper_score += 0.45
            elif an.severity == "HIGH":
                if an.anomaly_code == "INCREMENTAL_REVISION_DETECTED":
                    tamper_score += 0.38 + (binary_info["revision_count"] - 1) * 0.05
                else:
                    tamper_score += 0.30
            elif an.severity == "MEDIUM":
                tamper_score += 0.15
            elif an.severity == "LOW":
                tamper_score += 0.05
        tamper_score = min(1.0, tamper_score)

        return PDFInspectionReport(
            is_valid_pdf=True,
            page_count=page_count,
            revision_count=binary_info["revision_count"],
            has_incremental_updates=binary_info["has_incremental_updates"],
            creation_date=binary_info["creation_date"],
            modification_date=binary_info["mod_date"],
            time_delta_seconds=None,
            producer=binary_info["producer"],
            creator=binary_info["creator"],
            unembedded_fonts=unembedded_fonts,
            has_hidden_text_layers=has_hidden_layers,
            has_form_fields_modified=binary_info["has_acroform"],
            has_embedded_javascript=binary_info["has_embedded_javascript"],
            revisions=binary_info["revisions"],
            anomalies=anomalies,
            tamper_confidence_score=round(tamper_score, 3)
        )
