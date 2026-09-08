import React from 'react';
import { Layers, CheckCircle2, Server, Database, Globe, Smartphone, ShieldAlert, Cpu } from 'lucide-react';

export const SectionTechStack: React.FC = () => {
  const stackLayers = [
    {
      category: "1. Web & Mobile Client Layer",
      icon: Globe,
      color: "border-cyan-500/30 text-cyan-400",
      technologies: [
        {
          name: "Next.js 15 & React 19 (Web)",
          purpose: "Server-side rendered responsive web application, forensic report visualizer, and drag-and-drop ingestion interface."
        },
        {
          name: "Tailwind CSS v4",
          purpose: "High-density technical dashboard styling, responsive high-contrast data visualization themes, and accessible forensic status indicators."
        },
        {
          name: "WebAssembly (WASM / Rust)",
          purpose: "Performs client-side pre-ingest cryptographic hashing (SHA-256 / SHA3-512 via SubtleCrypto / WASM) and hardware-accelerated canvas heatmap rendering."
        },
        {
          name: "React Native + Hardware KeyStore (Mobile)",
          purpose: "Direct hardware camera evidence capture using iOS Secure Enclave and Android StrongBox KeyStore to generate tamper-proof hardware attestations."
        }
      ]
    },
    {
      category: "2. API Gateway & Ingestion Services",
      icon: Server,
      color: "border-blue-500/30 text-blue-400",
      technologies: [
        {
          name: "Envoy Proxy / Cloudflare WAF",
          purpose: "L7 edge reverse proxy managing TLS 1.3 termination, token-bucket rate limiting (10 req/s burst 30 req/s), DDoS mitigation, and mTLS verification."
        },
        {
          name: "Go 1.23 Ingestion Microservice",
          purpose: "Blazing fast streaming file ingestion, payload sanitization, zero-copy buffer handling, and immediate generation of genesis cryptographic hashes."
        },
        {
          name: "Python 3.12 FastAPI (UVLoop)",
          purpose: "High-performance asynchronous orchestration service coordinating forensic worker tasks, XAI report assembly, and REST/GraphQL APIs."
        }
      ]
    },
    {
      category: "3. Asynchronous Task Queue & Compute Cluster",
      icon: Cpu,
      color: "border-amber-500/30 text-amber-400",
      technologies: [
        {
          name: "RabbitMQ 3.13 (AMQP)",
          purpose: "Enterprise-grade message broker with persistent delivery, dead-letter exchanges (DLX), priority queues (Express vs. Deep Forensics), and worker heartbeats."
        },
        {
          name: "Redis 7.2 Cluster",
          purpose: "Sub-millisecond job status pub/sub caching, distributed token-bucket rate limiting state, and real-time SSE (Server-Sent Events) push."
        },
        {
          name: "Celery Worker Pools + NVIDIA Triton",
          purpose: "Distributed forensic compute clusters running on Kubernetes with GPU autoscaling (NVIDIA A10G / L4 GPUs) for Vision Transformer inference."
        }
      ]
    },
    {
      category: "4. Storage & Cryptographic Ledger",
      icon: Database,
      color: "border-purple-500/30 text-purple-400",
      technologies: [
        {
          name: "PostgreSQL 16 with TimescaleDB & JSONB",
          purpose: "Relational source of truth for verification jobs, forensic metrics, user permissions, and indexed tamper-evident chain-of-custody audit logs."
        },
        {
          name: "MinIO / AWS S3 Object Storage",
          purpose: "Encrypted evidence archive with Server-Side Encryption (AWS KMS / SSE-C) and Object Lock (WORM - Write Once Read Many) for non-repudiation."
        },
        {
          name: "RFC 3161 Time-Stamp Authority (TSA)",
          purpose: "Cryptographic time stamping protocol generating verifiable DER tokens signed by trusted root CA (DigiCert / Sectigo) anchoring evidence timestamp."
        },
        {
          name: "Hedera Consensus Service (HCS)",
          purpose: "Public decentralized ledger anchoring Merkle roots of verification jobs with nanosecond consensus timestamps and fair ordering guarantees."
        }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Overview Card */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-6 shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-[#0a191f] border border-cyan-500/30 rounded-lg text-cyan-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#f3f4f6] tracking-tight">3. Technical Stack Recommendations</h2>
            <p className="mt-1 text-sm text-[#9ca3af]">
              The TRUSTTRACE production stack is engineered to balance sub-second API responsiveness, rigorous microservice isolation, high-throughput batching, and tamper-evident cryptographic persistence.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Stack Layers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stackLayers.map((layer, index) => {
          const Icon = layer.icon;
          return (
            <div key={index} className={`rounded-xl border p-5 ${layer.color} bg-[#0a0a0a]`}>
              <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-[#1c1c1c]">
                <Icon className="w-5 h-5" />
                <h3 className="text-sm font-bold text-[#ededed] uppercase tracking-wider">{layer.category}</h3>
              </div>
              <div className="space-y-3">
                {layer.technologies.map((tech, tIdx) => (
                  <div key={tIdx} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-[#ededed]">{tech.name}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-xs text-[#9ca3af] leading-relaxed">{tech.purpose}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
