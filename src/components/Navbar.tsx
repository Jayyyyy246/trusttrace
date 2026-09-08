import React from 'react';
import { Shield, FileText, CheckCircle, Lock, Search, Cpu, Award } from 'lucide-react';

interface NavbarProps {
  currentAppMode: 'studio' | 'blueprint';
  onChangeAppMode: (mode: 'studio' | 'blueprint') => void;
  onOpenFullDoc: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentAppMode,
  onChangeAppMode,
  onOpenFullDoc
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#080808]/90 backdrop-blur-md border-b border-[#1c1c1c] text-[#ededed]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand and Platform Label */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => onChangeAppMode('studio')}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-800 flex items-center justify-center shadow-lg shadow-cyan-950/40 border border-cyan-500/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold tracking-wider text-base text-white">TRUSTTRACE</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#0a191f] text-cyan-300 border border-cyan-500/40 rounded">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-[#8e8e93] hidden sm:block">
                AI-Assisted Digital Evidence Verification &amp; Tamper Detection Platform
              </p>
            </div>
          </div>

          {/* Center Mode Switcher Tabs */}
          <div className="flex items-center bg-[#11141c] p-1 rounded-xl border border-[#202738] space-x-1">
            <button
              onClick={() => onChangeAppMode('studio')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentAppMode === 'studio'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-[#181d2a]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Evidence Studio</span>
            </button>

            <button
              onClick={() => onChangeAppMode('blueprint')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentAppMode === 'blueprint'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-[#181d2a]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>System Blueprint</span>
            </button>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden lg:flex items-center space-x-1.5 bg-[#0d0d0d] border border-[#1f1f1f] rounded-md px-2.5 py-1 text-xs text-zinc-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>RFC 3161 TSA</span>
              <span className="text-[#333333]">|</span>
              <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>ISO 27037</span>
            </div>

            <button
              onClick={onOpenFullDoc}
              className="inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-[#121212] hover:bg-[#1a1a1a] text-zinc-100 hover:text-white shadow-sm transition-all border border-[#2d2d2d] cursor-pointer"
              title="View complete technical engineering specification"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Technical Spec</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
