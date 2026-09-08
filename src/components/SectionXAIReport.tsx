import React, { useState } from 'react';
import { FileSpreadsheet, Sparkles, AlertOctagon, HelpCircle, Eye, Sliders, CheckCircle2, ShieldAlert } from 'lucide-react';
import { XAI_MAPPING_RULES } from '../data/specificationContent';

export const SectionXAIReport: React.FC = () => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const filteredRules = filterSeverity === 'ALL'
    ? XAI_MAPPING_RULES
    : XAI_MAPPING_RULES.filter(r => r.severity === filterSeverity);

  return (
    <div className="space-y-8">
      {/* Overview Card */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-6 shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-[#0a191f] border border-cyan-500/30 rounded-lg text-cyan-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#f3f4f6] tracking-tight">6. Explainable AI (XAI) & Report Generation Engine</h2>
            <p className="mt-1 text-sm text-[#9ca3af]">
              Forensic tools fail if end-users and non-technical stakeholders (judges, fraud analysts, HR managers) cannot understand the output. The TRUSTTRACE XAI engine acts as an automated translation layer, transforming raw sensor variance and DCT kurtosis into plain-language diagnostics, visual heatmaps, and calibrated confidence dials.
            </p>
          </div>
        </div>
      </div>

      {/* Confidence Aggregation Formula Box */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-[#e5e7eb] uppercase tracking-wider flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Composite Bayesian Confidence Scoring Formula</span>
        </h3>
        <p className="text-xs text-[#a1a1aa] leading-relaxed">
          The global tamper probability score <code className="text-cyan-300 font-mono bg-[#141414] px-1 py-0.5 rounded border border-[#222222]">S &isin; [0, 100]</code> is synthesized across all four forensic layers using calibrated sigmoid response functions and dynamic cross-layer correlation weights:
        </p>

        <div className="bg-[#050505] p-4 rounded-lg border border-[#1c1c1c] font-mono text-xs text-cyan-300 overflow-x-auto">
          S = &sum;<sub>i=1..N</sub> [ w<sub>i</sub> &times; &sigma;(&alpha;<sub>i</sub>(&Delta;<sub>i</sub> - &tau;<sub>i</sub>)) &times; &gamma;<sub>i</sub> ] / &sum; w<sub>i</sub>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] text-[#8e8e93]">
          <div className="p-2.5 bg-[#0d0d0d] rounded border border-[#1f1f1f]">
            <strong className="text-[#ededed] font-mono block">w<sub>i</sub> (Layer Weight)</strong>
            Prioritized by adversarial resilience (e.g. PDF incremental trailer &gt; EXIF metadata).
          </div>
          <div className="p-2.5 bg-[#0d0d0d] rounded border border-[#1f1f1f]">
            <strong className="text-[#ededed] font-mono block">&sigma;(&Delta;<sub>i</sub> - &tau;<sub>i</sub>) (Sigmoid)</strong>
            Continuous normalization of metric delta over verified baseline threshold &tau;<sub>i</sub>.
          </div>
          <div className="p-2.5 bg-[#0d0d0d] rounded border border-[#1f1f1f]">
            <strong className="text-[#ededed] font-mono block">&gamma;<sub>i</sub> (Co-occurrence)</strong>
            Amplifies score when visual ELA AND typography jump corroborate the same area.
          </div>
        </div>
      </div>

      {/* Flag Translation Rules Table */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-3.5 border-b border-[#1c1c1c] bg-[#080808] gap-2">
          <div>
            <h3 className="text-xs font-bold text-[#ededed] uppercase tracking-wider">
              Forensic Anomaly to Layperson Translation Matrix
            </h3>
            <p className="text-[11px] text-[#8e8e93]">Automated rules converting cryptic numerical thresholds into human-verifiable evidence</p>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-[#8e8e93]">Severity:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2 py-0.5 text-[11px] font-mono rounded font-medium transition-all cursor-pointer ${
                  filterSeverity === sev
                    ? 'bg-[#1a1a1a] text-white border border-[#333333]'
                    : 'bg-[#0d0d0d] text-[#8e8e93] hover:text-white border border-[#1f1f1f]'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[#171717]">
          {filteredRules.map((rule, idx) => {
            const isCrit = rule.severity === 'CRITICAL';
            const isHigh = rule.severity === 'HIGH';
            return (
              <div key={idx} className="p-4 hover:bg-[#121212]/50 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      isCrit
                        ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
                        : isHigh
                        ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                        : 'bg-blue-950/40 text-blue-300 border-blue-800/60'
                    }`}>
                      {rule.severity}
                    </span>
                    <span className="text-xs font-semibold text-[#ededed] font-mono">
                      Category: {rule.category}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="bg-[#050505] p-2.5 rounded border border-[#1c1c1c] font-mono text-[11px] text-rose-300">
                    <span className="text-[#71717a] block mb-1 uppercase font-bold text-[10px]">Technical Flag / Sensor Metric:</span>
                    {rule.technicalFlag}
                  </div>
                  <div className="bg-[#050505] p-2.5 rounded border border-[#1c1c1c] text-[11px] text-[#ededed]">
                    <span className="text-emerald-400 block mb-1 uppercase font-bold text-[10px]">Human-Readable Forensic Explanation:</span>
                    {rule.humanExplanation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Overlay Synthesis Mechanism */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-5 space-y-3">
        <h4 className="text-xs font-bold text-[#e5e7eb] uppercase tracking-wider flex items-center space-x-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span>Dual-Layer Visual Heatmap Synthesis Pipeline</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#d1d5db]">
          <div className="p-3 bg-[#0d0d0d] rounded-lg border border-[#1f1f1f]">
            <span className="text-cyan-400 font-bold block mb-1">Layer 1: Normalized Error Heatmap</span>
            <p className="text-[#8e8e93] text-[11px]">Calculates pixel-difference intensity, applies Turbo colormap, and renders transparent alpha overlay (&alpha;=0.45) directly onto document.</p>
          </div>
          <div className="p-3 bg-[#0d0d0d] rounded-lg border border-[#1f1f1f]">
            <span className="text-amber-400 font-bold block mb-1">Layer 2: Bounding Box Highlighting</span>
            <p className="text-[#8e8e93] text-[11px]">Encloses manipulated characters, doctored transaction sums, or spliced signature regions with high-contrast amber/red vector outlines.</p>
          </div>
          <div className="p-3 bg-[#0d0d0d] rounded-lg border border-[#1f1f1f]">
            <span className="text-emerald-400 font-bold block mb-1">Layer 3: Forensic Audit Summary</span>
            <p className="text-[#8e8e93] text-[11px]">Embeds QR code containing RFC 3161 TSA token and cryptographic SHA-256 genesis hash into the footer of the generated PDF report.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
