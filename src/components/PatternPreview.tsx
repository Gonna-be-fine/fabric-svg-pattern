import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from 'fabric';
import { TileConfig, MockupType, RepeatMode } from '../types';
import { Download, Sliders, Maximize2, Sparkles, RefreshCw } from 'lucide-react';
import { generateFullSVGPattern, downloadFile } from '../utils/svgExport';

interface PatternPreviewProps {
  canvasRef: React.MutableRefObject<Canvas | null>;
  config: TileConfig;
  updateConfig: (cfg: Partial<TileConfig>) => void;
}

export const PatternPreview: React.FC<PatternPreviewProps> = ({
  canvasRef,
  config,
  updateConfig,
}) => {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [activeMockup, setActiveMockup] = useState<MockupType>('flat');
  const [tileImage, setTileImage] = useState<HTMLImageElement | null>(null);

  // Extract current tile snapshot as an image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 });
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      setTileImage(img);
    };
  }, [config.width, config.height, config.backgroundColor, config.transparentBackground]);

  // Render Pattern onto preview canvas
  useEffect(() => {
    const canvasEl = previewCanvasRef.current;
    if (!canvasEl || !tileImage) return;

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const cw = canvasEl.width;
    const ch = canvasEl.height;

    ctx.clearRect(0, 0, cw, ch);

    // Background fill
    if (!config.transparentBackground) {
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, cw, ch);
    }

    const tileW = config.width * scale;
    const tileH = config.height * scale;

    if (tileW <= 0 || tileH <= 0) return;

    const cols = Math.ceil(cw / tileW) + 2;
    const rows = Math.ceil(ch / tileH) + 2;

    for (let r = -1; r < rows; r++) {
      let rowOffsetX = 0;
      if (config.repeatMode === 'brick-row' && Math.abs(r) % 2 === 1) {
        rowOffsetX = tileW * config.rowShift;
      }

      for (let c = -1; c < cols; c++) {
        let colOffsetY = 0;
        if (config.repeatMode === 'brick-col' && Math.abs(c) % 2 === 1) {
          colOffsetY = tileH * config.colShift;
        }

        const x = c * tileW + rowOffsetX;
        const y = r * tileH + colOffsetY;

        ctx.drawImage(tileImage, x, y, tileW, tileH);
      }
    }
  }, [tileImage, scale, config.repeatMode, config.rowShift, config.colShift, config.width, config.height, config.backgroundColor, config.transparentBackground]);

  const handleDownloadWallpaper = () => {
    const canvasEl = previewCanvasRef.current;
    if (!canvasEl) return;
    const dataUrl = canvasEl.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `pattern-wallpaper-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-950 overflow-hidden select-none">
      {/* Sub-toolbar: Repeat Modes, Scale, Mockup Tabs */}
      <div className="h-12 border-b border-neutral-800 bg-neutral-900/50 px-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-neutral-300">Repeat Mode:</span>
          <div className="flex items-center bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => updateConfig({ repeatMode: 'grid' })}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                config.repeatMode === 'grid'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              1:1 Grid
            </button>
            <button
              onClick={() => updateConfig({ repeatMode: 'brick-row' })}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                config.repeatMode === 'brick-row'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Brick Row (50%)
            </button>
            <button
              onClick={() => updateConfig({ repeatMode: 'brick-col' })}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                config.repeatMode === 'brick-col'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Brick Column (50%)
            </button>
          </div>
        </div>

        {/* Scale Slider */}
        <div className="flex items-center gap-3">
          <Sliders className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-xs text-neutral-400">Scale:</span>
          <input
            type="range"
            min="0.3"
            max="2.5"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-28 accent-indigo-500 cursor-pointer"
          />
          <span className="text-xs font-mono text-neutral-300 w-12 tabular-nums">
            {Math.round(scale * 100)}%
          </span>
        </div>

        {/* Mockup Surface Switcher */}
        <div className="flex items-center gap-1.5 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-xs">
          <button
            onClick={() => setActiveMockup('flat')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeMockup === 'flat'
                ? 'bg-neutral-800 text-white font-medium shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Wallpaper
          </button>
          <button
            onClick={() => setActiveMockup('tote-bag')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeMockup === 'tote-bag'
                ? 'bg-neutral-800 text-white font-medium shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Tote Bag
          </button>
          <button
            onClick={() => setActiveMockup('phone-case')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeMockup === 'phone-case'
                ? 'bg-neutral-800 text-white font-medium shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Phone Case
          </button>
          <button
            onClick={() => setActiveMockup('mug')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeMockup === 'mug'
                ? 'bg-neutral-800 text-white font-medium shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Ceramic Mug
          </button>
        </div>

        {/* Download Wallpaper PNG */}
        <button
          onClick={handleDownloadWallpaper}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save Wallpaper</span>
        </button>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 relative flex items-center justify-center p-6 overflow-auto">
        {/* Hidden Canvas that generates the pattern texture buffer */}
        <canvas
          ref={previewCanvasRef}
          width={1200}
          height={800}
          className={activeMockup === 'flat' ? 'rounded-xl shadow-2xl border border-neutral-800 max-w-full max-h-[75vh] object-contain' : 'hidden'}
        />

        {/* Mockup 1: Tote Bag */}
        {activeMockup === 'tote-bag' && (
          <div className="relative w-96 h-[460px] flex flex-col items-center justify-center animate-in fade-in duration-200">
            {/* Bag Handles */}
            <div className="w-40 h-28 border-[10px] border-amber-950/70 rounded-t-full shadow-md z-0 -mb-6" />
            {/* Bag Body with masked pattern */}
            <div
              className="relative w-80 h-96 rounded-b-2xl shadow-2xl overflow-hidden border border-amber-900/40 z-10"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 2px 4px rgba(0,0,0,0.4)',
              }}
            >
              {/* Pattern Canvas as Background */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${previewCanvasRef.current?.toDataURL()})`,
                  backgroundSize: '360px',
                }}
              />
              {/* Tote Bag Texture lighting scrim */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />
              {/* Tote Fold shadows */}
              <div className="absolute inset-y-0 left-6 w-8 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
              <div className="absolute inset-y-0 right-6 w-8 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
              {/* Woven stitch border */}
              <div className="absolute inset-2 border border-dashed border-white/25 rounded-b-xl pointer-events-none" />
            </div>
            <span className="text-xs text-neutral-400 mt-4">Canvas Tote Bag Mockup</span>
          </div>
        )}

        {/* Mockup 2: Phone Case */}
        {activeMockup === 'phone-case' && (
          <div className="relative w-72 h-[480px] flex flex-col items-center justify-center animate-in fade-in duration-200">
            {/* Phone Case Frame */}
            <div
              className="relative w-64 h-[440px] rounded-[42px] p-2.5 bg-neutral-800 shadow-2xl border-4 border-neutral-700/80 overflow-hidden"
              style={{
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 2px rgba(255,255,255,0.2)',
              }}
            >
              {/* Pattern Surface */}
              <div
                className="w-full h-full rounded-[34px] overflow-hidden relative"
                style={{
                  backgroundImage: `url(${previewCanvasRef.current?.toDataURL()})`,
                  backgroundSize: '240px',
                }}
              >
                {/* Camera Island */}
                <div className="absolute top-4 left-4 w-20 h-22 bg-neutral-900/90 rounded-2xl border border-neutral-700/60 p-2 shadow-lg flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <div className="w-6 h-6 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-900/60" />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-900/60" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="w-6 h-6 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-900/60" />
                    </div>
                    <div className="w-3 h-3 rounded-full bg-amber-400/80 blur-[1px]" />
                  </div>
                </div>

                {/* Glossy Reflection Highlight */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none transform -rotate-12 scale-150" />
              </div>
            </div>
            <span className="text-xs text-neutral-400 mt-4">Matte Finish Smartphone Case</span>
          </div>
        )}

        {/* Mockup 3: Ceramic Mug */}
        {activeMockup === 'mug' && (
          <div className="relative w-80 h-[440px] flex flex-col items-center justify-center animate-in fade-in duration-200">
            <div className="relative flex items-center">
              {/* Mug Body */}
              <div
                className="relative w-56 h-64 rounded-b-3xl rounded-t-sm shadow-2xl overflow-hidden border-t-4 border-neutral-200/40 z-10"
                style={{
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${previewCanvasRef.current?.toDataURL()})`,
                    backgroundSize: '220px',
                  }}
                />
                {/* Cylindrical Gradient Shading */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/40 pointer-events-none" />
                <div className="absolute inset-y-0 left-8 w-6 bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
              </div>

              {/* Ceramic Handle */}
              <div
                className="w-20 h-36 rounded-r-3xl border-[14px] border-neutral-300 shadow-lg -ml-3 z-0"
                style={{
                  borderColor: config.transparentBackground ? '#e2e8f0' : config.backgroundColor,
                }}
              />
            </div>
            <span className="text-xs text-neutral-400 mt-6">Ceramic Coffee Mug Mockup</span>
          </div>
        )}
      </div>
    </div>
  );
};
