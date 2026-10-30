import React, { useState, useRef } from 'react';
import {
  MousePointer,
  Shapes,
  Paintbrush,
  Type,
  Upload,
  Repeat,
  Trash2,
  ChevronDown,
  Grid,
  Crosshair,
  Copy,
} from 'lucide-react';
import { ActiveTool } from '../types';
import { SHAPE_LIBRARY, ShapeDefinition } from '../utils/shapeLibrary';

interface ToolbarProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  onAddShape: (shape: ShapeDefinition) => void;
  onAddText: () => void;
  onImportSVG: () => void;
  onSeamlessWrap: () => void;
  onClear: () => void;
  onDuplicate: () => void;
  brushColor: string;
  setBrushColor: (c: string) => void;
  brushWidth: number;
  setBrushWidth: (w: number) => void;
  showGrid: boolean;
  setShowGrid: (v: boolean) => void;
  showGhostTiles: boolean;
  setShowGhostTiles: (v: boolean) => void;
  showCenterCrosshair: boolean;
  setShowCenterCrosshair: (v: boolean) => void;
  hasSelection: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  setActiveTool,
  onAddShape,
  onAddText,
  onImportSVG,
  onSeamlessWrap,
  onClear,
  onDuplicate,
  brushColor,
  setBrushColor,
  brushWidth,
  setBrushWidth,
  showGrid,
  setShowGrid,
  showGhostTiles,
  setShowGhostTiles,
  showCenterCrosshair,
  setShowCenterCrosshair,
  hasSelection,
}) => {
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showBrushMenu, setShowBrushMenu] = useState(false);
  const shapeMenuRef = useRef<HTMLDivElement>(null);

  const categories = ['Basic', 'Geometric', 'Organic', 'Traditional', 'Decorative'] as const;

  return (
    <aside className="w-16 border-r border-neutral-800 bg-neutral-900/60 flex flex-col items-center py-3 gap-2 z-20 shrink-0 select-none">
      {/* Pointer / Select tool */}
      <button
        onClick={() => setActiveTool('select')}
        title="Select & Transform (V)"
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
          activeTool === 'select'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
        }`}
      >
        <MousePointer className="w-4 h-4" />
      </button>

      {/* Shapes Dropdown */}
      <div className="relative">
        <button
          onClick={() => {
            setShowShapeMenu(!showShapeMenu);
            setShowBrushMenu(false);
          }}
          title="Add Vector Shape"
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all relative ${
            showShapeMenu || activeTool === 'shape'
              ? 'bg-neutral-800 text-indigo-400 ring-1 ring-indigo-500'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Shapes className="w-4 h-4" />
          <ChevronDown className="w-2.5 h-2.5 absolute bottom-1 right-1 opacity-70" />
        </button>

        {showShapeMenu && (
          <div
            ref={shapeMenuRef}
            className="fixed left-18 top-20 w-80 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
              <span className="text-xs font-semibold text-neutral-200">Vector Shapes & Motifs</span>
              <button
                onClick={() => setShowShapeMenu(false)}
                className="text-xs text-neutral-500 hover:text-neutral-300"
              >
                ✕
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
              {categories.map((cat) => {
                const shapes = SHAPE_LIBRARY.filter((s) => s.category === cat);
                if (shapes.length === 0) return null;

                return (
                  <div key={cat}>
                    <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                      {cat}
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {shapes.map((shape) => (
                        <button
                          key={shape.id}
                          onClick={() => {
                            onAddShape(shape);
                            setShowShapeMenu(false);
                            setActiveTool('select');
                          }}
                          className="flex flex-col items-center justify-center p-2 rounded-lg bg-neutral-800/60 hover:bg-indigo-600/20 hover:border-indigo-500 border border-transparent transition-all group text-center"
                          title={shape.name}
                        >
                          <div className="w-6 h-6 flex items-center justify-center text-neutral-300 group-hover:text-indigo-400">
                            {shape.id === 'rect' && <div className="w-4 h-4 bg-current rounded-sm" />}
                            {shape.id === 'circle' && <div className="w-4 h-4 bg-current rounded-full" />}
                            {shape.id === 'triangle' && (
                              <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[14px] border-transparent border-b-current" />
                            )}
                            {shape.type === 'path' && shape.path && (
                              <svg viewBox="0 0 40 40" className="w-5 h-5 fill-current">
                                <path d={shape.path} />
                              </svg>
                            )}
                            {shape.type === 'polygon' && (
                              <svg viewBox="0 0 40 40" className="w-5 h-5 fill-current">
                                <polygon points={shape.points?.map((p) => `${p.x},${p.y}`).join(' ')} />
                              </svg>
                            )}
                          </div>
                          <span className="text-[10px] text-neutral-400 group-hover:text-neutral-200 mt-1 truncate w-full">
                            {shape.name.split(' ')[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Freehand Brush tool */}
      <div className="relative">
        <button
          onClick={() => {
            const next = activeTool === 'brush' ? 'select' : 'brush';
            setActiveTool(next);
            setShowBrushMenu(next === 'brush');
            setShowShapeMenu(false);
          }}
          title="Freehand Pencil Brush"
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'brush'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Paintbrush className="w-4 h-4" />
        </button>

        {showBrushMenu && activeTool === 'brush' && (
          <div className="fixed left-18 top-32 w-56 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-3 z-50">
            <span className="text-xs font-semibold text-neutral-200 block mb-2">Brush Settings</span>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-7 h-7 rounded border border-neutral-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200 font-mono"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Width</span>
                  <span className="font-mono">{brushWidth}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="24"
                  value={brushWidth}
                  onChange={(e) => setBrushWidth(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Text tool */}
      <button
        onClick={() => {
          onAddText();
          setActiveTool('select');
        }}
        title="Add Text"
        className="w-10 h-10 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
      >
        <Type className="w-4 h-4" />
      </button>

      {/* Import SVG */}
      <button
        onClick={onImportSVG}
        title="Import / Paste SVG"
        className="w-10 h-10 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
      >
        <Upload className="w-4 h-4" />
      </button>

      <div className="w-8 h-px bg-neutral-800 my-1" />

      {/* Seamless Wrap Tool */}
      <button
        onClick={onSeamlessWrap}
        title="Seamless Edge Wrap (Duplicate overflowing elements across tile seams)"
        className="w-10 h-10 rounded-lg flex items-center justify-center text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300 transition-all"
      >
        <Repeat className="w-4 h-4" />
      </button>

      {/* Duplicate Selected */}
      {hasSelection && (
        <button
          onClick={onDuplicate}
          title="Duplicate Selection (Ctrl+D)"
          className="w-10 h-10 rounded-lg flex items-center justify-center text-indigo-400 hover:bg-indigo-500/15 hover:text-indigo-300 transition-all"
        >
          <Copy className="w-4 h-4" />
        </button>
      )}

      {/* Clear Canvas */}
      <button
        onClick={onClear}
        title="Clear All Objects"
        className="w-10 h-10 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* View Toggles at bottom */}
      <div className="mt-auto space-y-1">
        <button
          onClick={() => setShowGhostTiles(!showGhostTiles)}
          title={`Toggle 3x3 Ghost Neighbor Tiles (${showGhostTiles ? 'On' : 'Off'})`}
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs transition-all ${
            showGhostTiles
              ? 'bg-neutral-800 text-indigo-400 border border-indigo-500/40'
              : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
          }`}
        >
          <span className="font-mono text-[10px] font-bold">3×3</span>
        </button>

        <button
          onClick={() => setShowGrid(!showGrid)}
          title={`Toggle Grid Guides (${showGrid ? 'On' : 'Off'})`}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            showGrid
              ? 'bg-neutral-800 text-indigo-400 border border-indigo-500/40'
              : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
          }`}
        >
          <Grid className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowCenterCrosshair(!showCenterCrosshair)}
          title={`Toggle Center Crosshairs (${showCenterCrosshair ? 'On' : 'Off'})`}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            showCenterCrosshair
              ? 'bg-neutral-800 text-indigo-400 border border-indigo-500/40'
              : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
          }`}
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
