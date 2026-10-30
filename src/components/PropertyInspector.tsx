import React, { useState, useEffect } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { TileConfig, ColorPalette } from '../types';
import {
  alignObjects,
  applyPaletteToCanvas,
  makeSeamlessWrap,
} from '../utils/fabricHelpers';
import { COLOR_PALETTES } from '../utils/presets';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  BringToFront,
  SendToBack,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Copy,
  Trash2,
  Sliders,
  PaintBucket,
  Maximize,
  Repeat,
  Palette,
} from 'lucide-react';

interface PropertyInspectorProps {
  canvasRef: React.MutableRefObject<Canvas | null>;
  config: TileConfig;
  updateConfig: (cfg: Partial<TileConfig>) => void;
  selectionVersion: number;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  canvasRef,
  config,
  updateConfig,
  selectionVersion,
}) => {
  const [activeTab, setActiveTab] = useState<'object' | 'tile'>('tile');
  const [activeObj, setActiveObj] = useState<FabricObject | null>(null);

  // Inspector state
  const [fill, setFill] = useState<string>('#6366F1');
  const [stroke, setStroke] = useState<string>('#4338CA');
  const [strokeWidth, setStrokeWidth] = useState<number>(0);
  const [strokeDash, setStrokeDash] = useState<string>('solid');
  const [opacity, setOpacity] = useState<number>(1);
  const [angle, setAngle] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [left, setLeft] = useState<number>(0);
  const [top, setTop] = useState<number>(0);

  // Sync state whenever selection changes in canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const selected = canvas.getActiveObject();
    if (selected) {
      setActiveObj(selected);
      setActiveTab('object');

      setFill(typeof selected.fill === 'string' ? selected.fill : '#6366F1');
      setStroke(typeof selected.stroke === 'string' ? selected.stroke : '#4338CA');
      setStrokeWidth(selected.strokeWidth || 0);
      setOpacity(selected.opacity ?? 1);
      setAngle(Math.round(selected.angle || 0));
      setLeft(Math.round(selected.left || 0));
      setTop(Math.round(selected.top || 0));
      setWidth(Math.round((selected.width || 0) * (selected.scaleX || 1)));
      setHeight(Math.round((selected.height || 0) * (selected.scaleY || 1)));

      if (selected.strokeDashArray && selected.strokeDashArray.length > 0) {
        setStrokeDash(selected.strokeDashArray[0] > 3 ? 'dashed' : 'dotted');
      } else {
        setStrokeDash('solid');
      }
    } else {
      setActiveObj(null);
      setActiveTab('tile');
    }
  }, [selectionVersion]);

  // Object property update handlers
  const handleFillChange = (newFill: string) => {
    setFill(newFill);
    if (activeObj && canvasRef.current) {
      activeObj.set('fill', newFill);
      canvasRef.current.renderAll();
    }
  };

  const handleStrokeChange = (newStroke: string) => {
    setStroke(newStroke);
    if (activeObj && canvasRef.current) {
      activeObj.set('stroke', newStroke);
      if (strokeWidth === 0) {
        setStrokeWidth(2);
        activeObj.set('strokeWidth', 2);
      }
      canvasRef.current.renderAll();
    }
  };

  const handleStrokeWidthChange = (val: number) => {
    setStrokeWidth(val);
    if (activeObj && canvasRef.current) {
      activeObj.set('strokeWidth', val);
      canvasRef.current.renderAll();
    }
  };

  const handleStrokeDashChange = (style: 'solid' | 'dashed' | 'dotted') => {
    setStrokeDash(style);
    if (activeObj && canvasRef.current) {
      if (style === 'solid') {
        activeObj.set('strokeDashArray', undefined);
      } else if (style === 'dashed') {
        activeObj.set('strokeDashArray', [6, 6]);
      } else if (style === 'dotted') {
        activeObj.set('strokeDashArray', [2, 4]);
      }
      canvasRef.current.renderAll();
    }
  };

  const handleOpacityChange = (val: number) => {
    setOpacity(val);
    if (activeObj && canvasRef.current) {
      activeObj.set('opacity', val);
      canvasRef.current.renderAll();
    }
  };

  const handleAngleChange = (val: number) => {
    setAngle(val);
    if (activeObj && canvasRef.current) {
      activeObj.set('angle', val);
      activeObj.setCoords();
      canvasRef.current.renderAll();
    }
  };

  const handleFlip = (axis: 'x' | 'y') => {
    if (!activeObj || !canvasRef.current) return;
    if (axis === 'x') {
      activeObj.set('flipX', !activeObj.flipX);
    } else {
      activeObj.set('flipY', !activeObj.flipY);
    }
    activeObj.setCoords();
    canvasRef.current.renderAll();
  };

  const handleRotate90 = () => {
    if (!activeObj || !canvasRef.current) return;
    const nextAngle = ((activeObj.angle || 0) + 90) % 360;
    activeObj.set('angle', nextAngle);
    setAngle(nextAngle);
    activeObj.setCoords();
    canvasRef.current.renderAll();
  };

  const handleDuplicate = async () => {
    if (!activeObj || !canvasRef.current) return;
    const cloned = await activeObj.clone();
    cloned.set({
      left: (activeObj.left || 0) + 12,
      top: (activeObj.top || 0) + 12,
    });
    canvasRef.current.add(cloned);
    canvasRef.current.setActiveObject(cloned);
    canvasRef.current.renderAll();
  };

  const handleDelete = () => {
    if (!activeObj || !canvasRef.current) return;
    canvasRef.current.remove(activeObj);
    canvasRef.current.discardActiveObject();
    canvasRef.current.renderAll();
    setActiveObj(null);
    setActiveTab('tile');
  };

  const handleLayerOrder = (direction: 'front' | 'back' | 'forward' | 'backward') => {
    if (!activeObj || !canvasRef.current) return;
    const canvas = canvasRef.current;
    if (direction === 'front') {
      canvas.bringObjectToFront(activeObj);
    } else if (direction === 'back') {
      canvas.sendObjectToBack(activeObj);
    } else if (direction === 'forward') {
      canvas.bringObjectForward(activeObj);
    } else if (direction === 'backward') {
      canvas.sendObjectBackwards(activeObj);
    }
    canvas.renderAll();
  };

  const handleAlign = (alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    if (!canvasRef.current) return;
    alignObjects(canvasRef.current, alignment, config.width, config.height);
  };

  const handleApplyPalette = (palette: ColorPalette) => {
    if (!canvasRef.current) return;
    applyPaletteToCanvas(canvasRef.current, palette, (newBg) => {
      updateConfig({ backgroundColor: newBg });
    });
  };

  return (
    <aside className="w-80 border-l border-neutral-800 bg-neutral-900/60 flex flex-col z-20 shrink-0 select-none overflow-hidden text-xs">
      {/* Inspector Tab Switcher */}
      <div className="h-11 border-b border-neutral-800 flex items-center px-3 bg-neutral-900/40">
        <div className="flex bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 w-full">
          <button
            onClick={() => setActiveTab('object')}
            className={`flex-1 py-1 rounded-md font-medium text-center transition-colors ${
              activeTab === 'object'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Object {activeObj ? '●' : ''}
          </button>
          <button
            onClick={() => setActiveTab('tile')}
            className={`flex-1 py-1 rounded-md font-medium text-center transition-colors ${
              activeTab === 'tile'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Tile & Harmonies
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* TAB 1: OBJECT PROPERTIES */}
        {activeTab === 'object' && (
          <>
            {activeObj ? (
              <div className="space-y-4">
                {/* Fill Color */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-semibold text-neutral-300">Fill</span>
                    <button
                      onClick={() => handleFillChange('transparent')}
                      className="text-[11px] text-neutral-400 hover:text-white"
                    >
                      Transparent
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fill === 'transparent' ? '#000000' : fill}
                      onChange={(e) => handleFillChange(e.target.value)}
                      className="w-8 h-8 rounded border border-neutral-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={fill}
                      onChange={(e) => handleFillChange(e.target.value)}
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Stroke */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-semibold text-neutral-300">Stroke</span>
                    <span className="text-[11px] font-mono text-neutral-400">{strokeWidth}px</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={stroke || '#000000'}
                      onChange={(e) => handleStrokeChange(e.target.value)}
                      className="w-8 h-8 rounded border border-neutral-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="range"
                      min="0"
                      max="16"
                      value={strokeWidth}
                      onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
                      className="flex-1 accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Stroke Dash Style */}
                  <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-[11px]">
                    <button
                      onClick={() => handleStrokeDashChange('solid')}
                      className={`flex-1 py-0.5 rounded ${
                        strokeDash === 'solid' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Solid
                    </button>
                    <button
                      onClick={() => handleStrokeDashChange('dashed')}
                      className={`flex-1 py-0.5 rounded ${
                        strokeDash === 'dashed' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Dashed
                    </button>
                    <button
                      onClick={() => handleStrokeDashChange('dotted')}
                      className={`flex-1 py-0.5 rounded ${
                        strokeDash === 'dotted' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Dotted
                    </button>
                  </div>
                </div>

                {/* Opacity */}
                <div>
                  <div className="flex justify-between text-neutral-300 mb-1">
                    <span className="font-semibold">Opacity</span>
                    <span className="font-mono text-neutral-400">{Math.round(opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Transform & Geometry */}
                <div className="border-t border-neutral-800 pt-3">
                  <span className="font-semibold text-neutral-300 block mb-2">Transform</span>
                  <div className="grid grid-cols-2 gap-2 text-neutral-400">
                    <div className="flex items-center gap-1.5 bg-neutral-950 px-2 py-1.5 rounded border border-neutral-800">
                      <span className="font-mono text-[10px]">X</span>
                      <span className="font-mono text-neutral-200 tabular-nums">{left}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-neutral-950 px-2 py-1.5 rounded border border-neutral-800">
                      <span className="font-mono text-[10px]">Y</span>
                      <span className="font-mono text-neutral-200 tabular-nums">{top}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-neutral-950 px-2 py-1.5 rounded border border-neutral-800">
                      <span className="font-mono text-[10px]">W</span>
                      <span className="font-mono text-neutral-200 tabular-nums">{width}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-neutral-950 px-2 py-1.5 rounded border border-neutral-800">
                      <span className="font-mono text-[10px]">H</span>
                      <span className="font-mono text-neutral-200 tabular-nums">{height}</span>
                    </div>
                  </div>

                  {/* Rotation slider */}
                  <div className="mt-2.5">
                    <div className="flex justify-between text-neutral-300 mb-1">
                      <span>Angle</span>
                      <span className="font-mono text-neutral-400">{angle}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={angle}
                      onChange={(e) => handleAngleChange(Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Quick transform buttons */}
                  <div className="flex items-center gap-1 mt-2">
                    <button
                      onClick={() => handleFlip('x')}
                      title="Flip Horizontal"
                      className="flex-1 p-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 flex justify-center"
                    >
                      <FlipHorizontal className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleFlip('y')}
                      title="Flip Vertical"
                      className="flex-1 p-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 flex justify-center"
                    >
                      <FlipVertical className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleRotate90}
                      title="Rotate 90°"
                      className="flex-1 p-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 flex justify-center"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Alignment Tools */}
                <div className="border-t border-neutral-800 pt-3">
                  <span className="font-semibold text-neutral-300 block mb-2">Align to Tile</span>
                  <div className="grid grid-cols-6 gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                    <button
                      onClick={() => handleAlign('left')}
                      title="Align Left"
                      className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded flex justify-center"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleAlign('center-h')}
                      title="Center Horizontally"
                      className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded flex justify-center"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleAlign('right')}
                      title="Align Right"
                      className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded flex justify-center"
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleAlign('top')}
                      title="Align Top"
                      className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded flex justify-center"
                    >
                      <AlignVerticalJustifyStart className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleAlign('center-v')}
                      title="Center Vertically"
                      className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded flex justify-center"
                    >
                      <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleAlign('bottom')}
                      title="Align Bottom"
                      className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded flex justify-center"
                    >
                      <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Layer Arrangement */}
                <div className="border-t border-neutral-800 pt-3">
                  <span className="font-semibold text-neutral-300 block mb-2">Layer Hierarchy</span>
                  <div className="grid grid-cols-4 gap-1 text-[11px]">
                    <button
                      onClick={() => handleLayerOrder('front')}
                      className="p-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 text-center"
                    >
                      Front
                    </button>
                    <button
                      onClick={() => handleLayerOrder('forward')}
                      className="p-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 text-center"
                    >
                      Up
                    </button>
                    <button
                      onClick={() => handleLayerOrder('backward')}
                      className="p-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 text-center"
                    >
                      Down
                    </button>
                    <button
                      onClick={() => handleLayerOrder('back')}
                      className="p-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 text-center"
                    >
                      Back
                    </button>
                  </div>
                </div>

                {/* Duplicate & Delete Actions */}
                <div className="border-t border-neutral-800 pt-3 flex gap-2">
                  <button
                    onClick={handleDuplicate}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded font-medium transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded font-medium border border-rose-800/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-neutral-500">
                <p className="mb-2">No object selected</p>
                <p className="text-[11px] text-neutral-600">
                  Click any vector element on the tile canvas to inspect its fill, stroke, and geometry.
                </p>
              </div>
            )}
          </>
        )}

        {/* TAB 2: TILE SETTINGS & COLOR PALETTE HARMONIES */}
        {activeTab === 'tile' && (
          <div className="space-y-5">
            {/* Tile Size Dimensions */}
            <div>
              <span className="font-semibold text-neutral-300 block mb-2">Tile Dimensions</span>
              <div className="grid grid-cols-3 gap-1 mb-2">
                {[60, 80, 100, 120, 150, 200].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => updateConfig({ width: sz, height: sz })}
                    className={`py-1 rounded border text-xs font-mono transition-colors ${
                      config.width === sz && config.height === sz
                        ? 'bg-indigo-600 border-indigo-500 text-white font-semibold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {sz}×{sz}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 text-neutral-400">
                <div>
                  <label className="text-[10px] text-neutral-500 block mb-0.5">Width (px)</label>
                  <input
                    type="number"
                    min="30"
                    max="500"
                    value={config.width}
                    onChange={(e) => updateConfig({ width: parseInt(e.target.value) || 100 })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-neutral-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 block mb-0.5">Height (px)</label>
                  <input
                    type="number"
                    min="30"
                    max="500"
                    value={config.height}
                    onChange={(e) => updateConfig({ height: parseInt(e.target.value) || 100 })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-neutral-200 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Tile Background */}
            <div className="border-t border-neutral-800 pt-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-semibold text-neutral-300">Tile Background</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-neutral-400">
                  <input
                    type="checkbox"
                    checked={config.transparentBackground}
                    onChange={(e) => updateConfig({ transparentBackground: e.target.checked })}
                    className="accent-indigo-500 rounded"
                  />
                  <span>Transparent</span>
                </label>
              </div>

              {!config.transparentBackground && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.backgroundColor}
                    onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                    className="w-8 h-8 rounded border border-neutral-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.backgroundColor}
                    onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 font-mono text-xs"
                  />
                </div>
              )}
            </div>

            {/* Repeat Mode */}
            <div className="border-t border-neutral-800 pt-3">
              <span className="font-semibold text-neutral-300 block mb-2">Tiling Repeat Mode</span>
              <div className="space-y-1.5">
                <label className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700">
                  <span className="text-neutral-300">1:1 Regular Grid</span>
                  <input
                    type="radio"
                    name="repeatMode"
                    checked={config.repeatMode === 'grid'}
                    onChange={() => updateConfig({ repeatMode: 'grid' })}
                    className="accent-indigo-500"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700">
                  <span className="text-neutral-300">Brick by Row (Half-drop 50%)</span>
                  <input
                    type="radio"
                    name="repeatMode"
                    checked={config.repeatMode === 'brick-row'}
                    onChange={() => updateConfig({ repeatMode: 'brick-row' })}
                    className="accent-indigo-500"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700">
                  <span className="text-neutral-300">Brick by Column (Half-drop 50%)</span>
                  <input
                    type="radio"
                    name="repeatMode"
                    checked={config.repeatMode === 'brick-col'}
                    onChange={() => updateConfig({ repeatMode: 'brick-col' })}
                    className="accent-indigo-500"
                  />
                </label>
              </div>
            </div>

            {/* Seamless Edge Wrap Trigger */}
            <div className="border-t border-neutral-800 pt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-neutral-300">Seamless Edge Wrap</span>
                <span className="text-[10px] text-emerald-400 font-mono">Auto Mirror</span>
              </div>
              <p className="text-[11px] text-neutral-400 mb-2">
                Automatically detects objects crossing tile boundaries and duplicates them on opposing edges.
              </p>
              <button
                onClick={() => {
                  if (canvasRef.current) {
                    makeSeamlessWrap(canvasRef.current, config.width, config.height);
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg font-medium transition-colors"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>Wrap Overflows Across Seams</span>
              </button>
            </div>

            {/* Curated Color Harmonies */}
            <div className="border-t border-neutral-800 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-neutral-300">Color Palette Harmonies</span>
                <Palette className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <p className="text-[11px] text-neutral-400 mb-3">
                Click any palette to harmonize all vector shapes and background color in one click.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_PALETTES.map((palette) => (
                  <button
                    key={palette.id}
                    onClick={() => handleApplyPalette(palette)}
                    className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-indigo-500/60 transition-all text-left group"
                  >
                    <span className="text-[11px] font-medium text-neutral-300 group-hover:text-white block truncate mb-1.5">
                      {palette.name}
                    </span>
                    <div className="flex h-3 rounded overflow-hidden border border-neutral-700/60">
                      {palette.colors.map((c, idx) => (
                        <div key={idx} className="flex-1" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
