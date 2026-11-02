import React, { useState, useMemo, useEffect } from 'react';
import {
  Shapes,
  Target,
  Layers,
  Upload,
  Sliders,
  RotateCw,
  Eye,
  Move,
  Trash2,
  Paintbrush,
  Sparkles,
  Palette,
} from 'lucide-react';
import { ColorPrevList, JerseyPartConfig } from '../configs/jerseyParts';
import { PatternPresets, PatternItem } from '../configs/patterns';
import { PatternOptions } from '../utils/JerseyFabricEditor';
import { throttle } from 'lodash';

interface JerseyPatternTabProps {
  selectedPartId: string;
  setSelectedPartId: (id: string) => void;
  onSetPattern: (partId: string, options: PatternOptions) => void;
  onRemovePattern: (partId: string, resetColor?: string) => void;
  onOpenTileStudio: () => void;
  currentPatterns: Map<string, PatternOptions>;
  activePartColors: Map<string, string>;
}

export const JerseyPatternTab: React.FC<JerseyPatternTabProps> = ({
  selectedPartId,
  setSelectedPartId,
  onSetPattern,
  onRemovePattern,
  onOpenTileStudio,
  currentPatterns,
  activePartColors,
}) => {
  const categories = [
    'All',
    'Lines',
    'Texture',
    'Shapes',
    'Classic',
    'Camo',
    'Tech',
    'Artwork',
  ] as const;

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [customPatterns, setCustomPatterns] = useState<PatternItem[]>([]);

  // Pattern controls state
  const [activePatternItem, setActivePatternItem] = useState<PatternItem | null>(null);
  const [patternScale, setPatternScale] = useState<number>(1.0);
  const [patternAngle, setPatternAngle] = useState<number>(0);
  const [patternOpacity, setPatternOpacity] = useState<number>(1.0);
  const [patternOffsetX, setPatternOffsetX] = useState<number>(0);
  const [patternOffsetY, setPatternOffsetY] = useState<number>(0);
  const [patternColor, setPatternColor] = useState<string | null>(null);
  const [activeBgColor, setActiveBgColor] = useState<string>('#1E293B');

  const quickColors = [
    '#000000',
    '#ffffff',
    '#DA1A32',
    '#0047AB',
    '#008000',
    '#FFD700',
    '#FF69B4',
    '#800080',
  ];

  // Sync state when selected part changes or current patterns change
  useEffect(() => {
    const activeMeta = currentPatterns.get(selectedPartId);
    if (activeMeta) {
      setPatternScale(activeMeta.scale ?? 1.0);
      setPatternAngle(activeMeta.angle ?? 0);
      setPatternOpacity(activeMeta.opacity ?? 1.0);
      setPatternOffsetX(activeMeta.offsetX ?? 0);
      setPatternOffsetY(activeMeta.offsetY ?? 0);
      setPatternColor(activeMeta.patternColor ?? null);
      if (activeMeta.bgColor) {
        setActiveBgColor(activeMeta.bgColor);
      }
    } else {
      const partColor = activePartColors.get(selectedPartId);
      if (partColor) {
        setActiveBgColor(partColor);
      }
    }
  }, [selectedPartId, currentPatterns, activePartColors]);

  const allPatterns = useMemo(() => {
    return [...customPatterns, ...PatternPresets];
  }, [customPatterns]);

  const filteredPatterns = useMemo(() => {
    if (activeCategory === 'All') return allPatterns;
    return allPatterns.filter((p) => p.category === activeCategory);
  }, [allPatterns, activeCategory]);

  const activePartName = useMemo(() => {
    if (selectedPartId === 'ALL') return 'All Panels (全局)';
    const part = ColorPrevList.find((p) => p.id === selectedPartId);
    return part ? `${part.name} (${part.ename})` : selectedPartId;
  }, [selectedPartId]);

  // Throttled emitter for slider drags
  const emitPattern = (override: Partial<PatternOptions> = {}) => {
    if (!activePatternItem) return;

    const options: PatternOptions = {
      patternId: activePatternItem.id,
      name: activePatternItem.name,
      category: activePatternItem.category,
      url: activePatternItem.url,
      svgContent: activePatternItem.svgContent,
      scale: patternScale,
      angle: patternAngle,
      opacity: patternOpacity,
      offsetX: patternOffsetX,
      offsetY: patternOffsetY,
      patternColor: patternColor,
      bgColor: activeBgColor,
      tileWidth: activePatternItem.tileWidth,
      tileHeight: activePatternItem.tileHeight,
      ...override,
    };

    onSetPattern(selectedPartId, options);
  };

  const throttledEmit = useMemo(
    () => throttle(emitPattern, 50, { leading: true, trailing: true }),
    [
      activePatternItem,
      patternScale,
      patternAngle,
      patternOpacity,
      patternOffsetX,
      patternOffsetY,
      patternColor,
      activeBgColor,
      selectedPartId,
    ]
  );

  const handleSelectPattern = (item: PatternItem) => {
    setActivePatternItem(item);

    // Apply the clicked item directly. React state updates are async, so
    // emitPattern() here would still read the previously selected item.
    onSetPattern(selectedPartId, {
      patternId: item.id,
      name: item.name,
      category: item.category,
      url: item.url,
      svgContent: item.svgContent,
      scale: patternScale,
      angle: patternAngle,
      opacity: patternOpacity,
      offsetX: patternOffsetX,
      offsetY: patternOffsetY,
      patternColor,
      bgColor: activeBgColor,
      tileWidth: item.tileWidth,
      tileHeight: item.tileHeight,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name);
    const createPattern = (url: string, svgContent = '', tileWidth = 100, tileHeight = 100) => {
      const newPattern: PatternItem = {
        id: `custom_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        category: 'Artwork',
        tileWidth,
        tileHeight,
        svgContent,
        url,
      };

      setCustomPatterns((prev) => [newPattern, ...prev]);
      handleSelectPattern(newPattern);
    };

    if (isSvg) {
      // Keep the original XML for vector export; the data URL is preview-only.
      const reader = new FileReader();
      reader.onload = () => {
        const svgText = String(reader.result || '');
        let tileWidth = 100;
        let tileHeight = 100;

        try {
          const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
          const root = doc.documentElement;
          const viewBox = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
          const widthAttr = parseFloat(root.getAttribute('width') || '');
          const heightAttr = parseFloat(root.getAttribute('height') || '');
          if (viewBox.length === 4 && viewBox[2] > 0 && viewBox[3] > 0) {
            tileWidth = viewBox[2];
            tileHeight = viewBox[3];
          } else {
            if (widthAttr > 0) tileWidth = widthAttr;
            if (heightAttr > 0) tileHeight = heightAttr;
          }
        } catch {
          // Preserve the original source even if a non-standard SVG needs repair.
        }

        const previewUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
        createPattern(previewUrl, svgText, tileWidth, tileHeight);
      };
      reader.readAsText(file);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => createPattern(String(reader.result || ''));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleReset = () => {
    setPatternScale(1.0);
    setPatternAngle(0);
    setPatternOpacity(1.0);
    setPatternOffsetX(0);
    setPatternOffsetY(0);
    setPatternColor(null);
    emitPattern({
      scale: 1.0,
      angle: 0,
      opacity: 1.0,
      offsetX: 0,
      offsetY: 0,
      patternColor: null,
    });
  };

  const handleRemove = () => {
    setActivePatternItem(null);
    onRemovePattern(selectedPartId, activeBgColor);
  };

  return (
    <div className="w-96 border-l border-neutral-800 bg-neutral-900/90 backdrop-blur-md flex flex-col h-full z-20 shrink-0 select-none overflow-hidden text-xs">
      {/* Tab Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shapes className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-neutral-100 tracking-wide uppercase text-xs">
              Pattern Fill (分块平铺)
            </h3>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            针对球衣各个结构分块精准施加 SVG Pattern 矢量平铺
          </p>
        </div>

        <button
          onClick={onOpenTileStudio}
          title="打开 Fabric.js Pattern 绘图编辑器自定义瓦片"
          className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-medium transition-colors"
        >
          <Paintbrush className="w-3 h-3" />
          <span>图案工坊</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 1. Target Area (目标分块) */}
        <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-950/70 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              <span>Target Area (设计分块)</span>
            </span>
            <span className="text-[10px] text-indigo-400 font-mono font-medium truncate max-w-[130px]">
              {activePartName}
            </span>
          </div>

          {/* Panel Selector Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {/* All Panels Button */}
            <button
              onClick={() => setSelectedPartId('ALL')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                selectedPartId === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30 font-semibold'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>All Panels</span>
            </button>

            {/* Individual Parts from ColorPrevList */}
            {ColorPrevList.map((part) => {
              const hasPattern = currentPatterns.has(part.id);
              const partColor = activePartColors.get(part.id) || part.defaultColor;

              return (
                <button
                  key={part.id}
                  onClick={() => setSelectedPartId(part.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                    selectedPartId === part.id
                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30 font-semibold'
                      : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-800'
                  }`}
                  title={`${part.name} - ${part.description}`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-neutral-700 inline-block shrink-0"
                    style={{ backgroundColor: partColor }}
                  />
                  <span>{part.name}</span>
                  {hasPattern && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="已设置 Pattern" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Category Selector */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors shrink-0 ${
                activeCategory === cat
                  ? 'bg-neutral-200 text-neutral-900 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 3. Pattern Selection Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Upload Button */}
          <label className="relative flex flex-col items-center justify-center p-2 h-24 rounded-xl border-2 border-dashed border-indigo-500/40 hover:border-indigo-500 bg-indigo-500/5 hover:bg-indigo-500/10 cursor-pointer transition-all group text-center">
            <input
              type="file"
              accept="image/*,.svg"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Upload className="w-5 h-5 text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-medium text-indigo-400">Upload</span>
            <span className="text-[9px] text-neutral-500">PNG / SVG</span>
          </label>

          {/* Pattern Cards */}
          {filteredPatterns.map((pattern) => {
            const isSelected = activePatternItem?.id === pattern.id;

            return (
              <div
                key={pattern.id}
                onClick={() => handleSelectPattern(pattern)}
                className={`relative p-1.5 h-24 rounded-xl border cursor-pointer transition-all flex flex-col justify-between overflow-hidden group ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30 shadow-md'
                    : 'border-neutral-800 bg-neutral-950/80 hover:border-neutral-700'
                }`}
              >
                <div
                  className="w-full flex-1 rounded-lg border border-neutral-800 overflow-hidden relative"
                  style={{
                    backgroundColor: activeBgColor,
                    backgroundImage: `url(${pattern.url})`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '24px 24px',
                  }}
                />
                <p className="text-[10px] font-semibold text-neutral-300 mt-1 truncate text-center">
                  {pattern.name}
                </p>
              </div>
            );
          })}
        </div>

        {/* 4. Pattern Controls Panel */}
        {activePatternItem && (
          <div className="space-y-4 p-4 rounded-xl border border-neutral-800 bg-neutral-950/80 shadow-sm animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Pattern Controls</span>
              </span>
              <button
                onClick={handleReset}
                className="text-[10px] text-neutral-400 hover:text-indigo-400 transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Scale */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-medium">Scale (缩放)</span>
                <span className="font-mono text-indigo-400 font-semibold tabular-nums">
                  {patternScale.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="8.0"
                step="0.05"
                value={patternScale}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setPatternScale(val);
                  throttledEmit({ scale: val });
                }}
                className="w-full accent-indigo-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Rotation */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-medium">Rotation (旋转角度)</span>
                <span className="font-mono text-indigo-400 font-semibold tabular-nums">
                  {patternAngle}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={patternAngle}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setPatternAngle(val);
                  throttledEmit({ angle: val });
                }}
                className="w-full accent-indigo-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Opacity */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-medium">Opacity (不透明度)</span>
                <span className="font-mono text-indigo-400 font-semibold tabular-nums">
                  {Math.round(patternOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={patternOpacity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setPatternOpacity(val);
                  throttledEmit({ opacity: val });
                }}
                className="w-full accent-indigo-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Offset X */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-medium">Offset X (水平偏移)</span>
                <span className="font-mono text-indigo-400 font-semibold tabular-nums">
                  {patternOffsetX}px
                </span>
              </div>
              <input
                type="range"
                min="-300"
                max="300"
                step="2"
                value={patternOffsetX}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setPatternOffsetX(val);
                  throttledEmit({ offsetX: val });
                }}
                className="w-full accent-indigo-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Offset Y */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-medium">Offset Y (垂直偏移)</span>
                <span className="font-mono text-indigo-400 font-semibold tabular-nums">
                  {patternOffsetY}px
                </span>
              </div>
              <input
                type="range"
                min="-300"
                max="300"
                step="2"
                value={patternOffsetY}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setPatternOffsetY(val);
                  throttledEmit({ offsetY: val });
                }}
                className="w-full accent-indigo-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Pattern Tint (图案着色) */}
            <div className="space-y-2 border-t border-neutral-800/80 pt-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-300 font-medium">Pattern Tint (图案染色)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPatternColor(null);
                      emitPattern({ patternColor: null });
                    }}
                    className="text-[10px] text-neutral-400 hover:text-white underline"
                  >
                    Original
                  </button>
                  <input
                    type="color"
                    value={patternColor || '#ffffff'}
                    onChange={(e) => {
                      setPatternColor(e.target.value);
                      emitPattern({ patternColor: e.target.value });
                    }}
                    className="w-5 h-5 rounded border-0 cursor-pointer p-0 bg-transparent"
                  />
                </div>
              </div>

              {/* Quick Tint Colors */}
              <div className="flex flex-wrap gap-1.5">
                {/* Original button with red slash */}
                <button
                  type="button"
                  title="Original / 原色"
                  onClick={() => {
                    setPatternColor(null);
                    emitPattern({ patternColor: null });
                  }}
                  className={`w-6 h-6 rounded-full border border-neutral-700 transition-transform cursor-pointer relative overflow-hidden bg-neutral-900 ${
                    patternColor === null ? 'ring-2 ring-indigo-500 scale-110 shadow' : ''
                  }`}
                >
                  <span className="absolute left-1/2 top-1/2 w-8 h-[2px] bg-rose-500 -translate-x-1/2 -translate-y-1/2 rotate-45" />
                </button>

                {quickColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setPatternColor(color);
                      emitPattern({ patternColor: color });
                    }}
                    className={`w-6 h-6 rounded-full border border-neutral-700 transition-transform hover:scale-110 ${
                      patternColor === color ? 'ring-2 ring-indigo-500 scale-110 shadow' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Background Color */}
            <div className="space-y-2 border-t border-neutral-800/80 pt-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-300 font-medium">Background (底衬颜色)</span>
                <input
                  type="color"
                  value={activeBgColor}
                  onChange={(e) => {
                    setActiveBgColor(e.target.value);
                    emitPattern({ bgColor: e.target.value });
                  }}
                  className="w-5 h-5 rounded border-0 cursor-pointer p-0 bg-transparent"
                />
              </div>

              {/* Quick Background Colors */}
              <div className="flex flex-wrap gap-1.5">
                {quickColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setActiveBgColor(color);
                      emitPattern({ bgColor: color });
                    }}
                    className={`w-6 h-6 rounded-full border border-neutral-700 transition-transform hover:scale-110 ${
                      activeBgColor === color ? 'ring-2 ring-indigo-500 scale-110 shadow' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Remove Pattern Button */}
            <div className="pt-2">
              <button
                onClick={handleRemove}
                className="w-full py-2 px-3 rounded-xl border border-rose-900/40 bg-rose-950/20 text-rose-400 text-xs font-semibold hover:bg-rose-900/40 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Pattern (清除平铺)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
