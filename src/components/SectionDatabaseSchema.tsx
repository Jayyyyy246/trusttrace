import React, { useState } from 'react';
import { Database, Copy, Check, Table, Key, ShieldCheck, FileCode } from 'lucide-react';
import { POSTGRES_DDL } from '../data/specificationContent';

export const SectionDatabaseSchema: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(POSTGRES_DDL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tables = [
    {
      name: "organizations",
      desc: "Enterprise tenancy, default Zero-Retention preferences, and root TSA signing configuration.",
      keys: "PK: org_id (UUID)"
    },
    {
      name: "users",
      desc: "Analysts, investigators, auditors, and administrators with optional public keys for client-side envelope encryption.",
      keys: "PK: user_id (UUID), FK: org_id"
    },
    {
      name: "evidence_records",
      desc: "Master evidence metadata, MIME type, file size, storage URI, and custody lifecycle states.",
      keys: "PK: evidence_id (UUID), FK: org_id, submitted_by"
    },
    {
      name: "cryptographic_hashes",
      desc: "FIPS 180-4 SHA-256, FIPS 202 SHA3-512, SSDeep fuzzy hashes, RFC 3161 TSA tokens, and Hedera ledger transaction IDs.",
      keys: "PK: hash_id (UUID), FK: evidence_id (UNIQUE)"
    },
    {
      name: "verification_jobs",
      desc: "Job orchestration status, worker allocation, overall composite tamper risk score, and execution duration.",
      keys: "PK: job_id (UUID), FK: evidence_id"
    },
    {
      name: "forensic_findings",
      desc: "Granular per-layer forensic outputs, raw numeric metrics, bounding boxes, and XAI human-readable explanations.",
      keys: "PK: finding_id (UUID), FK: job_id"
    },
    {
      name: "custody_audit_logs",
      desc: "Immutable cryptographic ledger chaining blocks via previous_block_hash for court-admissible chain-of-custody.",
      keys: "PK: block_index (BIGSERIAL), FK: evidence_id"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Overview Card */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-6 shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-[#0a191f] border border-cyan-500/30 rounded-lg text-cyan-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#f3f4f6] tracking-tight">5. Database Schema & Data Models</h2>
            <p className="mt-1 text-sm text-[#9ca3af]">
              PostgreSQL 16 relational schema normalized for high-throughput forensic ingestion, sub-millisecond query performance on JSONB metrics, and an append-only, tamper-evident cryptographic chain-of-custody ledger.
            </p>
          </div>
        </div>
      </div>

      {/* Entity Relationship Overview Cards */}
      <div>
        <h3 className="text-base font-semibold text-[#e5e7eb] uppercase tracking-wider mb-4 flex items-center space-x-2">
          <Table className="w-4 h-4 text-cyan-400" />
          <span>Core Relational Entities</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((t, idx) => (
            <div key={idx} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-cyan-300">{t.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#141414] border border-[#262626] text-[#8e8e93] rounded">
                  Table #{idx + 1}
                </span>
              </div>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">{t.desc}</p>
              <div className="pt-2 border-t border-[#1c1c1c] flex items-center space-x-1.5 text-[11px] font-mono text-[#8e8e93]">
                <Key className="w-3 h-3 text-amber-400" />
                <span>{t.keys}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tamper-Evident Chain-of-Custody Cryptographic Schema Explanation */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-5 space-y-3">
        <h4 className="text-xs font-bold text-[#e5e7eb] uppercase tracking-wider flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Tamper-Evident Chain-of-Custody Linked Hash Ledger</span>
        </h4>
        <p className="text-xs text-[#a1a1aa] leading-relaxed">
          The <code className="text-cyan-300 font-mono bg-[#141414] px-1 py-0.5 rounded border border-[#222222]">custody_audit_logs</code> table functions as an internal blockchain. Each log entry incorporates the SHA-256 hash of the previous row (<code className="text-amber-300 font-mono bg-[#141414] px-1 py-0.5 rounded border border-[#222222]">previous_block_hash</code>) concatenated with the current action&apos;s payload hash (<code className="text-amber-300 font-mono bg-[#141414] px-1 py-0.5 rounded border border-[#222222]">payload_hash</code>). Any unauthorized modification to an existing audit record instantly breaks the cryptographic continuity for all subsequent rows, providing undeniable proof of tamper attempts.
        </p>
        <div className="bg-[#050505] p-3 rounded-lg border border-[#1c1c1c] font-mono text-xs text-emerald-300 overflow-x-auto">
          current_block_hash = SHA256( previous_block_hash || payload_hash || action_type || timestamp )
        </div>
      </div>

      {/* Full DDL Code Inspector */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1c1c1c] bg-[#080808]">
          <div className="flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-[#ededed] uppercase tracking-wider font-mono">
              PostgreSQL 16 Production DDL Script (SQL)
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-medium rounded bg-[#141414] hover:bg-[#1f1f1f] text-zinc-100 hover:text-white transition-all border border-[#2d2d2d] cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#8e8e93]" />}
            <span>{copied ? 'Copied DDL' : 'Copy SQL Script'}</span>
          </button>
        </div>

        <div className="p-4 bg-[#050505] overflow-x-auto max-h-96">
          <pre className="font-mono text-xs text-[#d1d5db] leading-relaxed select-all">
            {POSTGRES_DDL}
          </pre>
        </div>
      </div>
    </div>
  );
};
