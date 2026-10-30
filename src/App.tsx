/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, IText } from 'fabric';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { EditorCanvas } from './components/EditorCanvas';
import { PropertyInspector } from './components/PropertyInspector';
import { PresetModal } from './components/PresetModal';
import { ExportModal } from './components/ExportModal';
import { ImportSvgModal } from './components/ImportSvgModal';
import { JerseyCanvas } from './components/JerseyCanvas';
import { JerseyPatternTab } from './components/JerseyPatternTab';
import { JerseyExportModal } from './components/JerseyExportModal';
import { ImportJsonModal } from './components/ImportJsonModal';
import { JerseyFabricEditor, PatternOptions } from './utils/JerseyFabricEditor';
import { TileConfig, ActiveTool, PatternPreset } from './types';
import { PATTERN_PRESETS } from './utils/presets';
import { createFabricShape, loadPresetIntoCanvas, makeSeamlessWrap } from './utils/fabricHelpers';
import { ShapeDefinition } from './utils/shapeLibrary';
import { generateSingleTileSVG } from './utils/svgExport';
import { Shirt, Sparkles, Paintbrush, ArrowLeft, Check, Layers } from 'lucide-react';

export default function App() {
  // Main Studio Mode: 'jersey' (球衣定制) or 'tile-designer' (单元瓦片设计器)
  const [studioMode, setStudioMode] = useState<'jersey' | 'tile-designer'>('jersey');

  // Jersey Editor state
  const jerseyEditorRef = useRef<JerseyFabricEditor | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string>('COLOUR_BASE');
  const [currentJerseyPatterns, setCurrentJerseyPatterns] = useState<Map<string, PatternOptions>>(
    new Map()
  );
  const [activePartColors, setActivePartColors] = useState<Map<string, string>>(new Map());
  const [isJerseyExportOpen, setIsJerseyExportOpen] = useState<boolean>(false);

  // Tile Designer Canvas state (for editing SVG pattern tiles with Fabric)
  const tileCanvasRef = useRef<Canvas | null>(null);
  const [tileConfig, setTileConfig] = useState<TileConfig>({
    width: 120,
    height: 120,
    backgroundColor: '#1E293B',
    transparentBackground: false,
    repeatMode: 'grid',
    rowShift: 0.5,
    colShift: 0.5,
    spacingX: 0,
    spacingY: 0,
    showGridGuides: true,
    showCenterCrosshair: true,
    showGhostTiles: true,
    snapToGrid: false,
    gridSize: 10,
  });

  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [brushColor, setBrushColor] = useState<string>('#6366F1');
  const [brushWidth, setBrushWidth] = useState<number>(4);
  const [selectionVersion, setSelectionVersion] = useState<number>(0);
  const [hasSelection, setHasSelection] = useState<boolean>(false);

  // Modals
  const [isPresetsOpen, setIsPresetsOpen] = useState<boolean>(false);
  const [isTileExportOpen, setIsTileExportOpen] = useState<boolean>(false);
  const [isImportSvgOpen, setIsImportSvgOpen] = useState<boolean>(false);
  const [isImportJsonOpen, setIsImportJsonOpen] = useState<boolean>(false);

  // Import JSON handler
  const handleImportJson = async (jsonString: string) => {
    if (!jerseyEditorRef.current) return;
    const result = await jerseyEditorRef.current.loadJSON(jsonString);
    setCurrentJerseyPatterns(result.patterns);
    setActivePartColors(result.colors);
    if (result.detectedParts.length > 0) {
      setSelectedPartId(result.detectedParts[0]);
    }
  };

  // Export JSON handler
  const handleExportJson = () => {
    if (!jerseyEditorRef.current) return;
    const json = jerseyEditorRef.current.exportJSON();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jersey-pattern-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateTileConfig = useCallback((newConfig: Partial<TileConfig>) => {
    setTileConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  // Set Pattern on Jersey
  const handleSetJerseyPattern = useCallback((partId: string, options: PatternOptions) => {
    if (!jerseyEditorRef.current) return;

    jerseyEditorRef.current.setPattern(partId, options);

    setCurrentJerseyPatterns((prev) => {
      const next = new Map(prev);
      if (partId === 'ALL') {
        // Set for all known parts
        ['COLOUR_BASE', 'COLOUR_SECONDARY', 'COLOUR_PRIMARY', 'COLOUR_HEM', 'COLOUR_TERTIARY', 'COLOUR_BASE_REVERSE', 'COLOUR_SECONDARY_REVERSE', 'COLOUR_PRIMARY_REVERSE'].forEach((id) => {
          next.set(id, options);
        });
        next.set('ALL', options);
      } else {
        next.set(partId, options);
      }
      return next;
    });

    if (options.bgColor) {
      setActivePartColors((prev) => {
        const next = new Map(prev);
        if (partId === 'ALL') {
          next.set('COLOUR_BASE', options.bgColor!);
          next.set('COLOUR_SECONDARY', options.bgColor!);
          next.set('COLOUR_PRIMARY', options.bgColor!);
          next.set('COLOUR_HEM', options.bgColor!);
        } else {
          next.set(partId, options.bgColor!);
        }
        return next;
      });
    }
  }, []);

  // Remove Pattern from Jersey
  const handleRemoveJerseyPattern = useCallback((partId: string, resetColor?: string) => {
    if (!jerseyEditorRef.current) return;
    jerseyEditorRef.current.removePattern(partId, resetColor);

    setCurrentJerseyPatterns((prev) => {
      const next = new Map(prev);
      if (partId === 'ALL') {
        next.clear();
      } else {
        next.delete(partId);
      }
      return next;
    });
  }, []);

  // Apply current custom tile designed in Tile Designer to the selected jersey panel
  const handleApplyCustomTileToJersey = () => {
    if (!tileCanvasRef.current) return;

    const svgString = generateSingleTileSVG(tileCanvasRef.current, tileConfig);
    const dataUrl = tileCanvasRef.current.toDataURL({ format: 'png', multiplier: 2 });

    const newOptions: PatternOptions = {
      patternId: `custom_tile_${Date.now()}`,
      name: 'Custom Fabric Tile',
      category: 'Artwork',
      url: dataUrl,
      svgContent: svgString,
      scale: 1.0,
      angle: 0,
      opacity: 1.0,
      offsetX: 0,
      offsetY: 0,
      patternColor: null,
      bgColor: tileConfig.transparentBackground ? undefined : tileConfig.backgroundColor,
      tileWidth: tileConfig.width,
      tileHeight: tileConfig.height,
    };

    handleSetJerseyPattern(selectedPartId, newOptions);
    setStudioMode('jersey');
  };

  // Tile Designer Helpers
  const handleAddShape = (shapeDef: ShapeDefinition) => {
    if (!tileCanvasRef.current) return;
    const shape = createFabricShape(shapeDef, {
      left: tileConfig.width / 2,
      top: tileConfig.height / 2,
      fill: brushColor,
    });
    tileCanvasRef.current.add(shape);
    tileCanvasRef.current.setActiveObject(shape);
    tileCanvasRef.current.renderAll();
  };

  const handleAddText = () => {
    if (!tileCanvasRef.current) return;
    const text = new IText('SPORT', {
      left: tileConfig.width / 2,
      top: tileConfig.height / 2,
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 22,
      fill: brushColor,
      originX: 'center',
      originY: 'center',
    });
    tileCanvasRef.current.add(text);
    tileCanvasRef.current.setActiveObject(text);
    tileCanvasRef.current.renderAll();
  };

  const handleDuplicate = async () => {
    if (!tileCanvasRef.current) return;
    const active = tileCanvasRef.current.getActiveObject();
    if (!active) return;
    const cloned = await active.clone();
    cloned.set({
      left: (active.left || 0) + 12,
      top: (active.top || 0) + 12,
    });
    tileCanvasRef.current.add(cloned);
    tileCanvasRef.current.setActiveObject(cloned);
    tileCanvasRef.current.renderAll();
  };

  const handleClear = () => {
    if (!tileCanvasRef.current) return;
    tileCanvasRef.current.clear();
    tileCanvasRef.current.renderAll();
    setSelectionVersion((v) => v + 1);
    setHasSelection(false);
  };

  const handleSeamlessWrap = async () => {
    if (!tileCanvasRef.current) return;
    await makeSeamlessWrap(tileCanvasRef.current, tileConfig.width, tileConfig.height);
  };

  const handleSelectPreset = (preset: PatternPreset) => {
    if (!tileCanvasRef.current) return;
    loadPresetIntoCanvas(tileCanvasRef.current, preset, updateTileConfig);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Top Header Navigation */}
      <header className="h-14 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-4 flex items-center justify-between gap-8 select-none z-30 shrink-0">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-sm">
            <Shirt className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-base tracking-tight text-white whitespace-nowrap">
              Fabric SVG Pattern Studio
            </span>
            <span className="hidden sm:inline text-xs text-neutral-400">
              球衣分块矢量平铺定制
            </span>
          </div>
        </div>

        {/* Zone 2: Mode Tabs */}
        <nav className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-lg border border-neutral-800 text-xs font-medium text-neutral-300">
          <button
            onClick={() => setStudioMode('jersey')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              studioMode === 'jersey'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>球衣定制 (Jersey Studio)</span>
          </button>

          <button
            onClick={() => setStudioMode('tile-designer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              studioMode === 'tile-designer'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>图案工坊 (Tile Designer)</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {studioMode === 'jersey' ? (
            <button
              onClick={() => setIsJerseyExportOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0"
            >
              <span>导出保持 SVG Pattern</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStudioMode('jersey')}
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>返回球衣</span>
              </button>
              <button
                onClick={handleApplyCustomTileToJersey}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>应用到当前分块</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* MODE 1: JERSEY STUDIO (球衣分块平铺定制) */}
        {studioMode === 'jersey' && (
          <>
            {/* Center Jersey Canvas */}
            <JerseyCanvas
              editorRef={jerseyEditorRef}
              selectedPartId={selectedPartId}
              setSelectedPartId={setSelectedPartId}
              onOpenExportModal={() => setIsJerseyExportOpen(true)}
              onOpenTileStudio={() => setStudioMode('tile-designer')}
              onOpenImportJsonModal={() => setIsImportJsonOpen(true)}
              onExportJson={handleExportJson}
            />

            {/* Right PatternTab Component (Matching PatternTab.vue) */}
            <JerseyPatternTab
              selectedPartId={selectedPartId}
              setSelectedPartId={setSelectedPartId}
              onSetPattern={handleSetJerseyPattern}
              onRemovePattern={handleRemoveJerseyPattern}
              onOpenTileStudio={() => setStudioMode('tile-designer')}
              currentPatterns={currentJerseyPatterns}
              activePartColors={activePartColors}
            />
          </>
        )}

        {/* MODE 2: TILE DESIGNER (Fabric 矢量 Pattern 单元格设计器) */}
        {studioMode === 'tile-designer' && (
          <>
            {/* Left Vector Tools Bar */}
            <Toolbar
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              onAddShape={handleAddShape}
              onAddText={handleAddText}
              onImportSVG={() => setIsImportSvgOpen(true)}
              onSeamlessWrap={handleSeamlessWrap}
              onClear={handleClear}
              onDuplicate={handleDuplicate}
              brushColor={brushColor}
              setBrushColor={setBrushColor}
              brushWidth={brushWidth}
              setBrushWidth={setBrushWidth}
              showGrid={tileConfig.showGridGuides}
              setShowGrid={(v) => updateTileConfig({ showGridGuides: v })}
              showGhostTiles={tileConfig.showGhostTiles}
              setShowGhostTiles={(v) => updateTileConfig({ showGhostTiles: v })}
              showCenterCrosshair={tileConfig.showCenterCrosshair}
              setShowCenterCrosshair={(v) => updateTileConfig({ showCenterCrosshair: v })}
              hasSelection={hasSelection}
            />

            {/* Central Tile Canvas */}
            <EditorCanvas
              canvasRef={tileCanvasRef}
              config={tileConfig}
              onCanvasModified={() => setSelectionVersion((v) => v + 1)}
              onSelectionChange={() => {
                setSelectionVersion((v) => v + 1);
                setHasSelection(Boolean(tileCanvasRef.current?.getActiveObject()));
              }}
              isDrawingMode={activeTool === 'brush'}
              brushColor={brushColor}
              brushWidth={brushWidth}
            />

            {/* Right Contextual Property Inspector */}
            <PropertyInspector
              canvasRef={tileCanvasRef}
              config={tileConfig}
              updateConfig={updateTileConfig}
              selectionVersion={selectionVersion}
            />
          </>
        )}
      </div>

      {/* Modals */}
      <JerseyExportModal
        isOpen={isJerseyExportOpen}
        onClose={() => setIsJerseyExportOpen(false)}
        editorRef={jerseyEditorRef}
      />

      <PresetModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleSelectPreset}
      />

      <ExportModal
        isOpen={isTileExportOpen}
        onClose={() => setIsTileExportOpen(false)}
        canvasRef={tileCanvasRef}
        config={tileConfig}
      />

      <ImportSvgModal
        isOpen={isImportSvgOpen}
        onClose={() => setIsImportSvgOpen(false)}
        canvasRef={tileCanvasRef}
        config={tileConfig}
      />

      <ImportJsonModal
        isOpen={isImportJsonOpen}
        onClose={() => setIsImportJsonOpen(false)}
        onImportJson={handleImportJson}
      />
    </div>
  );
}
