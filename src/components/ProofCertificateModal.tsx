import React, { useState } from 'react';
import { EvidenceCase } from '../data/evidenceCases';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  Download,
  X,
  FileText,
  Clock,
  ExternalLink,
  Award,
  Hash
} from 'lucide-react';

interface ProofCertificateModalProps {
  evidence: EvidenceCase;
  isOpen: boolean;
  onClose: () => void;
}

export const ProofCertificateModal: React.FC<ProofCertificateModalProps> = ({
  evidence,
  isOpen,
  onClose
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const certificateJson = JSON.stringify(
    {
      platform: 'TRUSTTRACE Digital Evidence Verification Platform',
      version: '2.4.0',
      standard_compliance: ['ISO/IEC 27037:2012', 'FRE 902(14)', 'NIST SP 800-86'],
      evidence_record_id: `TT-EVD-2026-${evidence.id.toUpperCase()}`,
      ingested_filename: evidence.filename,
      mime_type: evidence.mimeType,
      file_size_bytes: evidence.fileSize,
      cryptographic_fingerprints: {
        sha256: evidence.hashes.sha256,
        sha3_256: evidence.hashes.sha3_256
      },
      forensic_verdict: evidence.verdict,
      trust_score_pct: evidence.trustScore,
      tamper_probability_pct: evidence.tamperProbability,
      rfc3161_timestamp: {
        tsa_provider: evidence.timestampAuthority.tsaProvider,
        utc_timestamp: evidence.timestampAuthority.timestamp,
        token_id: evidence.timestampAuthority.rfc3161Token,
        signature_algorithm: evidence.timestampAuthority.signatureAlgorithm,
        status: 'VERIFIED_VALID'
      },
      detected_anomalies_count: evidence.anomalies.length,
      anomalies_summary: evidence.anomalies.map((a) => ({
        id: a.id,
        category: a.category,
        severity: a.severity,
        confidence: a.confidence,
        layperson_diagnostic: a.laypersonExplanation
      }))
    },
    null,
    2
  );

  const handleDownload = () => {
    const blob = new Blob([certificateJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trusttrace-certificate-${evidence.filename}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0b0d12] border border-[#1e2533] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#1c222e] flex items-center justify-between bg-[#0e1118]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Tamper-Evident Certificate of Analysis
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                ISO/IEC 27037:2012 &bull; FRE 902(14) Cryptographic Chain-of-Custody
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Official Verification Seal Card */}
          <div className="p-5 rounded-xl bg-[#10141f] border border-cyan-500/30 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
                  IMMUTABLE EVIDENCE LEDGER RECORD
                </span>
                <div className="text-lg font-mono font-black text-white mt-0.5">
                  TT-EVD-2026-{evidence.id.toUpperCase().replace('-', '_')}
                </div>
                <div className="text-gray-300 mt-1">
                  File: <span className="font-mono text-cyan-300">{evidence.filename}</span> ({evidence.fileSize})
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold border flex items-center space-x-1.5 ${
                    evidence.verdict === 'AUTHENTIC'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                      : 'bg-red-950/80 text-red-300 border-red-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>SEALED &amp; VERIFIED</span>
                </span>
                <span className="text-[10px] text-gray-400 font-mono mt-1">
                  Trust Score: {evidence.trustScore}/100
                </span>
              </div>
            </div>
          </div>

          {/* Cryptographic Hashes (Dual Content Addressing) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Hash className="w-4 h-4 text-cyan-400" />
              <span>Dual-Hash Content Addressing (Bitstream Level)</span>
            </h4>

            {/* SHA-256 */}
            <div className="bg-[#0e1118] p-3 rounded-lg border border-[#1e2430] space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-mono text-gray-400 font-semibold">SHA-256 Checksum:</span>
                <button
                  onClick={() => handleCopy(evidence.hashes.sha256, 'sha256')}
                  className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  {copiedField === 'sha256' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedField === 'sha256' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="font-mono text-white break-all text-[11px] select-all bg-[#090b10] p-1.5 rounded border border-[#181c26]">
                {evidence.hashes.sha256}
              </p>
            </div>

            {/* SHA-3-256 */}
            <div className="bg-[#0e1118] p-3 rounded-lg border border-[#1e2430] space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-mono text-gray-400 font-semibold">SHA-3-256 (Keccak Permutation):</span>
                <button
                  onClick={() => handleCopy(evidence.hashes.sha3_256, 'sha3')}
                  className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  {copiedField === 'sha3' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedField === 'sha3' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="font-mono text-white break-all text-[11px] select-all bg-[#090b10] p-1.5 rounded border border-[#181c26]">
                {evidence.hashes.sha3_256}
              </p>
            </div>
          </div>

          {/* RFC 3161 Qualified Digital Timestamping */}
          <div className="bg-[#0e1118] p-4 rounded-xl border border-[#1e2430] space-y-2">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>RFC 3161 Qualified Time Stamping Authority (TSA)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono text-gray-300 pt-1">
              <div>
                <span className="text-gray-500 block">TSA Provider:</span>
                <span className="text-white font-medium">{evidence.timestampAuthority.tsaProvider}</span>
              </div>
              <div>
                <span className="text-gray-500 block">UTC Timestamp:</span>
                <span className="text-emerald-400 font-medium">{evidence.timestampAuthority.timestamp}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Signature Algorithm:</span>
                <span className="text-white">{evidence.timestampAuthority.signatureAlgorithm}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Cryptographic Token ID:</span>
                <span className="text-cyan-300">{evidence.timestampAuthority.rfc3161Token}</span>
              </div>
            </div>
          </div>

          {/* Chain-of-Custody Timeline Log */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
              Auditable Chain of Custody Timeline
            </span>
            <div className="border-l-2 border-cyan-500/40 pl-3 space-y-3 font-mono text-[11px]">
              <div>
                <div className="text-cyan-400 font-bold">1. File Ingestion & Quarantine Detonation</div>
                <div className="text-gray-400">
                  Computed SHA-256/SHA-3 hashes at offset 0. Magic byte confirmed valid MIME type.
                </div>
              </div>
              <div>
                <div className="text-cyan-400 font-bold">2. Multi-Layer Forensic Decomposition</div>
                <div className="text-gray-400">
                  Ran ELA Q75 re-quantization, Laplacian noise filter, OCR font geometry, and EXIF parser.
                </div>
              </div>
              <div>
                <div className="text-cyan-400 font-bold">3. Explainable AI Diagnostic Generated</div>
                <div className="text-gray-400">
                  Synthesized plain-language diagnostics and bounding box annotations.
                </div>
              </div>
              <div>
                <div className="text-emerald-400 font-bold">4. RFC 3161 Cryptographic Seal Executed</div>
                <div className="text-gray-400">
                  Evidence sealed with digital signature and immutable serial number.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-[#1c222e] bg-[#0e1118] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium text-xs transition cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs tracking-wider uppercase transition flex items-center space-x-2 shadow-lg shadow-cyan-900/40 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Official JSON Certificate</span>
          </button>
        </div>
      </div>
    </div>
  );
};
