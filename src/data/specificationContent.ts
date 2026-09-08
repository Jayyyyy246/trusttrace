export const POSTGRES_DDL = `-- ============================================================================
-- TRUSTTRACE ENTERPRISE SCHEMA (PostgreSQL 16+)
-- Digital Evidence Verification & Immutable Forensic Custody
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS & ORGANIZATIONS
CREATE TABLE organizations (
    org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    tier VARCHAR(50) DEFAULT 'enterprise', -- 'standard', 'forensic_pro', 'enterprise'
    zero_retention_default BOOLEAN DEFAULT FALSE,
    rfc3161_tsa_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'analyst', -- 'admin', 'lead_forensic_examiner', 'analyst', 'auditor'
    public_key_pem TEXT,                -- Optional client-side public key for envelope encryption
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. EVIDENCE MASTER RECORDS
CREATE TABLE evidence_records (
    evidence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(org_id),
    submitted_by UUID REFERENCES users(user_id),
    original_filename VARCHAR(512) NOT NULL,
    sanitized_filename VARCHAR(512) NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_uri VARCHAR(1024),          -- S3 bucket URI or NULL if Zero-Retention Mode
    zero_retention_mode BOOLEAN DEFAULT FALSE,
    retention_expires_at TIMESTAMPTZ,
    custody_state VARCHAR(64) DEFAULT 'INGESTED', -- 'INGESTED', 'ANALYZING', 'VERIFIED', 'FLAGGED', 'EXPUNGED'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_evidence_org ON evidence_records(org_id);
CREATE INDEX idx_evidence_state ON evidence_records(custody_state);

-- 3. CRYPTOGRAPHIC INTEGRITY & HASH REGISTRY
CREATE TABLE cryptographic_hashes (
    hash_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id UUID NOT NULL REFERENCES evidence_records(evidence_id) ON DELETE CASCADE,
    sha256_hash CHAR(64) NOT NULL,
    sha3_512_hash CHAR(128) NOT NULL,
    ssdeep_fuzzy_hash VARCHAR(255),
    rfc3161_timestamp_token BYTEA,       -- Certified TSA DER token
    tsa_authority_url VARCHAR(255),      -- e.g., timestamp.digicert.com
    tsa_timestamp TIMESTAMPTZ,
    ledger_anchor_network VARCHAR(64),   -- 'hedera_consensus_service' or 'hyperledger_fabric'
    ledger_transaction_id VARCHAR(255),
    anchored_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_evidence_hashes UNIQUE(evidence_id)
);

CREATE INDEX idx_sha256 ON cryptographic_hashes(sha256_hash);

-- 4. VERIFICATION JOBS
CREATE TABLE verification_jobs (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id UUID NOT NULL REFERENCES evidence_records(evidence_id) ON DELETE CASCADE,
    analysis_depth VARCHAR(32) DEFAULT 'DEEP', -- 'EXPRESS', 'STANDARD', 'DEEP', 'COURT_ADMISSIBLE'
    status VARCHAR(32) DEFAULT 'PENDING',       -- 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'
    allocated_worker_pod VARCHAR(128),
    execution_duration_ms INTEGER,
    overall_tamper_score NUMERIC(5,2),         -- Normalized 0.00 to 100.00
    risk_classification VARCHAR(32),           -- 'VERIFIED_AUTHENTIC', 'LOW_ANOMALY', 'SUSPECTED_TAMPER', 'DEFINITIVE_FORGERY'
    error_message TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_status ON verification_jobs(status);

-- 5. FORENSIC FINDINGS (PER LAYER DIAGNOSTICS)
CREATE TABLE forensic_findings (
    finding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES verification_jobs(job_id) ON DELETE CASCADE,
    layer_name VARCHAR(64) NOT NULL,           -- 'METADATA_EXIF', 'VISUAL_ELA', 'NOISE_ANALYSIS', 'OCR_LAYOUT', 'PDF_STRUCTURE'
    module_identifier VARCHAR(128) NOT NULL,   -- e.g. 'double_jpeg_benford_v2', 'trocr_font_weight'
    anomaly_detected BOOLEAN NOT NULL DEFAULT FALSE,
    layer_confidence NUMERIC(5,2) NOT NULL,     -- 0.00 to 100.00
    technical_metrics JSONB NOT NULL,          -- Raw coordinates, variance ratios, DCT statistics
    xai_human_explanation TEXT NOT NULL,       -- Layperson explanation
    bounding_boxes JSONB,                      -- Array of [{x, y, w, h, label}]
    overlay_artifact_s3_uri VARCHAR(1024),     -- Heatmap visual overlay file
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_findings_job ON forensic_findings(job_id);
CREATE INDEX idx_findings_layer ON forensic_findings(layer_name);

-- 6. IMMUTABLE CHAIN-OF-CUSTODY AUDIT LEDGER (TAMPER-EVIDENT MERKLE CHAIN)
CREATE TABLE custody_audit_logs (
    block_index BIGSERIAL PRIMARY KEY,
    evidence_id UUID NOT NULL REFERENCES evidence_records(evidence_id),
    action_type VARCHAR(64) NOT NULL,          -- 'INGEST', 'WORKER_ACQUIRE', 'FINDING_WRITE', 'REPORT_SEAL', 'LEGAL_EXPORT'
    actor_identifier VARCHAR(255) NOT NULL,    -- Service account or authenticated user ID
    client_ip INET,
    previous_block_hash CHAR(64) NOT NULL,     -- Points to previous block in chain
    payload_hash CHAR(64) NOT NULL,            -- SHA-256 of current event metadata
    current_block_hash CHAR(64) NOT NULL,      -- SHA-256(previous_block_hash || payload_hash || action_type || timestamp)
    event_payload JSONB NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_custody_evidence ON custody_audit_logs(evidence_id);
CREATE INDEX idx_custody_block_hash ON custody_audit_logs(current_block_hash);
`;

export const FORENSIC_PIPELINE_DETAILS = [
  {
    layer: "Tier 1: Metadata & Structural Forensics",
    color: "blue",
    tools: "ExifTool 12.8+, libtiff, PyPDF4, C++ Structural Parsers",
    algorithms: [
      {
        name: "EXIF Discrepancy & Software Footprint Analysis",
        detail: "Extracts primary EXIF, IPTC, and XMP blocks. Flags signatures of photo editing packages (Photoshop, GIMP, Canva, PicsArt, Pixelmator). Inspects 'Software', 'ProcessingSoftware', and 'CreatorTool' tags.",
        threshold: "Score = 1.0 (Flagged) if editing software markers detected; Cross-checked with device metadata."
      },
      {
        name: "Timestamp Chronology & Alignment Check",
        detail: "Validates temporal congruence between DateTimeOriginal, DateTimeDigitized, FileModifyDate, and GPS timestamp. Inconsistencies where FileModifyDate precedes DateTimeOriginal trigger immediate tampering flags.",
        threshold: "Delta > 1.000 ms between GPS UTC clock and embedded EXIF local clock (accounting for timezone)."
      },
      {
        name: "Quantization Table Fingerprinting",
        detail: "Extracts DQT (Define Quantization Table) markers from JPEG segments. Matches luminance and chrominance 8x8 matrices against an indexed database of 28,000+ camera firmware profiles vs. standard libjpeg / Photoshop compression matrices.",
        threshold: "Euclidean distance matrix d(Q_test, Q_camera) > threshold implies non-camera re-compression."
      }
    ]
  },
  {
    layer: "Tier 2: Image & Visual Artifact Forensics",
    color: "emerald",
    tools: "OpenCV 4.10, PyTorch 2.4, SciPy, NumPy, Albumentations",
    algorithms: [
      {
        name: "Error Level Analysis (ELA)",
        detail: "Re-saves the image candidate at a deterministic 95% JPEG quality factor. Computes absolute pixel-level difference between original and re-compressed representation: Δ = |I_orig - I_resaved| * Scale(8x). Unaltered regions exhibit uniform error rates, whereas pasted/spliced areas show sharp hyper-intense localized peaks.",
        threshold: "Local variance threshold: Var(Δ_local) / Var(Δ_global) > 3.25 over 32x32 pixel windows."
      },
      {
        name: "High-Frequency Noise Residual Variance (Laplacian/Median)",
        detail: "Applies high-pass residual filter: R = I - MedianFilter(I, k=3). Evaluates local noise variance across a sliding grid. Spliced foreign elements, text insertions, or AI inpainting invariably bring mismatched sensor noise signatures (PRNU - Photo-Response Non-Uniformity).",
        threshold: "Local noise variance Z-score |Z_noise| > 2.8 Standard Deviations."
      },
      {
        name: "Double JPEG Compression / Benford's Law Detection",
        detail: "Analyzes first-digit distribution of Discrete Cosine Transform (DCT) AC coefficients across 8x8 blocks. First-time compressed JPEGs adhere to generalized Benford's Law (P(d) = log10(1 + 1/(d^q))). Re-compressed or spliced segments create periodic histogram periodicities (zeros and peaks in quantization).",
        threshold: "Chi-Square goodness of fit test statistic χ² > 18.48 (p < 0.001)."
      },
      {
        name: "Copy-Move Forgery Detection (Keypoints + Dense PatchMatch)",
        detail: "Combines SIFT / ORB keypoint extraction with g-nearest neighbor spatial clustering. Spliced cloned regions (e.g. cloning a stamp, duplicating signature strokes) are identified by matching invariant feature descriptors filtered by affine RANSAC.",
        threshold: "Minimum 12 spatially coherent matched keypoints with RANSAC inlier ratio > 0.82."
      },
      {
        name: "Spatial Deepfake & Neural Synthesis Classifier (Vision Transformer)",
        detail: "Swin-Transformer / ConvNeXt-Large backbone fine-tuned on FaceForensics++, GenImage, and Synthbuster datasets. Identifies generative artifacts (diffusion step residuals, asymmetric pupil reflections, checkerboard deconvolutions).",
        threshold: "Softmax confidence output P(Synthetic) > 0.75."
      }
    ]
  },
  {
    layer: "Tier 3: OCR, Typography & Layout Forensics",
    color: "amber",
    tools: "Tesseract 5.4 (LSTM), TrOCR (Vision-Encoder-Decoder), Shapely, Scikit-Image",
    algorithms: [
      {
        name: "Font Geometry & Stroke-Width Anomaly Detection",
        detail: "Segments all alphanumeric characters into isolated glyph bounding boxes. Computes morphological skeletonization to quantify stroke-width variance, terminal serifs, and aspect ratio. Detects digitally inserted characters on receipts, bank statements, or invoices.",
        threshold: "Stroke-width deviation across same-line characters > 22% variance."
      },
      {
        name: "Baseline Pixel Jitter & Alignment Regression",
        detail: "Fits horizontal baseline regression line y = mx + c through the bottom coordinates of characters across single text lines. Digitally altered amounts or words pasted into existing documents suffer sub-pixel line jumps.",
        threshold: "Residual vertical offset |y_actual - y_regressed| > 2.2 pixels on standard 300 DPI scale."
      },
      {
        name: "Inter-Character Kerning & Word Spacing Distribution",
        detail: "Calculates inter-glyph spacing distributions using statistical kernel density estimation. Modern word processors maintain consistent proportional spacing; manual cut-and-paste manipulation creates spacing anomalies.",
        threshold: "Spacing disparity > 2.5 IQR (Interquartile Range) relative to paragraph median."
      }
    ]
  },
  {
    layer: "Tier 4: Document & PDF Integrity Forensics",
    color: "purple",
    tools: "QPDF, PDFMiner.six, PyMuPDF, OpenSSL 3.3, Java Apache PDFBox Sandbox",
    algorithms: [
      {
        name: "Incremental Revision & Trailer Tree Inspection",
        detail: "Traverses raw PDF stream looking for multiple 'startxref' markers, '/Prev' pointers, and EOF revisions. Detects when a PDF was modified and saved incrementally after an initial cryptographic signing or rendering.",
        threshold: "Count(Incremental_Updates) > 0; Flags any structural byte delta after digital signature block."
      },
      {
        name: "Invisible Text & Stream Decoupling Detection",
        detail: "Inspects rendering modes (Text Rendering Mode 3: Neither fill nor stroke text) and z-index occlusion layers. Detects hidden white-on-white text, obscured background layers, or manipulated FlateDecode streams.",
        threshold: "Detected text streams obscured by opaque bounding polygons or set to zero-opacity."
      },
      {
        name: "Embedded Font CID Metrics vs. Glyph Delta",
        detail: "Extracts TrueType / Type 1 font CID (Character Identifier) tables and compares character bounding metrics declared in /FontDescriptor against the actual vector bezier curves rendered.",
        threshold: "Glyph substitution detected if font table contains missing character mapping."
      },
      {
        name: "Cryptographic Signature & Certificate Trust Audit",
        detail: "Validates Adobe Approved Trust List (AATL) / PAdES signatures. Verifies CRL (Certificate Revocation Lists) and OCSP stapling. Checks whether modifications altered form fields outside certified permissions.",
        threshold: "Signature validity: PAdES-B-LTA conformance status."
      }
    ]
  }
];

export const XAI_MAPPING_RULES = [
  {
    technicalFlag: "ELA pixel difference variance ratio > 3.25 in bounding region (x: 420, y: 180, w: 180, h: 45)",
    humanExplanation: "A rectangular area around the transaction amount has significantly different compression levels than the surrounding page. This strongly suggests that this specific number was digitally spliced or pasted in from another image.",
    severity: "CRITICAL",
    category: "Pixel Splicing"
  },
  {
    technicalFlag: "Chi-Square test on DCT AC coefficients χ² = 24.1 (p < 0.0005) against Benford's Law",
    humanExplanation: "The digital file has been saved and re-compressed multiple times with mismatched settings, a classic signature of opening an existing screenshot in an image editor, altering contents, and re-exporting.",
    severity: "HIGH",
    category: "Double Compression"
  },
  {
    technicalFlag: "Baseline regression offset = +4.8px on character sequence '$ 1 4 , 5 0 0 . 0 0'",
    humanExplanation: "The text showing '$14,500.00' does not rest on the same baseline line as the surrounding text. The subtle vertical misalignment indicates the digits were placed manually by a graphic editing tool.",
    severity: "HIGH",
    category: "Typography Anomaly"
  },
  {
    technicalFlag: "EXIF CreatorTool contains 'Adobe Photoshop 2024 (Windows)'; DateTimeOriginal != FileModifyDate",
    humanExplanation: "Internal file metadata confirms this image was processed using Adobe Photoshop on a desktop computer, which contradicts claims that this is an unedited direct camera photo.",
    severity: "MEDIUM",
    category: "Metadata Footprint"
  },
  {
    technicalFlag: "Multiple '/Prev' cross-reference table revisions found in PDF trailer",
    humanExplanation: "The document contains multiple revision versions. The original document was modified after creation, appending changes to the end of the file rather than remaining in its original published state.",
    severity: "HIGH",
    category: "PDF Revision Delta"
  },
  {
    technicalFlag: "Stroke-width variance across receipt total line = 34.2% (exceeds 22% uniform ceiling)",
    humanExplanation: "The font boldness and thickness of the total price line does not match the rest of the receipt. The numbers appear darker and thicker, typical of using a fake digital font overlay.",
    severity: "HIGH",
    category: "Font Weight Anomaly"
  },
  {
    technicalFlag: "High-frequency noise residual Z-score = 3.9 in signature bounding box",
    humanExplanation: "The signature area exhibits zero natural camera/scanner sensor noise compared to the textured background paper, indicating a digital signature graphic was stamped onto the document.",
    severity: "CRITICAL",
    category: "Noise Inconsistency"
  }
];

export const THREAT_MODEL_MATRIX = [
  {
    threat: "Malicious Polyglot & Buffer Overflow Payload (CVE-style PDF exploits)",
    vector: "Adversary uploads a weaponized PDF/TIFF designed to exploit libpng / libvips memory vulnerabilities in worker.",
    mitigation: "Ingestion gateway enforces strict ClamAV static detonation + sandboxed parsing inside ephemeral gVisor / Firecracker microVMs with no network egress.",
    status: "Hardened"
  },
  {
    threat: "Evidence Tampering & Post-Analysis Record Alteration",
    vector: "Rogue database administrator attempts to modify forensic findings or tamper scores in PostgreSQL.",
    mitigation: "Cryptographic hash chaining: Every finding block is hashed with parent block hash and anchored to public RFC 3161 TSA and Hedera Consensus Service. Any DB update invalidates Merkle root.",
    status: "Cryptographically Sealed"
  },
  {
    threat: "Privacy & Sensitive Document Leakage",
    vector: "Confidential financial statements or PII stored indefinitely in cloud storage leaks.",
    mitigation: "Zero-Retention Mode (ZRM): File resides solely in RAM tmpfs during active compute. Memory is zeroized with DoD 5220.22-M wipes immediately following report generation.",
    status: "Compliant"
  },
  {
    threat: "Denial of Service via Decompression Bomb (Zip/PDF Bomb)",
    vector: "Attacker submits 50KB PDF with recursive /FlateDecode streams decompressing to 25GB in worker memory.",
    mitigation: "Strict streaming decompression quotas (Max 100MB uncompressed memory ceiling per job). Immediate SIGKILL if expansion exceeds threshold.",
    status: "Protected"
  }
];
