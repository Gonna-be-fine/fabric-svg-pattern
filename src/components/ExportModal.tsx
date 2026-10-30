import React, { useState } from 'react';
import { Canvas } from 'fabric';
import { TileConfig } from '../types';
import {
  generateFullSVGPattern,
  generateSingleTileSVG,
  generateCSSBackground,
  generateReactComponent,
  downloadFile,
} from '../utils/svgExport';
import { Download, Copy, Check, X, FileCode, Layers, Image as ImageIcon } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.MutableRefObject<Canvas | null>;
  config: TileConfig;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  canvasRef,
  config,
}) => {
  const [activeTab, setActiveTab] = useState<'svg' | 'css' | 'react'>('svg');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !canvasRef.current) return null;

  const fullSvg = generateFullSVGPattern(canvasRef.current, config, 800, 600);
  const singleTileSvg = generateSingleTileSVG(canvasRef.current, config);
  const cssCode = generateCSSBackground(fullSvg);
  const reactCode = generateReactComponent(canvasRef.current, config);

  const currentCode =
    activeTab === 'svg' ? fullSvg : activeTab === 'css' ? cssCode : reactCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFullSVG = () => {
    downloadFile(fullSvg, `pattern-${Date.now()}.svg`, 'image/svg+xml');
  };

  const handleDownloadTileSVG = () => {
    downloadFile(singleTileSvg, `tile-${Date.now()}.svg`, 'image/svg+xml');
  };

  const handleDownloadTilePNG = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL({
      format: 'png',
      multiplier: 3, // Crisp 3x retina resolution
    });
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `tile-${config.width}x${config.height}@3x.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-white">Export SVG Pattern</h2>
              <p className="text-xs text-neutral-400">
                Production-ready vector SVG patterns, single tiles, CSS data URIs, and React components.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Download Buttons Row */}
        <div className="p-6 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-950/40 border-b border-neutral-800/80">
          <button
            onClick={handleDownloadFullSVG}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Pattern SVG</span>
          </button>

          <button
            onClick={handleDownloadTileSVG}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-all border border-neutral-700/60"
          >
            <Layers className="w-4 h-4" />
            <span>Download Tile SVG</span>
          </button>

          <button
            onClick={handleDownloadTilePNG}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-all border border-neutral-700/60"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Download Tile PNG (3x)</span>
          </button>
        </div>

        {/* Code Tabs */}
        <div className="px-6 py-2 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/20">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('svg')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'svg'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              SVG Markup
            </button>
            <button
              onClick={() => setActiveTab('css')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'css'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              CSS Background
            </button>
            <button
              onClick={() => setActiveTab('react')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'react'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              React Component
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy to Clipboard</span>
              </>
            )}
          </button>
        </div>

        {/* Code Viewer */}
        <div className="flex-1 overflow-auto p-4 bg-neutral-950 font-mono text-xs text-neutral-300 leading-relaxed">
          <pre className="whitespace-pre-wrap break-all">{currentCode}</pre>
        </div>
      </div>
    </div>
  );
};
