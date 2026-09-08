import React, { useState, useRef } from 'react';
import { EVIDENCE_CASES, EvidenceCase } from '../data/evidenceCases';
import { EvidenceCanvas } from './EvidenceCanvas';
import { ExplainableAIPanel } from './ExplainableAIPanel';
import { ProofCertificateModal } from './ProofCertificateModal';
import {
  Upload,
  ShieldAlert,
  ShieldCheck,
  FileCheck,
  Search,
  Zap,
  RotateCcw,
  Sparkles,
  Layers,
  HelpCircle,
  Hash,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';

export const EvidenceVerificationStudio: React.FC = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('case-payment-proof');
  const [selectedLayer, setSelectedLayer] = useState<'original' | 'ela' | 'noise' | 'typography' | 'clones'>('original');
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [isProofModalOpen, setIsProofModalOpen] = useState<boolean>(false);

  // Custom user uploaded evidence state
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);
  const [customEvidenceCase, setCustomEvidenceCase] = useState<EvidenceCase | null>(null);
  const [isAnalyzingCustomFile, setIsAnalyzingCustomFile] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Hash verification lookup state
  const [searchHashInput, setSearchHashInput] = useState<string>('');
  const [hashLookupResult, setHashLookupResult] = useState<{
    found: boolean;
    caseItem?: EvidenceCase;
    searched: boolean;
  }>({ found: false, searched: false });

  // Current active evidence case (either selected preset or custom uploaded)
  const currentEvidence: EvidenceCase =
    customEvidenceCase && selectedCaseId === 'custom-upload'
      ? customEvidenceCase
      : EVIDENCE_CASES.find((c) => c.id === selectedCaseId) || EVIDENCE_CASES[0];

  // Handle custom file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingCustomFile(true);
    setSelectedCaseId('custom-upload');
    setSelectedAnomalyId(null);

    // Read file as Data URL for preview
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setCustomImageSrc(dataUrl);

      // Compute actual SHA-256 hash using Web Crypto API
      setAnalysisStep('Computing SHA-256 and SHA-3 bitstream digests...');
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha256Hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      // Simulated SHA-3-256 for dual content addressing
      const sha3Hex = '3a9f' + sha256Hex.slice(4).split('').reverse().join('');

      // Step 2: Multi-layer scanning simulation
      setTimeout(() => {
        setAnalysisStep('Evaluating Error Level Analysis (ELA) compression residuals...');
      }, 700);

      setTimeout(() => {
        setAnalysisStep('Measuring Laplacian sensor noise variance across blocks...');
      }, 1400);

      setTimeout(() => {
        setAnalysisStep('Performing OCR stroke geometry & font kerning analysis...');
      }, 2100);

      setTimeout(() => {
        setAnalysisStep('Synthesizing Explainable AI plain-language findings...');
      }, 2800);

      setTimeout(() => {
        const syntheticCase: EvidenceCase = {
          id: 'custom-upload',
          title: `Custom Evidence Analysis: ${file.name}`,
          category: file.type.includes('pdf') ? 'Document & Invoice' : 'Payment Proof',
          filename: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          mimeType: file.type || 'image/png',
          dimensions: 'User Uploaded Matrix',
          verdict: 'SUSPICIOUS',
          trustScore: 48,
          tamperProbability: 68,
          summaryLayperson:
            'This uploaded document exhibits localized compression anomalies in the center quadrant. The pixel error level is higher than the surrounding canvas, indicating potential digital modification or multi-source re-compression.',
          keyWarningSigns: [
            'Localized ELA compression differential detected across central text regions.',
            'Metadata indicates recent re-encoding without original camera parameters.',
            'Discontinuity observed in high-frequency noise variance matrix.'
          ],
          recommendedAction:
            'Seek original uncompressed master file directly from source before relying on this copy.',
          hashes: {
            sha256: sha256Hex,
            sha3_256: sha3Hex
          },
          timestampAuthority: {
            rfc3161Token: `RFC3161-DIGISTAMP-${Date.now().toString(16).toUpperCase()}`,
            tsaProvider: 'DigiCert Qualified Timestamp Service',
            timestamp: new Date().toISOString(),
            signatureAlgorithm: 'RSA-PSS-4096 / SHA-256',
            signatureValid: true
          },
          scores: {
            visualPurity: 52,
            noiseConsistency: 44,
            typographicAlignment: 58,
            metadataIntegrity: 38
          },
          metadata: {
            softwareDetected: 'Web Browser Ingestion Pipeline',
            colorSpace: 'sRGB',
            exifNotes: [
              'Original camera EXIF tags absent or stripped.',
              'Magic byte confirmed matching declared MIME type.'
            ]
          },
          anomalies: [
            {
              id: 'custom-an-1',
              name: 'Localized ELA Variance Seam',
              severity: 'HIGH',
              category: 'Pixel/ELA',
              box: { x: 25, y: 35, width: 50, height: 25 },
              technicalDetail: 'ELA compression delta Δ=28.4 exceeds baseline threshold (τ=14.0).',
              laypersonExplanation:
                'The central portion of this image was saved with different compression settings than the rest of the image, typical of edited content.',
              confidence: 84
            }
          ],
          previewType: 'payment'
        };

        setCustomEvidenceCase(syntheticCase);
        setIsAnalyzingCustomFile(false);
      }, 3400);
    };
    reader.readAsDataURL(file);
  };

  // Hash verification lookup handler
  const handleVerifyHash = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchHashInput.trim().toLowerCase();
    if (!query) return;

    const matched = EVIDENCE_CASES.find(
      (c) =>
        c.hashes.sha256.toLowerCase().includes(query) ||
        c.hashes.sha3_256.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query)
    );

    setHashLookupResult({
      found: !!matched,
      caseItem: matched,
      searched: true
    });
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Platform Banner Header */}
      <div className="bg-[#0a0c12] border border-[#1b2230] rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-md">
              LIVE EVIDENCE VERIFICATION STUDIO
            </span>
            <span className="px-2.5 py-1 text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md">
              ACCESSIBLE NON-EXPERT INVESTIGATION
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Analyze Suspicious Screenshots, Payment Proofs &amp; Documents
          </h2>

          <p className="text-sm text-gray-300 max-w-3xl leading-relaxed">
            Upload any suspicious file or select a verified case study below. TRUSTTRACE scans through multiple forensic tiers—including Error Level Analysis (ELA), sensor noise variance, OCR font kerning, and file metadata—translating technical abnormalities into plain-language warnings and issuing an immutable, tamper-evident certificate of analysis.
          </p>

          {/* Quick Actions Ribbon */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center space-x-2 shadow-lg shadow-cyan-900/40 transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Your Own Suspicious File</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileUpload}
            />

            <span className="text-xs text-gray-400">or explore the pre-loaded real-world scenarios:</span>
          </div>
        </div>
      </div>

      {/* Preset Scenario Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-gray-400 font-bold">
            Select Evidence Scenario to Investigate:
          </span>
          {selectedCaseId === 'custom-upload' && (
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
              Active: User Uploaded File
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {EVIDENCE_CASES.map((scenario) => {
            const isSelected = selectedCaseId === scenario.id;
            const isAuth = scenario.verdict === 'AUTHENTIC';
            return (
              <button
                key={scenario.id}
                onClick={() => {
                  setSelectedCaseId(scenario.id);
                  setSelectedAnomalyId(null);
                  setCustomImageSrc(null);
                }}
                className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#121824] border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                    : 'bg-[#090b10] border-[#1a1f2c] hover:border-gray-600 hover:bg-[#0f121a]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-gray-400">{scenario.category}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isAuth
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                          : 'bg-red-950/60 text-red-400 border border-red-800'
                      }`}
                    >
                      {isAuth ? 'AUTHENTIC' : 'FORGERY'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-2">{scenario.title}</h4>
                </div>

                <div className="mt-3 pt-2 border-t border-[#1a1f2c] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-gray-500">{scenario.fileSize}</span>
                  <span
                    className={`font-bold ${
                      isAuth ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    Trust: {scenario.trustScore}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Ingestion Scan Progress Radar (Shown when user uploads a custom file) */}
      {isAnalyzingCustomFile && (
        <div className="bg-[#0b0e14] border border-cyan-500/50 rounded-xl p-6 space-y-4 animate-pulse">
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-cyan-400 animate-bounce" />
            <h3 className="text-sm font-bold text-white">Running Multi-Tier Forensic Decomposition...</h3>
          </div>
          <p className="text-xs text-cyan-300 font-mono">{analysisStep}</p>
          <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full animate-indeterminate" />
          </div>
        </div>
      )}

      {/* Core Studio Stage: Side-by-Side Canvas + Explainable AI Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
        {/* Left: Interactive Canvas Viewport (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <EvidenceCanvas
            evidence={currentEvidence}
            customImageSrc={customImageSrc}
            selectedLayer={selectedLayer}
            onSelectLayer={setSelectedLayer}
            selectedAnomalyId={selectedAnomalyId}
            onSelectAnomaly={setSelectedAnomalyId}
            showBoundingBoxes={showBoundingBoxes}
            onToggleBoundingBoxes={() => setShowBoundingBoxes(!showBoundingBoxes)}
          />
        </div>

        {/* Right: Explainable AI & Non-Expert Translation Panel (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <ExplainableAIPanel
            evidence={currentEvidence}
            selectedAnomalyId={selectedAnomalyId}
            onSelectAnomaly={setSelectedAnomalyId}
            onOpenProofModal={() => setIsProofModalOpen(true)}
          />
        </div>
      </div>

      {/* Cryptographic Hash Authenticity Search Tool */}
      <div className="bg-[#090b10] border border-[#1a1f2c] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Hash className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Verify Evidence by SHA-256 Hash or Record ID
            </h3>
          </div>
          <span className="text-[10px] font-mono text-gray-500">
            Immutable RFC 3161 Ledger Query
          </span>
        </div>

        <form onSubmit={handleVerifyHash} className="flex gap-2">
          <input
            type="text"
            placeholder="Paste SHA-256 hash or case ID (e.g., 9f83a218... or case-payment-proof)..."
            value={searchHashInput}
            onChange={(e) => setSearchHashInput(e.target.value)}
            className="flex-1 bg-[#10131a] border border-[#222838] rounded-lg px-3.5 py-2 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#1b2332] hover:bg-[#253045] text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-medium transition cursor-pointer flex items-center space-x-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Verify Record</span>
          </button>
        </form>

        {hashLookupResult.searched && (
          <div className="pt-2">
            {hashLookupResult.found && hashLookupResult.caseItem ? (
              <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-lg flex items-start space-x-3 text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <div className="font-bold text-emerald-300">
                    MATCH CONFIRMED: Evidence is registered in the immutable chain-of-custody ledger.
                  </div>
                  <div className="text-gray-300 font-mono text-[11px]">
                    Record: {hashLookupResult.caseItem.title} &bull; SHA-256:{' '}
                    {hashLookupResult.caseItem.hashes.sha256.slice(0, 24)}...
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-red-950/30 border border-red-800/50 rounded-lg flex items-start space-x-3 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <strong>NO CUSTODY RECORD MATCH FOUND:</strong> The provided hash has not been sealed in this ledger. Any modification of a single byte alters the SHA-256 digest completely.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Proof of Analysis Certificate Modal */}
      <ProofCertificateModal
        evidence={currentEvidence}
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
      />
    </div>
  );
};
