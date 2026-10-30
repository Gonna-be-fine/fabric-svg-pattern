import React, { useEffect, useRef, useState } from 'react';
import { Canvas, PencilBrush } from 'fabric';
import { TileConfig } from '../types';
import { ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react';

interface EditorCanvasProps {
  canvasRef: React.MutableRefObject<Canvas | null>;
  config: TileConfig;
  onCanvasModified: () => void;
  onSelectionChange: () => void;
  isDrawingMode: boolean;
  brushColor: string;
  brushWidth: number;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  canvasRef,
  config,
  onCanvasModified,
  onSelectionChange,
  isDrawingMode,
  brushColor,
  brushWidth,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState<number>(2.5); // Default 2.5x magnification so a 120px tile is 300px on screen
  const [ghostTileDataUrl, setGhostTileDataUrl] = useState<string>('');

  // Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasElRef.current) return;

    const fabricCanvas = new Canvas(canvasElRef.current, {
      width: config.width,
      height: config.height,
      backgroundColor: config.transparentBackground ? '' : config.backgroundColor,
      preserveObjectStacking: true,
      selection: true,
    });

    canvasRef.current = fabricCanvas;

    // Events
    const handleModified = () => {
      onCanvasModified();
      updateGhostPreview(fabricCanvas);
    };

    fabricCanvas.on('object:added', handleModified);
    fabricCanvas.on('object:modified', handleModified);
    fabricCanvas.on('object:removed', handleModified);
    fabricCanvas.on('selection:created', onSelectionChange);
    fabricCanvas.on('selection:updated', onSelectionChange);
    fabricCanvas.on('selection:cleared', onSelectionChange);

    updateGhostPreview(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
      canvasRef.current = null;
    };
  }, []);

  // Update canvas dimensions & background when config changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setDimensions({
      width: config.width,
      height: config.height,
    });

    if (config.transparentBackground) {
      canvas.backgroundColor = '';
    } else {
      canvas.backgroundColor = config.backgroundColor;
    }

    canvas.renderAll();
    updateGhostPreview(canvas);
  }, [config.width, config.height, config.backgroundColor, config.transparentBackground]);

  // Update drawing mode & brush parameters
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = isDrawingMode;
    if (isDrawingMode) {
      if (!canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
      }
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushWidth;
    }
  }, [isDrawingMode, brushColor, brushWidth]);

  const updateGhostPreview = (canvas: Canvas) => {
    try {
      const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 1 });
      setGhostTileDataUrl(dataUrl);
    } catch {
      // Ignore if empty
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.5, 6));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.5, 1));
  const handleResetZoom = () => setZoom(2.5);

  const tileW = config.width * zoom;
  const tileH = config.height * zoom;

  // Calculate 3x3 ghost positions
  const ghostPositions = [
    { x: -1, y: -1, name: 'TL' },
    { x: 0, y: -1, name: 'T' },
    { x: 1, y: -1, name: 'TR' },
    { x: -1, y: 0, name: 'L' },
    { x: 1, y: 0, name: 'R' },
    { x: -1, y: 1, name: 'BL' },
    { x: 0, y: 1, name: 'B' },
    { x: 1, y: 1, name: 'BR' },
  ];

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-auto bg-neutral-950 flex items-center justify-center select-none"
      style={{
        backgroundImage: `
          radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)
        `,
        backgroundSize: '24px 24px',
      }}
    >
      {/* Floating Canvas Meta Pill */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs text-neutral-300">
        <span className="font-semibold text-neutral-200">Unit Cell</span>
        <span className="text-neutral-500">·</span>
        <span className="font-mono tabular-nums text-neutral-400">
          {config.width} × {config.height} px
        </span>
        <span className="text-neutral-500">·</span>
        <span className="text-indigo-400 font-mono font-medium">{Math.round(zoom * 100)}%</span>
      </div>

      {/* Floating Zoom & Pan Controls */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 bg-neutral-900/90 border border-neutral-800 backdrop-blur-md p-1 rounded-lg text-xs text-neutral-300 shadow-xl">
        <button
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          title="Reset Zoom"
          className="px-2 py-1 text-xs font-mono text-neutral-300 hover:text-white rounded hover:bg-neutral-800 transition-colors tabular-nums"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={handleZoomIn}
          title="Zoom In (+)"
          className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-neutral-800 mx-0.5" />
        <button
          onClick={() => setZoom(1)}
          title="Actual Size 1:1"
          className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Interactive Tile Canvas Container with Scaled Presentation */}
      <div
        className="relative flex items-center justify-center my-12"
        style={{
          width: tileW,
          height: tileH,
        }}
      >
        {/* 3x3 Ghost Surrounding Tiles */}
        {config.showGhostTiles && ghostTileDataUrl && (
          <div className="absolute inset-0 pointer-events-none">
            {ghostPositions.map((pos) => {
              // Row/Col shift calculation for ghost tiles if in brick mode
              let shiftX = pos.x * tileW;
              let shiftY = pos.y * tileH;

              if (config.repeatMode === 'brick-row' && Math.abs(pos.y) % 2 === 1) {
                shiftX += config.width * config.rowShift * zoom;
              }
              if (config.repeatMode === 'brick-col' && Math.abs(pos.x) % 2 === 1) {
                shiftY += config.height * config.colShift * zoom;
              }

              return (
                <div
                  key={pos.name}
                  className="absolute border border-dashed border-neutral-700/60 overflow-hidden"
                  style={{
                    width: tileW,
                    height: tileH,
                    left: 0,
                    top: 0,
                    transform: `translate(${shiftX}px, ${shiftY}px)`,
                    opacity: 0.35,
                    backgroundColor: config.transparentBackground ? 'transparent' : config.backgroundColor,
                  }}
                >
                  <img
                    src={ghostTileDataUrl}
                    alt="Ghost neighbor tile"
                    className="w-full h-full object-contain pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-1 left-1 text-[9px] font-mono text-neutral-500 bg-neutral-900/80 px-1 rounded">
                    {pos.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Central Active Tile Card */}
        <div
          className="relative shadow-2xl rounded-sm ring-1 ring-indigo-500/50"
          style={{
            width: tileW,
            height: tileH,
            backgroundColor: config.transparentBackground ? 'transparent' : config.backgroundColor,
          }}
        >
          {/* Transparency checkerboard background if transparent */}
          {config.transparentBackground && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #262626 25%, transparent 25%),
                  linear-gradient(-45deg, #262626 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #262626 75%),
                  linear-gradient(-45deg, transparent 75%, #262626 75%)
                `,
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
              }}
            />
          )}

          {/* Grid overlay */}
          {config.showGridGuides && (
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #6366f1 1px, transparent 1px),
                  linear-gradient(to bottom, #6366f1 1px, transparent 1px)
                `,
                backgroundSize: `${config.gridSize * zoom}px ${config.gridSize * zoom}px`,
              }}
            />
          )}

          {/* Center Crosshair Guides */}
          {config.showCenterCrosshair && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-indigo-400/40 transform -translate-y-1/2" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-indigo-400/40 transform -translate-x-1/2" />
            </div>
          )}

          {/* Fabric Canvas Dom Wrapper with Zoom transform */}
          <div
            className="origin-top-left"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            <canvas ref={canvasElRef} />
          </div>

          {/* Seam Boundary Indicator Frame */}
          <div className="absolute inset-0 pointer-events-none border-2 border-indigo-500/80 rounded-sm" />
        </div>
      </div>
    </div>
  );
};
