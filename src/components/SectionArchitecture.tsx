import React, { useState } from 'react';
import { Network, Server, Shield, Cpu, Layers, HardDrive, ArrowRight, Eye, Code } from 'lucide-react';
import { ARCHITECTURE_DIAGRAM, CHAIN_OF_CUSTODY_DIAGRAM } from '../data/blueprintData';

export const SectionArchitecture: React.FC = () => {
  const [activeDiagram, setActiveDiagram] = useState<'system' | 'custody'>('system');

  return (
    <div className="space-y-8">
      {/* Overview Card */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-6 shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-[#0a191f] border border-cyan-500/30 rounded-lg text-cyan-400">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#f3f4f6] tracking-tight">2. Architectural Layering & High-Level Design</h2>
            <p className="mt-1 text-sm text-[#9ca3af]">
              TRUSTTRACE leverages a zero-trust, asynchronous, defense-in-depth pipeline. Untrusted client media is sanitized, cryptographically fingerprinted at the edge, and processed within air-gapped sandboxes to ensure that malicious PDF/image exploits cannot compromise host kernels or tamper with custody logs.
            </p>
          </div>
        </div>
      </div>

      {/* Architectural Diagram Selector */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1c1c1c] bg-[#080808]">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#8e8e93] uppercase tracking-wider">Topological Visualizer:</span>
            <div className="flex rounded-md bg-[#0d0d0d] p-0.5 border border-[#1f1f1f]">
              <button
                onClick={() => setActiveDiagram('system')}
                className={`px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                  activeDiagram === 'system'
                    ? 'bg-[#1a1a1a] text-white border border-[#333333] shadow-sm'
                    : 'text-[#8e8e93] hover:text-[#f3f4f6]'
                }`}
              >
                End-to-End System Topology
              </button>
              <button
                onClick={() => setActiveDiagram('custody')}
                className={`px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                  activeDiagram === 'custody'
                    ? 'bg-[#1a1a1a] text-white border border-[#333333] shadow-sm'
                    : 'text-[#8e8e93] hover:text-[#f3f4f6]'
                }`}
              >
                Tamper-Evident Merkle Custody Chain
              </button>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[#71717a]">FORMAT: ASCII SYSTEM MAPPING</span>
        </div>

        <div className="p-4 bg-[#050505] overflow-x-auto">
          <pre className="font-mono text-[11px] leading-snug text-cyan-300 select-all">
            {activeDiagram === 'system' ? ARCHITECTURE_DIAGRAM : CHAIN_OF_CUSTODY_DIAGRAM}
          </pre>
        </div>
      </div>

      {/* Deep-Dive Subsystems & Isolation Mechanisms */}
      <div>
        <h3 className="text-base font-semibold text-[#e5e7eb] uppercase tracking-wider mb-4 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Evidence Isolation & Security Microservices Boundary</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-5">
            <div className="flex items-center space-x-2 text-cyan-400 mb-2">
              <Cpu className="w-4 h-4" />
              <h4 className="font-semibold text-[#ededed] text-sm">Sandboxed Parsing Clusters</h4>
            </div>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              Every file parser (PDF byte-stream decoders, libvips, ExifTool, OpenCV) is isolated inside dedicated <strong>gVisor (runsc)</strong> or <strong>Firecracker MicroVMs</strong>. Network interfaces inside forensic pods are explicitly detached (<code className="text-cyan-300 bg-[#121212] px-1 py-0.5 rounded border border-[#222222]">egress: none</code>) to eradicate data exfiltration vectors.
            </p>
          </div>

          <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-5">
            <div className="flex items-center space-x-2 text-emerald-400 mb-2">
              <HardDrive className="w-4 h-4" />
              <h4 className="font-semibold text-[#ededed] text-sm">Ephemeral In-Memory Handling</h4>
            </div>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              In Zero-Retention Mode, files are stored strictly on <strong>tmpfs / ramfs</strong> backed by encrypted RAM volumes using per-job ephemeral keys (AES-256-GCM). Upon report synthesis, RAM sectors are overwritten with 0x00 patterns following the <strong>DoD 5220.22-M</strong> protocol before returning memory to OS pools.
            </p>
          </div>

          <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-5">
            <div className="flex items-center space-x-2 text-indigo-400 mb-2">
              <Layers className="w-4 h-4" />
              <h4 className="font-semibold text-[#ededed] text-sm">Decoupled Microservice Pipeline</h4>
            </div>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              The API Ingestion layer never parses binary media directly; it verifies pre-ingest hashes, pushes jobs to <strong>RabbitMQ / Celery</strong> priority queues, and delegates heavy compute to autonomous forensic workers. Results are consolidated via a central XAI Aggregation service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
