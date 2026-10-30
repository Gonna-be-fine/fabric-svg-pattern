import React, { useState } from 'react';
import { PatternPreset } from '../types';
import { PATTERN_PRESETS } from '../utils/presets';
import { Sparkles, X, ArrowRight } from 'lucide-react';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: PatternPreset) => void;
}

export const PresetModal: React.FC<PresetModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Geometric', 'Traditional', 'Artistic', 'Minimal', 'Textile'] as const;

  const filteredPresets =
    selectedCategory === 'All'
      ? PATTERN_PRESETS
      : PATTERN_PRESETS.filter((p) => p.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">Pattern Library Presets</h2>
              <p className="text-xs text-neutral-400">
                Pick a professionally designed seamless pattern to inspect, tweak, and export with Fabric.js.
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

        {/* Category Tabs */}
        <div className="px-6 py-2.5 border-b border-neutral-800/80 bg-neutral-950/40 flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Preset Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPresets.map((preset) => (
            <div
              key={preset.id}
              className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-500/60 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {preset.name}
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                    {preset.tileWidth}×{preset.tileHeight}px
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
                  {preset.description}
                </p>

                {/* Micro Visual representation */}
                <div
                  className="w-full h-24 rounded-lg overflow-hidden border border-neutral-800 mb-4 relative flex items-center justify-center"
                  style={{ backgroundColor: preset.backgroundColor }}
                >
                  <div className="text-[11px] font-mono text-neutral-400/80 bg-neutral-900/80 px-2 py-1 rounded border border-neutral-800 backdrop-blur-sm">
                    {preset.shapes.length} Vector Elements · {preset.repeatMode}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 bg-neutral-800 hover:bg-indigo-600 text-neutral-200 hover:text-white rounded-lg text-xs font-semibold transition-all group-hover:shadow-md"
              >
                <span>Load Into Canvas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
