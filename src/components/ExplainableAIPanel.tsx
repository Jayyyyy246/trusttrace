import React from 'react';
import { EvidenceCase, AnomalyRegion } from '../data/evidenceCases';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileSearch,
  CheckCircle2,
  ChevronRight,
  Info,
  HelpCircle,
  Clock,
  Laptop,
  Cpu,
  ArrowUpRight
} from 'lucide-react';

interface ExplainableAIPanelProps {
  evidence: EvidenceCase;
  selectedAnomalyId: string | null;
  onSelectAnomaly: (id: string | null) => void;
  onOpenProofModal: () => void;
}

export const ExplainableAIPanel: React.FC<ExplainableAIPanelProps> = ({
  evidence,
  selectedAnomalyId,
  onSelectAnomaly,
  onOpenProofModal
}) => {
  const isAuthentic = evidence.verdict === 'AUTHENTIC';
  const isCritical = evidence.verdict === 'CRITICAL';
  const isHighRisk = evidence.verdict === 'HIGH_RISK';

  return (
    <div className="bg-[#0b0c10] border border-[#1c1f26] rounded-xl p-5 space-y-6 flex flex-col h-full overflow-y-auto">
      {/* Risk & Trust Score Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isAuthentic
            ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
            : isCritical
            ? 'bg-red-950/30 border-red-800/50 text-red-300'
            : 'bg-amber-950/30 border-amber-800/50 text-amber-300'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              isAuthentic
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : isCritical
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {isAuthentic ? <ShieldCheck className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider">
                {evidence.verdict.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-current">
                Tamper Prob: {evidence.tamperProbability}%
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-0.5">{evidence.title}</h3>
          </div>
        </div>

        {/* Global Trust Score Dial */}
        <div className="flex items-center space-x-3 sm:border-l sm:border-current/20 sm:pl-4">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono block text-gray-400">Trust Score</span>
            <span
              className={`text-2xl font-black font-mono ${
                isAuthentic ? 'text-emerald-400' : isCritical ? 'text-red-400' : 'text-amber-400'
              }`}
            >
              {evidence.trustScore}
              <span className="text-xs font-normal text-gray-400">/100</span>
            </span>
          </div>
        </div>
      </div>

      {/* Non-Expert Plain-Language Translation (The Core Value for Ordinary Users) */}
      <div className="bg-[#101218] border border-[#202532] rounded-xl p-4 space-y-3">
        <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
          <HelpCircle className="w-4 h-4" />
          <span>Explainable AI Diagnostic (Plain English)</span>
        </div>
        <p className="text-xs text-gray-200 leading-relaxed font-normal">
          {evidence.summaryLayperson}
        </p>

        {/* Action Recommendation */}
        <div className="mt-2 p-2.5 rounded-lg bg-[#161a24] border border-[#2a3242] flex items-start space-x-2 text-xs">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-cyan-300 font-mono text-[11px] block">RECOMMENDED NEXT ACTION:</span>
            <span className="text-gray-300 text-[11px]">{evidence.recommendedAction}</span>
          </div>
        </div>
      </div>

      {/* Warning Signs List */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Key Warning Signs Detected</span>
        </h4>
        <div className="space-y-1.5">
          {evidence.keyWarningSigns.map((warning, idx) => (
            <div
              key={idx}
              className="bg-[#101216] border border-[#1e222b] p-2.5 rounded-lg flex items-start space-x-2 text-xs"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <span className="text-gray-300">{warning}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Tier Forensic Scores */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
          4-Layer Forensic Metric Breakdown
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-[#101216] border border-[#1e222b] p-2.5 rounded-lg">
            <span className="text-[10px] text-gray-400 block">Visual / ELA Purity</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-bold text-white">{evidence.scores.visualPurity}%</span>
              <div className="w-12 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full"
                  style={{ width: `${evidence.scores.visualPurity}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-[#101216] border border-[#1e222b] p-2.5 rounded-lg">
            <span className="text-[10px] text-gray-400 block">Noise Consistency</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-bold text-white">{evidence.scores.noiseConsistency}%</span>
              <div className="w-12 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full"
                  style={{ width: `${evidence.scores.noiseConsistency}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-[#101216] border border-[#1e222b] p-2.5 rounded-lg">
            <span className="text-[10px] text-gray-400 block">Typographic Harmony</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-bold text-white">{evidence.scores.typographicAlignment}%</span>
              <div className="w-12 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${evidence.scores.typographicAlignment}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-[#101216] border border-[#1e222b] p-2.5 rounded-lg">
            <span className="text-[10px] text-gray-400 block">Metadata Integrity</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-bold text-white">{evidence.scores.metadataIntegrity}%</span>
              <div className="w-12 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${evidence.scores.metadataIntegrity}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Detected Anomalies List */}
      {evidence.anomalies.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
            Clickable Flagged Anomalies ({evidence.anomalies.length})
          </span>
          <div className="space-y-2">
            {evidence.anomalies.map((anomaly) => {
              const isSelected = selectedAnomalyId === anomaly.id;
              return (
                <div
                  key={anomaly.id}
                  onClick={() => onSelectAnomaly(isSelected ? null : anomaly.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-950/40 border-red-500 shadow-md'
                      : 'bg-[#101216] border-[#1e222b] hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          anomaly.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'
                        }`}
                      />
                      <span>{anomaly.name}</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-gray-300 border border-gray-800">
                      {anomaly.confidence}% Conf
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                    {anomaly.laypersonExplanation}
                  </p>
                  <div className="mt-2 pt-1.5 border-t border-gray-800/80 text-[10px] font-mono text-cyan-400">
                    🔬 Tech: {anomaly.technicalDetail}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metadata & Technical Specs */}
      <div className="bg-[#101216] border border-[#1e222b] rounded-xl p-3.5 space-y-2 text-xs">
        <span className="text-[11px] font-mono text-gray-400 font-bold uppercase block">
          Embedded Metadata & Forensic Footprints
        </span>
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-gray-300">
          <div>
            <span className="text-gray-500 block">Software:</span>
            <span>{evidence.metadata.softwareDetected || 'Clean / None'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Color Profile:</span>
            <span>{evidence.metadata.colorSpace}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Dimensions:</span>
            <span>{evidence.dimensions}</span>
          </div>
          <div>
            <span className="text-gray-500 block">File Size:</span>
            <span>{evidence.fileSize}</span>
          </div>
        </div>
      </div>

      {/* Preserve Evidence / Proof Button */}
      <button
        onClick={onOpenProofModal}
        className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs tracking-wider uppercase transition shadow-lg shadow-cyan-900/30 flex items-center justify-center space-x-2 cursor-pointer mt-auto"
      >
        <ShieldCheck className="w-4 h-4" />
        <span>View Tamper-Evident Proof Certificate</span>
      </button>
    </div>
  );
};
