import React, { useState } from 'react';
import { AnomalyRegion, EvidenceCase } from '../data/evidenceCases';
import { Eye, Layers, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, ShieldCheck, CheckCircle, Crosshair } from 'lucide-react';

interface EvidenceCanvasProps {
  evidence: EvidenceCase;
  customImageSrc?: string | null;
  selectedLayer: 'original' | 'ela' | 'noise' | 'typography' | 'clones';
  onSelectLayer: (layer: 'original' | 'ela' | 'noise' | 'typography' | 'clones') => void;
  selectedAnomalyId: string | null;
  onSelectAnomaly: (id: string | null) => void;
  showBoundingBoxes: boolean;
  onToggleBoundingBoxes: () => void;
}

export const EvidenceCanvas: React.FC<EvidenceCanvasProps> = ({
  evidence,
  customImageSrc,
  selectedLayer,
  onSelectLayer,
  selectedAnomalyId,
  onSelectAnomaly,
  showBoundingBoxes,
  onToggleBoundingBoxes
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  // Render simulated high-fidelity evidence graphics based on previewType or user image
  const renderVisualContent = () => {
    if (customImageSrc) {
      return (
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <img
            src={customImageSrc}
            alt="User uploaded evidence"
            className="max-h-[520px] max-w-full object-contain rounded shadow-lg"
          />
        </div>
      );
    }

    switch (evidence.previewType) {
      case 'payment':
        return (
          <div className="w-[360px] bg-[#0d141e] text-white rounded-2xl p-6 shadow-2xl border border-cyan-900/40 font-sans space-y-4 relative overflow-hidden select-none">
            {/* Bank Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-xs text-white">
                  TT
                </div>
                <div>
                  <div className="text-xs font-bold text-white tracking-wide">TRUST PAY MOBILE</div>
                  <div className="text-[10px] text-gray-400">Instant Wire Transfer Confirmation</div>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 rounded">
                SETTLED
              </span>
            </div>

            {/* Transfer Graphic */}
            <div className="text-center py-4 bg-[#111b27] rounded-xl border border-gray-800/80 relative">
              <div className="text-[11px] text-gray-400 uppercase tracking-wider font-mono">Amount Transferred</div>
              {/* Spliced dollar amount */}
              <div
                className={`text-3xl font-extrabold tracking-tight mt-1 transition-all ${
                  selectedLayer === 'ela' ? 'text-amber-400 bg-amber-500/20 px-2 rounded inline-block' : 'text-white'
                }`}
              >
                $9,450.00
              </div>
              <div className="text-[10px] text-cyan-400 mt-1">Transaction ID: #WT-8941-2026-XQ</div>
            </div>

            {/* Recipient details */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-800/50">
                <span className="text-gray-400">Sender:</span>
                <span className="font-medium text-gray-200">Global Horizon Ltd</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-800/50">
                <span className="text-gray-400">Recipient:</span>
                <span className="font-medium text-gray-200">Apex Hardware Supplies Inc.</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-800/50">
                <span className="text-gray-400">Routing / Account:</span>
                <span className="font-mono text-gray-300">•••• •••• 8821 (Chase NA)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-800/50">
                <span className="text-gray-400">Timestamp:</span>
                <span className="font-mono text-gray-300">04 Sep 2026, 09:35 AM EST</span>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-gray-400 text-center flex items-center justify-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 inline" />
              <span>Federal Reserve Fedwire Settlement Network Verified</span>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="w-[360px] bg-[#0b141a] text-[#e9edef] rounded-2xl p-4 shadow-2xl border border-[#202c33] font-sans space-y-3 select-none">
            {/* Header */}
            <div className="flex items-center space-x-3 pb-2 border-b border-[#202c33]">
              <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs">
                JD
              </div>
              <div>
                <div className="text-xs font-bold">John Doe (COO)</div>
                <div className="text-[10px] text-emerald-400">online</div>
              </div>
            </div>

            {/* Chat message bubbles */}
            <div className="space-y-3 py-2 text-xs">
              <div className="flex justify-start">
                <div className="bg-[#202c33] p-2.5 rounded-lg max-w-[80%] rounded-tl-none space-y-1">
                  <p>Can you confirm whether the contract terms were adjusted as agreed?</p>
                  <span className="text-[9px] text-gray-400 block text-right font-mono">11:38 PM</span>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="bg-[#005c4b] p-2.5 rounded-lg max-w-[80%] rounded-tr-none space-y-1">
                  <p>Yes, legal approved the revisions this morning.</p>
                  <span className="text-[9px] text-[#8696a0] block text-right font-mono">11:40 PM ✓✓</span>
                </div>
              </div>

              {/* Spliced bubble */}
              <div className="flex justify-start relative">
                <div
                  className={`p-2.5 rounded-lg max-w-[85%] rounded-tl-none space-y-1 transition-all ${
                    selectedLayer === 'ela'
                      ? 'bg-amber-900/60 border border-amber-500 text-white'
                      : 'bg-[#202c33]'
                  }`}
                >
                  <p className="font-medium text-amber-200">
                    "I took the extra money from the escrow account yesterday without informing the board."
                  </p>
                  {/* Cloned timestamp */}
                  <span className="text-[9px] text-gray-400 block text-right font-mono">11:42 PM</span>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="bg-[#005c4b] p-2.5 rounded-lg max-w-[80%] rounded-tr-none space-y-1">
                  <p>Understood. We will finalize tomorrow.</p>
                  <span className="text-[9px] text-[#8696a0] block text-right font-mono">11:43 PM ✓✓</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'invoice':
        return (
          <div className="w-[420px] bg-white text-gray-900 rounded-lg p-6 shadow-2xl border border-gray-300 font-sans space-y-4 select-none text-xs">
            <div className="flex justify-between items-start border-b border-gray-200 pb-3">
              <div>
                <div className="text-base font-black text-gray-900 tracking-tight">VORTEX LOGISTICS CORP</div>
                <div className="text-[10px] text-gray-500">Commercial Freight & Customs Invoicing</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-gray-800">INVOICE #VX-99120</div>
                <div className="text-[10px] text-gray-500">Date: 28 Aug 2026</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] py-1">
              <div>
                <span className="text-gray-400 block text-[9px] uppercase font-mono">Bill To:</span>
                <span className="font-semibold text-gray-800">Acme Industrial Holdings</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block text-[9px] uppercase font-mono">Payment Terms:</span>
                <span className="font-semibold text-gray-800">Net 30 Days</span>
              </div>
            </div>

            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-left text-[10px]">
                <thead className="bg-gray-100 border-b border-gray-200 font-mono text-gray-600">
                  <tr>
                    <th className="p-1.5">Description</th>
                    <th className="p-1.5 text-right">Qty</th>
                    <th className="p-1.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-1.5">Containerized Port Freight Routing</td>
                    <td className="p-1.5 text-right font-mono">2</td>
                    <td className="p-1.5 text-right font-mono">$4,100.00</td>
                  </tr>
                  <tr className="bg-amber-50/50">
                    <td className="p-1.5 font-bold text-gray-900">Appended Expedited Surcharge</td>
                    <td className="p-1.5 text-right font-mono">1</td>
                    <td className="p-1.5 text-right font-mono font-bold text-amber-700">$40,000.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 border-t-2 border-gray-900">
              <span className="font-bold text-sm">TOTAL AMOUNT DUE:</span>
              <span className="font-mono text-base font-black text-blue-900 bg-amber-100 px-2 py-0.5 rounded">
                $48,200.00
              </span>
            </div>

            <div className="bg-gray-50 p-2 rounded border border-gray-200 text-[10px] space-y-0.5 font-mono">
              <div className="text-gray-500">Wire Beneficiary: Vortex Logistics Escrow</div>
              <div className="text-gray-800 font-bold">IBAN: US89CITI2000008492019482</div>
            </div>
          </div>
        );

      case 'idcard':
        return (
          <div className="w-[400px] h-[250px] bg-gradient-to-r from-[#0d1b2a] to-[#1b263b] text-white rounded-xl p-5 shadow-2xl border-2 border-cyan-500/40 relative overflow-hidden select-none font-sans">
            {/* Guilloche security pattern lines */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:12px_12px]" />
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-cyan-400 block font-bold">
                  NATIONAL SECURITY CREDENTIAL
                </span>
                <span className="text-xs font-bold text-gray-200">FEDERAL AEROSPACE DIVISION</span>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">
                CLEARANCE LEVEL 4
              </span>
            </div>

            <div className="relative z-10 mt-4 flex space-x-4 items-center">
              {/* Spliced photo avatar */}
              <div className="w-24 h-32 bg-gray-800 rounded border-2 border-cyan-400/80 relative overflow-hidden shadow-md flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-t from-gray-900 via-gray-700 to-gray-600 flex items-center justify-center text-center p-1">
                  <span className="text-[10px] font-mono text-cyan-300">SUBSTITUTED PORTRAIT PHOTO</span>
                </div>
                {selectedLayer === 'ela' && (
                  <div className="absolute inset-0 bg-red-500/40 border border-red-500 animate-pulse" />
                )}
              </div>

              <div className="space-y-1.5 text-xs flex-1">
                <div>
                  <span className="text-[9px] text-gray-400 block font-mono">FULL NAME:</span>
                  <span className="font-bold text-sm text-white">MARCUS V. STERLING</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 block font-mono">BADGE ID:</span>
                  <span className="font-mono text-cyan-300 font-semibold">FED-884-0192-A</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 block font-mono">DATE OF BIRTH:</span>
                  <span className="font-mono text-amber-300 font-semibold">14 MAR 1994 (SPLICED)</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'photo':
      default:
        return (
          <div className="w-[420px] bg-[#141414] text-white rounded-xl p-6 shadow-2xl border border-gray-800 font-sans space-y-4 select-none">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-xs tracking-wider uppercase text-emerald-300 font-mono">
                  AUTHENTIC RECEIPT SCAN
                </span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded">
                ZERO ANOMALIES DETECTED
              </span>
            </div>

            <div className="bg-[#1c1c1c] p-4 rounded-lg font-mono text-xs space-y-2 text-gray-300 border border-gray-700/60">
              <div className="text-center font-bold text-white text-sm">METRO PHARMACEUTICALS</div>
              <div className="text-center text-[10px] text-gray-400">Store #402 &bull; Terminal 04</div>
              <div className="border-t border-dashed border-gray-700 my-2" />
              <div className="flex justify-between">
                <span>Prescription Rx #88124</span>
                <span>$24.50</span>
              </div>
              <div className="flex justify-between">
                <span>Medical Supplies Kit</span>
                <span>$15.00</span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-2 font-bold text-white">
                <span>TOTAL PAID:</span>
                <span className="text-emerald-400">$39.50</span>
              </div>
            </div>

            <div className="text-[11px] text-gray-400 space-y-1">
              <div className="flex items-center space-x-1 text-emerald-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Poisson Sensor Noise: 98.4% Uniformity</span>
              </div>
              <p className="text-[10px] text-gray-500">
                Natural optical focal blur and continuous pixel gradient verified across all coordinates.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-[#080808] border border-[#1c1c1c] rounded-xl overflow-hidden flex flex-col h-full">
      {/* Top Controls Bar */}
      <div className="bg-[#0e0e11] border-b border-[#1c1c1c] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider">
            Forensic Viewport Layer:
          </span>
          <div className="flex items-center bg-[#151518] p-1 rounded-lg border border-[#242428] space-x-1">
            {[
              { id: 'original', label: 'Original', icon: Eye },
              { id: 'ela', label: 'ELA Heatmap', icon: Layers },
              { id: 'noise', label: 'Noise Residual', icon: Crosshair },
              { id: 'typography', label: 'Font & Alignment', icon: AlertTriangle }
            ].map((layer) => {
              const Icon = layer.icon;
              const isActive = selectedLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={() => onSelectLayer(layer.id as any)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                    isActive
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-[#202026]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{layer.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Viewport Zoom and Annotations */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleBoundingBoxes}
            className={`px-2.5 py-1 text-xs font-mono rounded border transition flex items-center space-x-1.5 cursor-pointer ${
              showBoundingBoxes
                ? 'bg-amber-950/40 text-amber-300 border-amber-700/60'
                : 'bg-[#151518] text-gray-400 border-[#242428]'
            }`}
          >
            <span>{showBoundingBoxes ? '● Anomaly Pins ON' : '○ Anomaly Pins OFF'}</span>
          </button>

          <div className="flex items-center bg-[#151518] rounded-lg border border-[#242428] p-0.5 text-gray-300">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:text-white hover:bg-[#202026] rounded transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-mono text-gray-400">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:text-white hover:bg-[#202026] rounded transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 hover:text-white hover:bg-[#202026] rounded transition ml-1"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="relative flex-1 min-h-[440px] bg-[#050505] flex items-center justify-center p-6 overflow-hidden">
        {/* Layer Filter Overlay Simulation */}
        <div
          className="relative transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Base Visual Content */}
          <div className="relative">
            {renderVisualContent()}

            {/* ELA Heatmap Shader Simulation */}
            {selectedLayer === 'ela' && (
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/60 via-blue-950/40 to-transparent pointer-events-none mix-blend-color-dodge rounded-xl">
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur font-mono text-[10px] text-cyan-300 rounded border border-cyan-500/30">
                  ELA RE-COMPRESSION MATRIX: Q75 RESIDUAL FILTER
                </div>
              </div>
            )}

            {/* Noise Residual Shader Simulation */}
            {selectedLayer === 'noise' && (
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.8px,transparent_0.8px)] [background-size:4px_4px] opacity-25 pointer-events-none mix-blend-overlay rounded-xl">
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur font-mono text-[10px] text-emerald-300 rounded border border-emerald-500/30">
                  LAPLACIAN HIGH-FREQUENCY SENSOR GRAIN MAP
                </div>
              </div>
            )}

            {/* Typography Baseline Shader Simulation */}
            {selectedLayer === 'typography' && (
              <div className="absolute inset-0 pointer-events-none border border-cyan-500/20 rounded-xl">
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur font-mono text-[10px] text-amber-300 rounded border border-amber-500/30">
                  OCR STROKE-GEOMETRY & BASELINE CURVATURE
                </div>
              </div>
            )}

            {/* Interactive Anomaly Bounding Boxes */}
            {showBoundingBoxes &&
              evidence.anomalies.map((anomaly) => {
                const isSelected = selectedAnomalyId === anomaly.id;
                return (
                  <div
                    key={anomaly.id}
                    onClick={() => onSelectAnomaly(isSelected ? null : anomaly.id)}
                    style={{
                      left: `${anomaly.box.x}%`,
                      top: `${anomaly.box.y}%`,
                      width: `${anomaly.box.width}%`,
                      height: `${anomaly.box.height}%`
                    }}
                    className={`absolute z-20 cursor-pointer transition-all rounded ${
                      isSelected
                        ? 'border-2 border-red-500 bg-red-500/25 ring-4 ring-red-500/20'
                        : 'border-2 border-dashed border-amber-400 bg-amber-400/10 hover:bg-amber-400/20'
                    }`}
                  >
                    {/* Anomaly Badge */}
                    <div className="absolute -top-3 -left-2 bg-red-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded shadow flex items-center space-x-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>{anomaly.name.split(' ')[0]}</span>
                    </div>

                    {isSelected && (
                      <div className="absolute -bottom-8 left-0 right-0 bg-[#0f1117] text-white text-[10px] p-1 rounded shadow-lg border border-red-500 font-mono text-center truncate">
                        {anomaly.name} ({anomaly.confidence}% Conf)
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Layer Description HUD */}
        <div className="absolute bottom-3 left-3 bg-[#0a0c10]/90 backdrop-blur border border-[#202530] p-2.5 rounded-lg text-xs max-w-sm">
          <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>Active Layer Analysis</span>
          </div>
          <p className="text-[11px] text-gray-300 mt-0.5">
            {selectedLayer === 'original' && 'Showing unaltered raster evidence with interactive clickable anomaly regions.'}
            {selectedLayer === 'ela' && 'Error Level Analysis reveals compression disparity between genuine and spliced pixels.'}
            {selectedLayer === 'noise' && 'Sensor noise variance detects unnatural smoothing or copy-stamp brush strokes.'}
            {selectedLayer === 'typography' && 'Optical stroke alignment verifies uniform text baselines and font metrics.'}
          </p>
        </div>
      </div>
    </div>
  );
};
