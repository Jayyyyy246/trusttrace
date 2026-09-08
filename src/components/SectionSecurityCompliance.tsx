import React from 'react';
import { Lock, ShieldAlert, CheckCircle2, ShieldCheck, Scale, AlertTriangle, FileCode2, Terminal } from 'lucide-react';
import { THREAT_MODEL_MATRIX } from '../data/specificationContent';

export const SectionSecurityCompliance: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Overview Card */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-6 shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-[#0a191f] border border-cyan-500/30 rounded-lg text-cyan-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#f3f4f6] tracking-tight">7. Security, Privacy & Compliance</h2>
            <p className="mt-1 text-sm text-[#9ca3af]">
              Evidence platforms represent high-value targets for both nation-state tampering and sensitive data exfiltration. TRUSTTRACE integrates defense-in-depth isolation, client-side cryptographic envelope encryption, zero-retention ephemeral memory processing, and strict alignment with ISO/IEC 27037 digital forensic standards.
            </p>
          </div>
        </div>
      </div>

      {/* Zero-Retention & Privacy Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Lock className="w-5 h-5" />
            <h3 className="text-sm font-bold text-[#ededed] uppercase tracking-wider">Zero-Retention Mode (ZRM) Mechanics</h3>
          </div>
          <p className="text-xs text-[#a1a1aa] leading-relaxed">
            For sensitive legal, banking, or medical records, organizations can toggle Zero-Retention Mode. In this state:
          </p>
          <ul className="space-y-2 text-xs text-[#9ca3af]">
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Evidence bytes are cached exclusively in volatile RAM (<code className="text-cyan-300 bg-[#141414] px-1 py-0.5 rounded border border-[#222222]">tmpfs</code>) and never written to non-volatile disks.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Upon report generation, the worker initiates DoD 5220.22-M zeroization passes over memory sectors before deallocation.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Only the cryptographic hash digest (SHA-256) and signed TSA token are retained for immutable custody verification.</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400">
            <FileCode2 className="w-5 h-5" />
            <h3 className="text-sm font-bold text-[#ededed] uppercase tracking-wider">Client-Side Envelope Encryption</h3>
          </div>
          <p className="text-xs text-[#a1a1aa] leading-relaxed">
            Where cloud storage of evidence is required, TRUSTTRACE supports envelope encryption using customer-managed cryptographic keys:
          </p>
          <ul className="space-y-2 text-xs text-[#9ca3af]">
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>Client generates an ephemeral Data Encryption Key (DEK) via WebCrypto AES-GCM (256-bit).</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>The DEK is encrypted via RSA-OAEP with the customer&apos;s master public key and sent alongside ciphertext.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>Storage engines in AWS S3 / MinIO hold only encrypted ciphertext; TrustTrace personnel have zero plaintext visibility.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Threat Modeling & Hardening Matrix */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#1c1c1c] bg-[#080808]">
          <h3 className="text-xs font-bold text-[#ededed] uppercase tracking-wider flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Adversarial Threat Model & Defense Matrix</span>
          </h3>
        </div>

        <div className="divide-y divide-[#171717]">
          {THREAT_MODEL_MATRIX.map((item, idx) => (
            <div key={idx} className="p-4 hover:bg-[#121212]/50 transition-colors space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#f3f4f6] font-mono">{item.threat}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/60">
                  {item.status}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#050505] p-2.5 rounded border border-[#1c1c1c] text-rose-300">
                  <span className="text-[#71717a] block mb-1 uppercase font-bold text-[10px]">Attack Vector:</span>
                  {item.vector}
                </div>
                <div className="bg-[#050505] p-2.5 rounded border border-[#1c1c1c] text-cyan-300">
                  <span className="text-emerald-400 block mb-1 uppercase font-bold text-[10px]">System Mitigation & Architectural Defense:</span>
                  {item.mitigation}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Standards Alignment */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-[#e5e7eb] uppercase tracking-wider flex items-center space-x-2">
          <Scale className="w-4 h-4 text-indigo-400" />
          <span>Forensic Legal & Regulatory Compliance Framework</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-[#0d0d0d] rounded-lg border border-[#1f1f1f]">
            <span className="text-indigo-300 font-mono font-bold block mb-1">ISO/IEC 27037 Standard</span>
            <p className="text-[#8e8e93] text-[11px] leading-relaxed">
              Fulfills international guidelines for digital evidence acquisition, chain of custody logging, repeatability, and non-destructive analysis.
            </p>
          </div>
          <div className="p-3.5 bg-[#0d0d0d] rounded-lg border border-[#1f1f1f]">
            <span className="text-cyan-300 font-mono font-bold block mb-1">FRE 902(13) & 902(14)</span>
            <p className="text-[#8e8e93] text-[11px] leading-relaxed">
              Provides automated qualified person certificates and certified hash tokens allowing records to be self-authenticating in federal courts.
            </p>
          </div>
          <div className="p-3.5 bg-[#0d0d0d] rounded-lg border border-[#1f1f1f]">
            <span className="text-emerald-300 font-mono font-bold block mb-1">GDPR & CCPA Compliant</span>
            <p className="text-[#8e8e93] text-[11px] leading-relaxed">
              Full adherence to Right to Erasure through cryptographic expungement protocols and verifiable zero-knowledge shredding verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
