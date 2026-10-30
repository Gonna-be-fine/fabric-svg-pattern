import React, { useEffect, useRef, useState } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { JerseyFabricEditor } from '../utils/JerseyFabricEditor';
import { DEFAULT_JERSEY_SVG_FRONT, DEFAULT_JERSEY_SVG_BACK } from '../configs/defaultJerseySvg';
import { ColorPrevList } from '../configs/jerseyParts';
import {
  Upload,
  Eye,
  Download,
  Code,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Info,
  FileJson,
} from 'lucide-react';

interface JerseyCanvasProps {
  editorRef: React.MutableRefObject<JerseyFabricEditor | null>;
  selectedPartId: string;
  setSelectedPartId: (id: string) => void;
  onOpenExportModal: () => void;
  onOpenTileStudio: () => void;
  onOpenImportJsonModal: () => void;
  onExportJson: () => void;
}

export const JerseyCanvas: React.FC<JerseyCanvasProps> = ({
  editorRef,
  selectedPartId,
  setSelectedPartId,
  onOpenExportModal,
  onOpenTileStudio,
  onOpenImportJsonModal,
  onExportJson,
}) => {
  const [currentTemplate, setCurrentTemplate] = useState<string>('65320745');
  const [detectedParts, setDetectedParts] = useState<string[]>([]);
  const [zoom, setZoom] = useState<number>(0.35);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize Fabric Canvas and load 65320745_jersey.svg by default
  useEffect(() => {
    if (!canvasElRef.current) return;

    const fabricCanvas = new Canvas(canvasElRef.current, {
      width: 2048,
      height: 2048,
      backgroundColor: 'transparent',
      selection: false,
      preserveObjectStacking: true,
    });

    const editor = new JerseyFabricEditor(fabricCanvas);
    editorRef.current = editor;

    // Load initial 65320745_jersey.svg
    fetch('/65320745_jersey.svg')
      .then((res) => {
        if (!res.ok) throw new Error('File not found');
        return res.text();
      })
      .then((svgText) => {
        editor.loadJerseySvg(svgText).then((parts) => {
          setDetectedParts(parts);
          const maxDim = Math.max(editor.viewBoxWidth, editor.viewBoxHeight);
          setZoom(Math.min(720 / maxDim, 1));
          setCurrentTemplate('65320745');
        });
      })
      .catch((err) => {
        console.warn('Could not auto-fetch 65320745_jersey.svg, fallback to default:', err);
        editor.loadJerseySvg(DEFAULT_JERSEY_SVG_FRONT).then((parts) => {
          setDetectedParts(parts);
          setZoom(0.85);
          setCurrentTemplate('front');
        });
      });

    // Handle clicks on canvas to select corresponding panel
    fabricCanvas.on('mouse:down', (e) => {
      const target = e.target as any;
      if (target && target.id) {
        setSelectedPartId(target.id);
      }
    });

    // Handle hover
    fabricCanvas.on('mouse:over', (e) => {
      const target = e.target as any;
      if (target && target.id) {
        setHoveredPart(target.id);
      }
    });

    fabricCanvas.on('mouse:out', () => {
      setHoveredPart(null);
    });

    return () => {
      fabricCanvas.dispose();
      editorRef.current = null;
    };
  }, []);

  // Switch to 65320745 SVG
  const handleLoad65320745Svg = () => {
    if (!editorRef.current) return;
    setCurrentTemplate('65320745');
    fetch('/65320745_jersey.svg')
      .then((res) => res.text())
      .then((svgText) => {
        editorRef.current?.loadJerseySvg(svgText).then((parts) => {
          setDetectedParts(parts);
          const maxDim = Math.max(editorRef.current?.viewBoxWidth || 2048, editorRef.current?.viewBoxHeight || 2048);
          setZoom(Math.min(720 / maxDim, 1));
        });
      });
  };

  // Switch to 65320745 JSON
  const handleLoad65320745Json = () => {
    if (!editorRef.current) return;
    setCurrentTemplate('65320745-json');
    fetch('/65320745.json')
      .then((res) => res.json())
      .then((jsonData) => {
        editorRef.current?.loadJSON(jsonData).then((res) => {
          setDetectedParts(res.detectedParts);
          const maxDim = Math.max(editorRef.current?.viewBoxWidth || 2048, editorRef.current?.viewBoxHeight || 2048);
          setZoom(Math.min(720 / maxDim, 1));
        });
      });
  };

  // Switch between Front and Back SVG
  const handleSwitchSide = (side: 'front' | 'back') => {
    setCurrentTemplate(side);
    if (!editorRef.current) return;

    const svgToLoad = side === 'front' ? DEFAULT_JERSEY_SVG_FRONT : DEFAULT_JERSEY_SVG_BACK;
    editorRef.current.loadJerseySvg(svgToLoad).then((parts) => {
      setDetectedParts(parts);
      setZoom(0.85);
    });
  };

  // Upload Custom Jersey SVG
  const handleUploadJerseySVG = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editorRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const svgText = event.target?.result as string;
      editorRef.current?.loadJerseySvg(svgText).then((parts) => {
        setDetectedParts(parts);
      });
    };
    reader.readAsText(file);
  };

  const activePartInfo = ColorPrevList.find((p) => p.id === (hoveredPart || selectedPartId));

  return (
    <div className="flex-1 flex flex-col bg-neutral-950 overflow-hidden relative select-none">
      {/* Top Floating Control Bar */}
      <div className="h-12 border-b border-neutral-800 bg-neutral-900/60 backdrop-blur-md px-4 flex items-center justify-between gap-4 shrink-0 z-10">
        {/* Template Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={handleLoad65320745Svg}
              className={`px-2.5 py-1 rounded-md transition-colors font-medium flex items-center gap-1.5 ${
                currentTemplate === '65320745'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="加载 65320745_jersey.svg 球衣矢量图"
            >
              <span>🔥 65320745 球衣</span>
            </button>
            <button
              onClick={handleLoad65320745Json}
              className={`px-2.5 py-1 rounded-md transition-colors font-medium flex items-center gap-1.5 ${
                currentTemplate === '65320745-json'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="加载 65320745.json 画布模型配置"
            >
              <span>📦 65320745 JSON</span>
            </button>
            <button
              onClick={() => handleSwitchSide('front')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                currentTemplate === 'front'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              前身
            </button>
            <button
              onClick={() => handleSwitchSide('back')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                currentTemplate === 'back'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              后身
            </button>
          </div>

          {/* Upload Custom SVG */}
          <label className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium cursor-pointer transition-colors border border-neutral-700/60">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>上传球衣 SVG</span>
            <input
              type="file"
              accept=".svg"
              className="hidden"
              onChange={handleUploadJerseySVG}
            />
          </label>

          {/* Import JSON */}
          <button
            onClick={onOpenImportJsonModal}
            className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors border border-neutral-700/60"
            title="导入包含裁片分块与 Pattern 参数的 Fabric JSON"
          >
            <FileJson className="w-3.5 h-3.5 text-amber-400" />
            <span>导入 JSON</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={onExportJson}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors border border-neutral-700/40"
            title="保存球衣当前分块与平铺配置到 JSON 文件"
          >
            <span>保存 JSON</span>
          </button>
        </div>

        {/* Hover / Selection Status Chip */}
        <div className="hidden md:flex items-center gap-2 text-xs text-neutral-400">
          <Info className="w-3.5 h-3.5 text-neutral-500" />
          <span>当前分块:</span>
          <span className="font-semibold text-neutral-200">
            {activePartInfo ? `${activePartInfo.name} (${activePartInfo.id})` : selectedPartId}
          </span>
        </div>

        {/* Export Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出保持 SVG Pattern</span>
          </button>
        </div>
      </div>

      {/* Main Jersey Canvas Viewport */}
      <div
        className="flex-1 relative overflow-auto flex items-center justify-center p-8"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)
          `,
          backgroundSize: '24px 24px',
        }}
      >
        {/* Floating Zoom Controls */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 bg-neutral-900/90 border border-neutral-800 backdrop-blur-md p-1 rounded-lg text-xs text-neutral-300 shadow-xl">
          <button
            onClick={() => setZoom((z) => Math.max(Number((z - 0.05).toFixed(2)), 0.15))}
            title="缩小"
            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-2 py-1 text-xs font-mono text-neutral-300 tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(Number((z + 0.05).toFixed(2)), 2.0))}
            title="放大"
            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-neutral-800 mx-0.5" />
          <button
            onClick={() => {
              const maxDim = Math.max(editorRef.current?.viewBoxWidth || 2048, editorRef.current?.viewBoxHeight || 2048);
              setZoom(Math.min(720 / maxDim, 1));
            }}
            title="自适应画布大小"
            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Floating Hint Pill */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-neutral-900/80 border border-neutral-800 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span>点击球衣任一裁片即可选中并施加 Pattern 平铺</span>
        </div>

        {/* Scaled Canvas Container */}
        <div
          className="relative transition-transform duration-75 origin-center shadow-2xl rounded-2xl"
          style={{
            transform: `scale(${zoom})`,
          }}
        >
          <canvas ref={canvasElRef} width={2048} height={2048} />
        </div>
      </div>
    </div>
  );
};
