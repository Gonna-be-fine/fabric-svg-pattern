import React from 'react';
import { Download, Sparkles, Layers, Eye, Code, Palette, Undo2, Redo2 } from 'lucide-react';

interface HeaderProps {
  activeView: 'editor' | 'preview' | 'code';
  setActiveView: (view: 'editor' | 'preview' | 'code') => void;
  onOpenPresets: () => void;
  onOpenExport: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  tileWidth: number;
  tileHeight: number;
  repeatMode: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  onOpenPresets,
  onOpenExport,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  tileWidth,
  tileHeight,
  repeatMode,
}) => {
  return (
    <header className="h-14 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-4 flex items-center justify-between gap-8 select-none z-30 shrink-0">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-sm">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <circle cx="6.5" cy="17.5" r="3.5" />
          </svg>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-base tracking-tight text-white whitespace-nowrap">
            Fabric Pattern Studio
          </span>
          <span className="hidden sm:inline text-xs text-neutral-400 font-mono tabular-nums">
            {tileWidth}×{tileHeight}px · {repeatMode}
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links & View Tabs */}
      <nav className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-lg border border-neutral-800 text-xs font-medium text-neutral-300">
        <button
          onClick={() => setActiveView('editor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'editor'
              ? 'bg-neutral-800 text-white shadow-sm font-semibold'
              : 'hover:text-white hover:bg-neutral-800/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Tile Canvas</span>
        </button>

        <button
          onClick={() => setActiveView('preview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'preview'
              ? 'bg-neutral-800 text-white shadow-sm font-semibold'
              : 'hover:text-white hover:bg-neutral-800/50'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Mockups & Repeat</span>
        </button>

        <button
          onClick={() => setActiveView('code')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'code'
              ? 'bg-neutral-800 text-white shadow-sm font-semibold'
              : 'hover:text-white hover:bg-neutral-800/50'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>SVG Code</span>
        </button>

        <div className="w-px h-4 bg-neutral-800 mx-1" />

        <button
          onClick={onOpenPresets}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Presets</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action & History controls */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden md:flex items-center gap-1 border-r border-neutral-800 pr-2 mr-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 rounded hover:bg-neutral-800 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 rounded hover:bg-neutral-800 transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export SVG Pattern</span>
        </button>
      </div>
    </header>
  );
};
