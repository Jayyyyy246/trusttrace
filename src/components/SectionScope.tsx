import React from 'react';
import { ShieldCheck, CheckSquare, Clock, Zap, FileSpreadsheet, Lock, AlertTriangle, Scale } from 'lucide-react';

export const SectionScope: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Overview Card */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-6 shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-[#0a191f] border border-cyan-500/30 rounded-lg text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#f3f4f6] tracking-tight">1. Requirements & System Scope</h2>
            <p className="mt-1 text-sm text-[#9ca3af]">
              TRUSTTRACE is an enterprise-grade digital forensic verification platform designed to ingest ambiguous digital media (altered bank receipts, doctored contracts, modified chat screenshots, synthetic deepfakes) and deliver mathematically sound tamper detection paired with non-technical, explainable forensic diagnostics.
            </p>
          </div>
        </div>
      </div>

      {/* Functional Requirements Grid */}
      <div>
        <h3 className="text-base font-semibold text-[#e5e7eb] uppercase tracking-wider mb-4 flex items-center space-x-2">
          <CheckSquare className="w-4 h-4 text-cyan-400" />
          <span>Functional Requirements (FR)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-5">
            <div className="flex items-center space-x-2 text-cyan-400 mb-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#0a191f] border border-cyan-500/30 rounded">FR-1</span>
              <h4 className="font-semibold text-[#ededed] text-sm">Multi-Modal Ingestion & Validation</h4>
            </div>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              Accepts raster images (JPEG, PNG, WebP, TIFF, HEIC), digital documents (PDF, DOCX rendering), and mobile screenshots. Performs pre-ingestion magic-byte validation, deep file sanitization, virus detonation, and client-side pre-hash generation before storing payloads into sandboxed memory.
            </p>
          </div>

          <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-5">
            <div className="flex items-center space-x-2 text-cyan-400 mb-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#0a191f] border border-cyan-500/30 rounded">FR-2</span>
              <h4 className="font-semibold text-[#ededed] text-sm">Multi-Layer Tamper Detection Engine</h4>
            </div>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              Executes four synchronized diagnostic layers in parallel: Tier 1 (EXIF & Metadata Header Consistency), Tier 2 (Visual Forensics: Error Level Analysis, Laplacian Noise Variance, Double JPEG Benford Law, ViT Spatial Models), Tier 3 (OCR Typography & Stroke Geometry), and Tier 4 (PDF Incremental Traversal & Font stream validation).
            </p>
          </div>

          <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-5">
            <div className="flex items-center space-x-2 text-cyan-400 mb-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#0a191f] border border-cyan-500/30 rounded">FR-3</span>
              <h4 className="font-semibold text-[#ededed] text-sm">Non-Technical Forensic Report Generation</h4>
            </div>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              Translates opaque mathematical metrics (e.g. DCT coefficient kurtosis, noise variance gradients) into clear, actionable plain-language explanations. Generates visual heatmap overlays highlighting manipulated bounding boxes, coupled with a court-ready cryptographic appendix.
            </p>
          </div>

          <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-5">
            <div className="flex items-center space-x-2 text-cyan-400 mb-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#0a191f] border border-cyan-500/30 rounded">FR-4</span>
              <h4 className="font-semibold text-[#ededed] text-sm">Cryptographic Timestamping & Hashing</h4>
            </div>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              Generates dual pre-ingestion digest hashes (FIPS 180-4 SHA-256 and FIPS 202 SHA3-512). Acquires an RFC 3161 compliant cryptographic Time-Stamp Authority (TSA) token signed by a certified root CA and anchors Merkle root hashes to a decentralized immutable ledger (Hedera / Hyperledger).
            </p>
          </div>
        </div>
      </div>

      {/* Non-Functional Requirements Matrix */}
      <div>
        <h3 className="text-base font-semibold text-[#e5e7eb] uppercase tracking-wider mb-4 flex items-center space-x-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>Non-Functional Requirements & Performance SLAs</span>
        </h3>

        <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#080808] border-b border-[#1c1c1c] text-[#71717a] uppercase font-mono">
                <th className="p-3.5">Parameter</th>
                <th className="p-3.5">Target SLA Specification</th>
                <th className="p-3.5">Enforcement Mechanism</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717] text-[#d1d5db]">
              <tr>
                <td className="p-3.5 font-semibold text-[#f3f4f6] flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Max Latency (Express Tier)</span>
                </td>
                <td className="p-3.5 font-mono text-cyan-300">&le; 2.500 ms (p95)</td>
                <td className="p-3.5 text-[#8e8e93]">Parallelized in-memory metadata + basic ELA & layout checks.</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-[#f3f4f6] flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Max Latency (Deep Forensics)</span>
                </td>
                <td className="p-3.5 font-mono text-blue-300">&le; 8.000 ms (p95)</td>
                <td className="p-3.5 text-[#8e8e93]">GPU-accelerated Vision Transformer inference + PDF stream traversal.</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-[#f3f4f6] flex items-center space-x-2">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Throughput & Elasticity</span>
                </td>
                <td className="p-3.5 font-mono text-emerald-300">250 jobs/sec per cluster, burst to 2,500/min</td>
                <td className="p-3.5 text-[#8e8e93]">Kubernetes Horizontal Pod Autoscaler (HPA) triggered by queue lag.</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-[#f3f4f6] flex items-center space-x-2">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Privacy & Zero-Knowledge</span>
                </td>
                <td className="p-3.5 font-mono text-amber-300">Zero-Retention Mode (ZRM)</td>
                <td className="p-3.5 text-[#8e8e93]">Files processed purely in RAM tmpfs; memory overwritten via DoD 5220.22-M zeroization.</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-[#f3f4f6] flex items-center space-x-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Evidence Isolation Boundary</span>
                </td>
                <td className="p-3.5 font-mono text-rose-300">MicroVM Sandboxing (gVisor/Firecracker)</td>
                <td className="p-3.5 text-[#8e8e93]">Untrusted binaries/parsers isolated from host kernel; zero egress networking.</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-[#f3f4f6] flex items-center space-x-2">
                  <Scale className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Legal Admissibility (FRE)</span>
                </td>
                <td className="p-3.5 font-mono text-indigo-300">FRE 902(13) & 902(14) Compliant</td>
                <td className="p-3.5 text-[#8e8e93]">Automated certification with cryptographic hash records and immutable chain of custody.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
