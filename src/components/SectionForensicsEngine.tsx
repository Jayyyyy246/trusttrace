import React, { useState } from 'react';
import { Cpu, Eye, FileText, CheckCircle, Sliders, Activity, Info, BarChart2 } from 'lucide-react';
import { FORENSIC_PIPELINE_DETAILS } from '../data/specificationContent';

export const SectionForensicsEngine: React.FC = () => {
  const [activeTier, setActiveTier] = useState<number>(0);

  const currentTier = FORENSIC_PIPELINE_DETAILS[activeTier];

  return (
    <div className="space-y-8">
      {/* Overview Card */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-6 shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-[#0a191f] border border-cyan-500/30 rounded-lg text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#f3f4f6] tracking-tight">4. Deep Multi-Layer Detection Engine Architecture</h2>
            <p className="mt-1 text-sm text-[#9ca3af]">
              TRUSTTRACE implements a modular 4-tier forensic detection pipeline. Each layer applies domain-specific mathematical algorithms, neural networks, and structural heuristics to identify tampering markers that are invisible to the naked human eye.
            </p>
          </div>
        </div>
      </div>

      {/* Tier Selector Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[#1c1c1c] pb-3">
        {FORENSIC_PIPELINE_DETAILS.map((tier, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTier(idx)}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center space-x-2 cursor-pointer ${
              activeTier === idx
                ? 'bg-[#1a1a1a] text-white border border-[#333333] shadow-sm'
                : 'bg-[#0d0d0d] text-[#8e8e93] hover:text-[#f3f4f6] hover:bg-[#141414] border border-[#1f1f1f]'
            }`}
          >
            <span>{tier.layer}</span>
          </button>
        ))}
      </div>

      {/* Active Tier Content Card */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#1c1c1c] gap-2">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">Active Forensic Pipeline Tier</span>
            <h3 className="text-lg font-bold text-[#f3f4f6]">{currentTier.layer}</h3>
          </div>
          <div className="flex items-center space-x-2 bg-[#0d0d0d] border border-[#1f1f1f] px-3 py-1.5 rounded-md text-xs font-mono text-[#a1a1aa]">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tools/Engines: {currentTier.tools}</span>
          </div>
        </div>

        {/* Algorithm List */}
        <div className="space-y-4">
          {currentTier.algorithms.map((algo, aIdx) => (
            <div key={aIdx} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-cyan-300 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>{algo.name}</span>
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#141414] border border-[#262626] text-[#8e8e93] rounded">
                  Algorithm #{aIdx + 1}
                </span>
              </div>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">{algo.detail}</p>
              
              <div className="mt-2 pt-2 border-t border-[#1a1a1a] flex items-start space-x-2 bg-[#080808] p-2.5 rounded border border-[#1c1c1c]">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider">Detection Threshold & Decision Logic: </span>
                  <span className="text-[11px] font-mono text-[#d1d5db]">{algo.threshold}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Forensic Pipeline Orchestration Flow */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-5">
        <h4 className="text-xs font-bold text-[#e5e7eb] uppercase tracking-wider mb-3 flex items-center space-x-2">
          <BarChart2 className="w-4 h-4 text-cyan-400" />
          <span>Synchronized Multi-Model Execution Flow</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-[#d1d5db]">
          <div className="p-3 bg-[#0d0d0d] rounded border border-[#1f1f1f]">
            <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-1">STAGE 1</span>
            <span className="font-semibold text-[#f3f4f6] block mb-1">Header & EXIF Audit</span>
            <p className="text-[#8e8e93] text-[11px]">Instant stream parsing without full image rasterization (&lt;100ms).</p>
          </div>
          <div className="p-3 bg-[#0d0d0d] rounded border border-[#1f1f1f]">
            <span className="text-[10px] font-mono text-emerald-400 font-bold block mb-1">STAGE 2</span>
            <span className="font-semibold text-[#f3f4f6] block mb-1">Pixel & ELA Analysis</span>
            <p className="text-[#8e8e93] text-[11px]">Parallel computation of noise residuals & Benford DCT distributions.</p>
          </div>
          <div className="p-3 bg-[#0d0d0d] rounded border border-[#1f1f1f]">
            <span className="text-[10px] font-mono text-amber-400 font-bold block mb-1">STAGE 3</span>
            <span className="font-semibold text-[#f3f4f6] block mb-1">OCR & Geometry Check</span>
            <p className="text-[#8e8e93] text-[11px]">Extracts glyph bounding boxes and checks for baseline jitter or stroke variance.</p>
          </div>
          <div className="p-3 bg-[#0d0d0d] rounded border border-[#1f1f1f]">
            <span className="text-[10px] font-mono text-indigo-400 font-bold block mb-1">STAGE 4</span>
            <span className="font-semibold text-[#f3f4f6] block mb-1">PDF Structural Trees</span>
            <p className="text-[#8e8e93] text-[11px]">Validates cross-reference tables, incremental changes, and digital certificates.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
