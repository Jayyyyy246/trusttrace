import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText, Printer } from 'lucide-react';
import { ARCHITECTURE_DIAGRAM, CHAIN_OF_CUSTODY_DIAGRAM } from '../data/blueprintData';
import { POSTGRES_DDL, FORENSIC_PIPELINE_DETAILS, XAI_MAPPING_RULES, THREAT_MODEL_MATRIX } from '../data/specificationContent';

interface FullDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FullDocumentModal: React.FC<FullDocumentModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateMarkdown = () => {
    return `# TRUSTTRACE: AI-Assisted Digital Evidence Verification and Tamper Detection Platform
**Production-Grade System Blueprint and Technical Architecture Specification**
**Author:** Lead AI Architect, Systems Engineer & Cryptographic Security Specialist
**Status:** Approved for Production Engineering

---

## 1. Requirements & System Scope

### Functional Requirements (FR)
- **FR-1: Multi-Modal Ingestion & Validation** — Accepts JPEG, PNG, WebP, TIFF, HEIC, PDF, and screenshots. Verifies magic bytes, strips malicious payload exploits, and executes static quarantine scans.
- **FR-2: Multi-Layer Tamper Detection Engine** — 4 synchronized forensic tiers: Metadata/EXIF Consistency, Visual & ELA Artifacts, OCR Typography & Layout Geometry, and PDF Incremental Stream Traversal.
- **FR-3: Non-Technical Forensic Report Generation** — Automated translation of cryptic forensic metrics into plain-language summaries, visual heatmaps, and court-admissible appendices.
- **FR-4: Cryptographic Timestamping & Tamper-Evident Hashing** — Dual SHA-256 + SHA3-512 pre-ingestion digests, RFC 3161 TSA tokens, and immutable ledger anchoring via Hedera Consensus Service.

### Non-Functional Requirements & Performance SLAs
- **Latency (Express Tier):** <= 2,500 ms (p95)
- **Latency (Deep Forensics):** <= 8,000 ms (p95)
- **Throughput:** 250 concurrent analyses / node; auto-scale to 2,500 jobs/min
- **Privacy:** Zero-Retention Mode (ZRM) with RAM tmpfs DoD 5220.22-M memory zeroization
- **Evidence Isolation:** Sandboxed gVisor / Firecracker microVMs with egress network disabled
- **Legal Admissibility:** Federal Rules of Evidence (FRE 902(13) & 902(14)) and ISO/IEC 27037 compliance

---

## 2. Architectural Layering & High-Level Design

### System Topology Architecture
\`\`\`
${ARCHITECTURE_DIAGRAM}
\`\`\`

### Tamper-Evident Chain-of-Custody Linked Hash Ledger
\`\`\`
${CHAIN_OF_CUSTODY_DIAGRAM}
\`\`\`

---

## 3. Technical Stack Recommendations

- **Client Presentation:** Next.js 15, React 19, Tailwind CSS v4, WebAssembly (WASM) for client-side pre-ingest hashing, React Native with iOS Secure Enclave / Android StrongBox KeyStore.
- **API & Ingestion:** Envoy Edge Proxy, Go 1.23 Streaming Ingestion Microservice, Python 3.12 FastAPI (UVLoop) for forensic orchestration.
- **Asynchronous Queue:** RabbitMQ 3.13 (AMQP with DLX), Redis 7.2 Cluster for state caching and SSE updates, Celery + NVIDIA Triton for GPU-accelerated ViT inference.
- **Persistence & Cryptography:** PostgreSQL 16 (TimescaleDB / JSONB), MinIO / AWS S3 (SSE-KMS, Object Lock), RFC 3161 TSA, Hedera Consensus Service (HCS).

---

## 4. Deep Multi-Layer Detection Engine Architecture

${FORENSIC_PIPELINE_DETAILS.map(tier => `### ${tier.layer}
**Core Tools:** ${tier.tools}

${tier.algorithms.map(algo => `- **${algo.name}:** ${algo.detail}
  *Threshold & Logic:* \`${algo.threshold}\``).join('\n\n')}
`).join('\n\n')}

---

## 5. Database Schema & Data Models

\`\`\`sql
${POSTGRES_DDL}
\`\`\`

---

## 6. Explainable AI (XAI) & Report Generation Engine

### Composite Bayesian Confidence Scoring Formula
$$S = \\frac{\\sum_{i=1}^{N} w_i \\cdot \\sigma(\\alpha_i (\\Delta_i - \\tau_i)) \\cdot \\gamma_i}{\\sum w_i}$$

### Anomaly to Human Explanation Mapping
${XAI_MAPPING_RULES.map(r => `| **[${r.severity}] ${r.category}** | \`${r.technicalFlag}\` | ${r.humanExplanation} |`).join('\n')}

---

## 7. Security, Privacy & Compliance

- **Zero-Retention Processing:** RAM tmpfs execution, no non-volatile writes, DoD 5220.22-M memory zeroization.
- **Client-Side Envelope Encryption:** AES-256-GCM data encryption keys wrapped via customer RSA public key.
- **Threat Mitigation:** gVisor sandboxing against polyglot PDF exploits, memory bounds against decompression bombs.
- **Legal Compliance:** Full alignment with ISO/IEC 27037 and FRE Rule 902(13)/(14).
`;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdown();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c1c1c] bg-[#080808]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#0a191f] border border-cyan-500/30 rounded-lg text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f3f4f6]">Full Technical Design Document</h3>
              <p className="text-xs text-[#8e8e93]">Complete Production Architecture & System Blueprint Specification</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyMarkdown}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-[#1a1a1a] hover:bg-[#252525] text-white border border-[#333333] transition-all shadow-sm cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Markdown' : 'Copy Markdown'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-[#8e8e93] hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8e8e93] hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Markdown Document Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-[#d1d5db] text-sm leading-relaxed font-sans bg-[#0a0a0a]">
          <div className="border-b border-[#1c1c1c] pb-6">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
              SYSTEM ARCHITECTURE SPECIFICATION &bull; DOC REF: TRACE-ARCH-2026-V2.4
            </span>
            <h1 className="text-2xl font-extrabold text-[#f3f4f6]">
              TRUSTTRACE: AI-Assisted Digital Evidence Verification & Tamper Detection Platform
            </h1>
            <p className="mt-2 text-[#8e8e93] text-xs">
              Architectural design specification for ingesting, analyzing, verifying, and preserving digital media evidence against multi-layered tampering, synthetic generation, and visual forgery.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#f3f4f6] tracking-tight border-b border-[#1c1c1c] pb-2">
              1. Requirements & System Scope
            </h2>
            <p className="text-xs text-[#a1a1aa]">
              TRUSTTRACE ingests multi-modal evidence (screenshots, financial PDFs, receipts, camera photos) and isolates them inside disposable sandbox microVMs. It computes FIPS-compliant dual genesis hashes (SHA-256 and SHA3-512), executes four synchronized forensic inspection tiers, and produces both an explainable non-technical forensic diagnosis and a court-certified technical ledger.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#f3f4f6] tracking-tight border-b border-[#1c1c1c] pb-2">
              2. Architectural Layering & High-Level Design
            </h2>
            <div className="p-4 bg-[#050505] rounded-lg border border-[#1c1c1c] font-mono text-[11px] overflow-x-auto text-cyan-300">
              <pre>{ARCHITECTURE_DIAGRAM}</pre>
            </div>
            <div className="p-4 bg-[#050505] rounded-lg border border-[#1c1c1c] font-mono text-[11px] overflow-x-auto text-emerald-300">
              <pre>{CHAIN_OF_CUSTODY_DIAGRAM}</pre>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#f3f4f6] tracking-tight border-b border-[#1c1c1c] pb-2">
              3. Deep Multi-Layer Detection Engine
            </h2>
            <div className="space-y-4">
              {FORENSIC_PIPELINE_DETAILS.map((t, idx) => (
                <div key={idx} className="bg-[#0d0d0d] p-4 rounded-lg border border-[#1f1f1f] space-y-2">
                  <h3 className="text-sm font-bold text-cyan-300">{t.layer}</h3>
                  <p className="text-xs text-[#8e8e93] font-mono">Tools: {t.tools}</p>
                  <div className="space-y-2 pt-2">
                    {t.algorithms.map((a, aidx) => (
                      <div key={aidx} className="text-xs border-t border-[#1a1a1a] pt-2">
                        <strong className="text-[#ededed]">{a.name}</strong>
                        <p className="text-[#8e8e93] mt-0.5">{a.detail}</p>
                        <span className="text-[11px] text-amber-300 font-mono block mt-1">Logic: {a.threshold}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#f3f4f6] tracking-tight border-b border-[#1c1c1c] pb-2">
              4. Database Schema & Data Models (PostgreSQL 16)
            </h2>
            <div className="p-4 bg-[#050505] rounded-lg border border-[#1c1c1c] font-mono text-xs overflow-x-auto text-[#d1d5db] max-h-72">
              <pre>{POSTGRES_DDL}</pre>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#f3f4f6] tracking-tight border-b border-[#1c1c1c] pb-2">
              5. Explainable AI (XAI) & Report Generation Engine
            </h2>
            <div className="space-y-2">
              {XAI_MAPPING_RULES.map((r, idx) => (
                <div key={idx} className="p-3 bg-[#0d0d0d] rounded border border-[#1f1f1f] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-rose-300 font-bold block">{r.technicalFlag}</span>
                    <span className="text-[#d1d5db]">{r.humanExplanation}</span>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#141414] border border-[#262626] text-cyan-300 self-start sm:self-auto">
                    {r.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#f3f4f6] tracking-tight border-b border-[#1c1c1c] pb-2">
              6. Security, Privacy & Compliance
            </h2>
            <p className="text-xs text-[#a1a1aa]">
              Adheres strictly to ISO/IEC 27037 standards for digital evidence handling, Federal Rules of Evidence 902(13)/(14) self-authenticating electronic records, and GDPR Right-to-Erasure via zero-knowledge DoD 5220.22-M memory zeroization.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#1c1c1c] bg-[#080808]">
          <span className="text-xs text-[#71717a] font-mono">
            TRUSTTRACE &copy; 2026 Systems Architecture Blueprint
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded bg-[#141414] hover:bg-[#1f1f1f] text-[#ededed] border border-[#2d2d2d] transition-all cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
