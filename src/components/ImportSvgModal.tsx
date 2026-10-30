import React, { useState } from 'react';
import { Canvas, loadSVGFromString, Group, FabricObject } from 'fabric';
import { Upload, X, FileText, CheckCircle2 } from 'lucide-react';
import { TileConfig } from '../types';

interface ImportSvgModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.MutableRefObject<Canvas | null>;
  config: TileConfig;
}

export const ImportSvgModal: React.FC<ImportSvgModalProps> = ({
  isOpen,
  onClose,
  canvasRef,
  config,
}) => {
  const [svgInput, setSvgInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSvgInput(content);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!svgInput.trim() || !canvasRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const result = await loadSVGFromString(svgInput);
      const objects = result.objects.filter((obj): obj is FabricObject => Boolean(obj));

      if (!objects || objects.length === 0) {
        setError('No valid vector shapes found in the provided SVG markup.');
        setLoading(false);
        return;
      }

      const canvas = canvasRef.current;

      // Group objects to measure and position them nicely in the center of the tile
      const group = new Group(objects);
      const bounds = group.getBoundingRect();

      // If imported SVG is larger than tile, scale it down proportionally
      const maxDim = Math.max(bounds.width, bounds.height);
      const targetDim = Math.min(config.width, config.height) * 0.75;
      const scaleFactor = maxDim > targetDim ? targetDim / maxDim : 1;

      group.set({
        left: config.width / 2,
        top: config.height / 2,
        originX: 'center',
        originY: 'center',
        scaleX: scaleFactor,
        scaleY: scaleFactor,
      });

      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.renderAll();

      setLoading(false);
      onClose();
    } catch (err) {
      setError(`Failed to parse SVG: ${(err as Error).message}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-white">Import SVG Elements</h2>
              <p className="text-xs text-neutral-400">
                Upload a file or paste SVG code to add vector motifs into the pattern.
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

        <div className="p-6 space-y-4">
          {/* File Upload Zone */}
          <label className="border-2 border-dashed border-neutral-700 hover:border-indigo-500 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-neutral-950/40 hover:bg-indigo-600/5 transition-all text-center">
            <Upload className="w-6 h-6 text-neutral-400 mb-2" />
            <span className="text-xs font-semibold text-neutral-200">
              Click to browse .svg file
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5">
              Vector paths, shapes, or SVG icons
            </span>
            <input
              type="file"
              accept=".svg"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-neutral-800" />
            <span className="text-[11px] text-neutral-500 font-medium uppercase">Or paste SVG code</span>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>

          {/* Raw SVG Text Area */}
          <div>
            <textarea
              rows={6}
              value={svgInput}
              onChange={(e) => setSvgInput(e.target.value)}
              placeholder="<svg xmlns='http://www.w3.org/2000/svg' ...> <path .../> </svg>"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs font-mono text-neutral-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-950/30 border border-rose-800/40 p-2.5 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={loading || !svgInput.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg shadow-sm transition-all"
            >
              {loading ? 'Parsing...' : 'Add to Canvas'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
