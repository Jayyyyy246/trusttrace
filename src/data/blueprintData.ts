export interface SectionItem {
  id: string;
  title: string;
  shortTitle: string;
  iconName: string;
  description: string;
}

export const SECTIONS: SectionItem[] = [
  {
    id: "scope",
    title: "1. System Scope & Requirements",
    shortTitle: "Requirements & Scope",
    iconName: "ShieldCheck",
    description: "Core functional capabilities, multi-modal ingestion requirements, rigorous latency SLAs, zero-knowledge constraints, and non-functional targets."
  },
  {
    id: "architecture",
    title: "2. Architectural Layering & High-Level Design",
    shortTitle: "System Topology & Isolation",
    iconName: "Network",
    description: "Multi-tier decoupled architecture, sandboxed parsing clusters, ephemeral memory storage, and cryptographic evidence isolation boundary."
  },
  {
    id: "tech-stack",
    title: "3. Technical Stack Recommendations",
    shortTitle: "Technical Stack Matrix",
    iconName: "Layers",
    description: "Selected production-grade technologies across web/mobile interfaces, asynchronous task orchestration, high-throughput APIs, and immutable ledgers."
  },
  {
    id: "detection-engine",
    title: "4. Deep Multi-Layer Detection Engine",
    shortTitle: "Forensics Pipeline Engine",
    iconName: "Cpu",
    description: "Exhaustive four-tier pipeline: EXIF/Structural analysis, Error Level Analysis (ELA), Noise variance, Double JPEG, ViT/CNN spatial deepfake models, OCR font-anomaly, and PDF stream parsing."
  },
  {
    id: "database-schema",
    title: "5. Database Schema & Data Models",
    shortTitle: "Database Schemas & DDL",
    iconName: "Database",
    description: "Relational PostgreSQL DDL schemas for users, verification jobs, multi-layered forensic findings, hash records, and SHA-256/SHA-3 cryptographic chain-of-custody ledgers."
  },
  {
    id: "xai-reports",
    title: "6. Explainable AI (XAI) & Report Engine",
    shortTitle: "Explainable AI (XAI)",
    iconName: "FileSpreadsheet",
    description: "Heuristic mapping matrix translating raw mathematical anomalies into intuitive risk scores, confidence calibration curves, and dual-layer visual overlays."
  },
  {
    id: "security-compliance",
    title: "7. Security, Privacy & Compliance",
    shortTitle: "Security & Cryptography",
    iconName: "Lock",
    description: "Pre-ingestion malware detonation quarantine, Zero-Retention processing modes, client-side envelope encryption, and strict regulatory compliance (ISO 27037 / GDPR)."
  },
  {
    id: "core-services",
    title: "8. Production Core Services & Code Implementation",
    shortTitle: "Core Services Code",
    iconName: "Code2",
    description: "Executable Python FastAPI microservices: multi-layer ELA & noise forensic engine, PDF revision traversal, XAI scoring, and RFC 3161 cryptographic chain-of-custody proofs."
  },
  {
    id: "audit-benchmarks",
    title: "9. Security Audit, Edge-Cases & Performance Benchmarks",
    shortTitle: "Audit & Benchmark Suite",
    iconName: "CheckCheck",
    description: "Comprehensive security review, OWASP Top 10 mitigations, social media recompression false-positive handling, vectorized SIMD benchmarks, and PyTest execution suites."
  }
];

export const ARCHITECTURE_DIAGRAM = `
+-------------------------------------------------------------------------------------------------------+
|                                    TRUSTTRACE CLIENT / CONSUMER LAYER                                 |
|   +---------------------------------------+        +----------------------------------------------+   |
|   |   Web UI (Next.js / React 19 / WASM)  |        |    Mobile SDK (React Native / Secure Enclave) |   |
|   +-------------------+-------------------+        +----------------------+-----------------------+   |
|                       | (Mutual TLS / HTTPS / gRPC-Web)                   |                           |
+-----------------------|---------------------------------------------------|---------------------------+
                        v                                                   v
+-------------------------------------------------------------------------------------------------------+
|                                          PERIMETER SECURITY GATEWAY                                    |
|   * Cloudflare Magic Transit / AWS CloudFront DDoS Shield                                             |
|   * Envoy Edge Proxy: OAuth2/mTLS, Token-Bucket Rate Limiter, WAF Rule Validation                      |
|   * ClamAV / VirusTotal Sandbox Scanner: Immediate Detonation & Static Malware Quarantine             |
+---------------------------------------------------+---------------------------------------------------+
                                                    | (Sanitized Payload + Signed Pre-signed Token)
                                                    v
+-------------------------------------------------------------------------------------------------------+
|                                       INGESTION & METADATA BROKER                                     |
|   * Python FastAPI / Go Ingestion Orchestrator                                                        |
|   * Generates Dual Cryptographic Pre-Ingest Hashes: SHA-256 + SHA3-512 (FIPS 202)                    |
|   * Zero-Knowledge Header Stripping (Optional PII Redaction Proxy)                                    |
|   * Dispatches Analysis Contract to Distributed Message Broker                                        |
+-------------------------+----------------------------------------------------+------------------------+
                          |                                                    |
                          v                                                    v
          +-------------------------------+                    +-------------------------------+
          | Ephemeral Scratch Storage     |                    | Distributed Message Broker     |
          | Encrypted NVMe In-Memory (Tmpfs)                    | RabbitMQ / Redis Cluster      |
          | KMS Key: Per-Job AES-256-GCM  |                    | Priority Priority Job Queues  |
          +---------------+---------------+                    +---------------+---------------+
                          |                                                    |
                          +-----------------------+----------------------------+
                                                  v
+-------------------------------------------------------------------------------------------------------+
|                                DEEP MULTI-LAYER FORENSIC WORKER CLUSTERS                              |
|                          (Isolated Kubernetes Pods with gVisor / Firecracker Sandboxing)              |
|                                                                                                       |
|  [Tier 1: Metadata Engine]           [Tier 2: Visual Forensics]        [Tier 3: OCR & Layout Engine]  |
|  * ExifTool / PyExif C Binding        * Error Level Analysis (ELA)      * Tesseract 5 / TrOCR ViT     |
|  * Structural Header Parser          * Noise Variance Filter (Laplacian)* Font Family/Weight Anomaly   |
|  * Quantization Table Verifier       * Double Compression / Benford's  * Baseline Offset Deviation   |
|  * Device Signature Fingerprinting   * ViT Deepfake Spatial Classifier * Word Spacing Variance        |
|                                                                                                       |
|  [Tier 4: Document & PDF Integrity Engine]                                                            |
|  * Incremental Revision Tree Inspector (/Prev, /XRef parsing)                                        |
|  * Stream FlateDecode Decompression Anomaly Detection                                                |
|  * Embedded Font CID Metrics vs. Rendered Glyph Delta                                                 |
|  * Cryptographic Signature & Certificate Trust Chain Audit (Adobe PPKMS / PAdES)                      |
+---------------------------------------------------+---------------------------------------------------+
                                                    | Structured Finding Payloads
                                                    v
+-------------------------------------------------------------------------------------------------------+
|                                   EXPLAINABLE AI (XAI) & AGGREGATION ENGINE                            |
|   * Bayesian Weighting Model: Aggregates individual layer anomalies into global Confidence Score      |
|   * Generates Normalized False-Positive Calibrated Risk Matrix (0 - 100)                              |
|   * Assembles Visual Forensics Heatmap Layer (Color-Mapped Grad-CAM + ELA Contours)                   |
|   * Renders Non-Technical Executive Diagnostic Summary & Court-Admissible Technical Addendum          |
+---------------------------------------------------+---------------------------------------------------+
                                                    |
                    +-------------------------------+-------------------------------+
                    v                                                               v
+-----------------------------------------------+               +---------------------------------------+
|          PERSISTENCE STORAGE LAYER            |               |       IMMUTABLE EVIDENCE LEDGER       |
|  * PostgreSQL 16 (TimescaleDB / JSONB)        |               |  * RFC 3161 Certified Time Stamp     |
|    - Evidence Metadata & Audit Records        |               |    Authority (TSA Token Generation)   |
|    - Layer Findings & Coordinate Overlays     |               |  * Hedera Consensus Service /         |
|  * Amazon S3 / MinIO (Object Storage)         |               |    Hyperledger Fabric Anchor          |
|    - Encrypted Reports & Tamper Overlays      |               |  * Tamper-Proof Cryptographic         |
|    - Ephemeral Auto-Expiry (TTL 24h / Zero-Ret)|              |    Chain-of-Custody Linked Merkle Tree|
+-----------------------------------------------+               +---------------------------------------+
`;

export const CHAIN_OF_CUSTODY_DIAGRAM = `
  EVIDENCE INGESTION                        LAYERED AUDIT HASHING                    IMMUTABLE LEDGER ANCHOR
 [User File Upload]
        |
        v
 [Compute Genesis Hashes]
  SHA-256(Raw) + SHA3-512(Raw)
        |
        +----------------------------------->  Block #0 (Genesis Record)
        |                                      * Parent Hash: 00000000000...
        v                                      * Timestamp: T0 (Client Ingest)
 [Isolated Pod Analysis Run]                   * Operator: TrustTrace Gateway
        |                                      * SHA-256: H_0
        v                                                |
 [Worker Completed Findings]                             v
  H_findings = SHA-256(Finding JSON) --------> Block #1 (Forensic Finding Stamp)
        |                                      * Parent Hash: H_0
        v                                      * Forensic Worker ID: wrk-node-402
 [Generated XAI Heatmap & Report]              * SHA-256: H_1 = H(H_0 + Findings)
  H_report = SHA-256(Report PDF)                         |
        |                                                v
        +----------------------------------->  Block #2 (Final Report Closure)
                                               * Parent Hash: H_1
                                               * SHA-256: H_2 = H(H_1 + H_report)
                                               * RFC 3161 TSA Signature Token (Signed by DigiCert TSA)
                                               * Hedera Topic / HCS Consensus Timestamp Anchor
`;
