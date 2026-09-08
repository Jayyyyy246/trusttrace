import React, { useState } from 'react';
import {
  ShieldCheck,
  Network,
  Layers,
  Cpu,
  Database,
  FileSpreadsheet,
  Lock,
  Code2,
  CheckCheck,
  ChevronRight,
  FileText,
  Activity,
  Zap,
  Search,
  Sparkles
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { EvidenceVerificationStudio } from './components/EvidenceVerificationStudio';
import { SectionScope } from './components/SectionScope';
import { SectionArchitecture } from './components/SectionArchitecture';
import { SectionTechStack } from './components/SectionTechStack';
import { SectionForensicsEngine } from './components/SectionForensicsEngine';
import { SectionDatabaseSchema } from './components/SectionDatabaseSchema';
import { SectionXAIReport } from './components/SectionXAIReport';
import { SectionSecurityCompliance } from './components/SectionSecurityCompliance';
import { SectionCoreServices } from './components/SectionCoreServices';
import { SectionAuditAndBenchmarks } from './components/SectionAuditAndBenchmarks';
import { FullDocumentModal } from './components/FullDocumentModal';
import { SECTIONS } from './data/blueprintData';

export default function App() {
  const [appMode, setAppMode] = useState<'studio' | 'blueprint'>('studio');
  const [activeSection, setActiveSection] = useState<string>('scope');
  const [isFullDocOpen, setIsFullDocOpen] = useState<boolean>(false);

  const getSectionIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return ShieldCheck;
      case 'Network':
        return Network;
      case 'Layers':
        return Layers;
      case 'Cpu':
        return Cpu;
      case 'Database':
        return Database;
      case 'FileSpreadsheet':
        return FileSpreadsheet;
      case 'Lock':
        return Lock;
      case 'Code2':
        return Code2;
      case 'CheckCheck':
        return CheckCheck;
      default:
        return Activity;
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'scope':
        return <SectionScope />;
      case 'architecture':
        return <SectionArchitecture />;
      case 'tech-stack':
        return <SectionTechStack />;
      case 'detection-engine':
        return <SectionForensicsEngine />;
      case 'database-schema':
        return <SectionDatabaseSchema />;
      case 'xai-reports':
        return <SectionXAIReport />;
      case 'security-compliance':
        return <SectionSecurityCompliance />;
      case 'core-services':
        return <SectionCoreServices />;
      case 'audit-benchmarks':
        return <SectionAuditAndBenchmarks />;
      default:
        return <SectionScope />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e7eb] flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Navigation Bar */}
      <Navbar
        currentAppMode={appMode}
        onChangeAppMode={setAppMode}
        onOpenFullDoc={() => setIsFullDocOpen(true)}
      />

      {/* Main Studio Mode */}
      {appMode === 'studio' ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <EvidenceVerificationStudio />
        </main>
      ) : (
        /* Blueprint & Technical Specs Mode */
        <div className="flex-1 flex flex-col">
          {/* Blueprint Hero / System Header */}
          <div className="border-b border-[#1c1c1c] bg-[#080808] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-[#0a191f] text-cyan-400 border border-cyan-500/30 rounded">
                      SYSTEM ARCHITECTURE BLUEPRINT
                    </span>
                    <span className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-[#061a12] text-emerald-400 border border-emerald-500/30 rounded">
                      ISO/IEC 27037 &bull; FRE 902(14)
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#f3f4f6] tracking-tight mt-1.5">
                    TRUSTTRACE &mdash; Enterprise Tamper Detection Platform
                  </h1>
                  <p className="text-sm text-[#9ca3af] max-w-3xl mt-1">
                    Engineering specification for an AI-assisted digital evidence verification platform, featuring multi-layer deep visual forensics, OCR stroke-geometry analysis, RFC 3161 cryptographic timestamping, and explainable human-readable findings.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setAppMode('studio')}
                    className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Launch Verification Studio</span>
                  </button>

                  <button
                    onClick={() => setIsFullDocOpen(true)}
                    className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#141414] hover:bg-[#1f1f1f] text-zinc-100 hover:text-white shadow-sm border border-[#2d2d2d] transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>Full Specification</span>
                  </button>
                </div>
              </div>

              {/* Quick Metrics Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-[#0d0d0d] border border-[#1f1f1f] flex items-center space-x-3">
                  <Cpu className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-[11px] text-[#71717a] block font-mono">Forensic Tiers</span>
                    <span className="text-sm font-bold text-[#f3f4f6]">4 Deep Analysis Layers</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#0d0d0d] border border-[#1f1f1f] flex items-center space-x-3">
                  <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[11px] text-[#71717a] block font-mono">Analysis SLA</span>
                    <span className="text-sm font-bold text-[#f3f4f6]">&le; 2.5s Express / &le; 8.0s Deep</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#0d0d0d] border border-[#1f1f1f] flex items-center space-x-3">
                  <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[11px] text-[#71717a] block font-mono">Integrity Standard</span>
                    <span className="text-sm font-bold text-[#f3f4f6]">SHA-256 + RFC 3161 TSA</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#0d0d0d] border border-[#1f1f1f] flex items-center space-x-3">
                  <Lock className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <span className="text-[11px] text-[#71717a] block font-mono">Privacy Engine</span>
                    <span className="text-sm font-bold text-[#f3f4f6]">Zero-Retention RAM tmpfs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Blueprint Body with Sidebar */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              {/* Section Navigation Sidebar */}
              <aside className="lg:col-span-1 bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-3 space-y-1 sticky top-20">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#71717a] px-3 py-2 block">
                  Blueprint Sections
                </span>

                {SECTIONS.map((section) => {
                  const Icon = getSectionIcon(section.iconName);
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-[#1a1a1a] text-white font-semibold border border-[#333333] shadow-sm'
                          : 'text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#121212]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-[#71717a]'}`} />
                        <span>{section.shortTitle}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  );
                })}

                <div className="pt-4 mt-2 border-t border-[#1c1c1c] px-3 pb-1 space-y-2">
                  <span className="text-[10px] text-[#71717a] font-mono block">
                    LIVE PLATFORM
                  </span>
                  <button
                    onClick={() => setAppMode('studio')}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold rounded bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/60 transition-colors cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Open Verification Studio</span>
                  </button>
                </div>
              </aside>

              {/* Active Section Content View */}
              <section className="lg:col-span-3">
                {renderActiveSection()}
              </section>
            </div>
          </main>
        </div>
      )}

      {/* Global Footer */}
      <footer className="border-t border-[#1c1c1c] bg-[#050505] py-6 text-center text-xs text-[#71717a] font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TRUSTTRACE Digital Evidence Verification &bull; AI-Assisted Tamper Detection Platform</span>
          <span>ISO/IEC 27037 &bull; RFC 3161 &bull; FRE Rule 902(13)/(14)</span>
        </div>
      </footer>

      {/* Complete Technical Document Modal */}
      <FullDocumentModal
        isOpen={isFullDocOpen}
        onClose={() => setIsFullDocOpen(false)}
      />
    </div>
  );
}
