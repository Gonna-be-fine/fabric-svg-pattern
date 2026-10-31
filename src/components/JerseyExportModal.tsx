import React, { useState } from 'react';
import { JerseyFabricEditor } from '../utils/JerseyFabricEditor';
import { downloadFile } from '../utils/svgExport';
import { Download, Copy, Check, X, FileCode, Image as ImageIcon, Sparkles } from 'lucide-react';

interface JerseyExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  editorRef: React.MutableRefObject<JerseyFabricEditor | null>;
}

export const JerseyExportModal: React.FC<JerseyExportModalProps> = ({
  isOpen,
  onClose,
  editorRef,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [exportMode, setExportMode] = useState<'preview' | 'production'>('production');

  if (!isOpen || !editorRef.current) return null;

  const svgCode =
    exportMode === 'production'
      ? editorRef.current.exportProductionSVG()
      : editorRef.current.exportSVGWithPatterns();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(svgCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = async () => {
    const fileName =
      exportMode === 'production'
        ? `jersey-production-pattern-${Date.now()}.svg`
        : `jersey-with-patterns-${Date.now()}.svg`;
    downloadFile(svgCode, fileName, 'image/svg+xml');
  };

  const handleDownloadPNG = () => {
    if (!editorRef.current) return;
    const dataUrl = editorRef.current.exportPNG(2.5);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `jersey-sublimation-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                {exportMode === 'production'
                  ? '导出生产级 SVG Pattern'
                  : '导出球衣矢量图 (保持 SVG Pattern 结构)'}
              </h2>
              <p className="text-xs text-neutral-400">
                {exportMode === 'production'
                  ? '优先保留真实 SVG pattern 内容，适合工厂 / 印花 / AI 继续加工。'
                  : '导出的 SVG 严格保留 <defs><pattern> 矢量平铺结构与 fill="url(#...)" 链接，可直接导入 AI / 裁床印花。'}
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

        <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-950/40">
          <div className="inline-flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-1">
            <button
              onClick={() => setExportMode('production')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                exportMode === 'production'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Production SVG
            </button>
            <button
              onClick={() => setExportMode('preview')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                exportMode === 'preview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Preview SVG
            </button>
          </div>
        </div>

        <div className="p-6 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-950/40 border-b border-neutral-800/80">
          <button
            onClick={handleDownloadSVG}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all group"
          >
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <div className="text-left">
              <div>
                {exportMode === 'production'
                  ? '下载生产级 SVG (.svg)'
                  : '下载保持 SVG Pattern 矢量文件 (.svg)'}
              </div>
              <div className="text-[10px] text-indigo-200 font-normal">
                {exportMode === 'production'
                  ? '适合工厂 / 印花 / AI 继续处理'
                  : '支持 Illustrator / CorelDraw / 升华印花'}
              </div>
            </div>
          </button>

          <button
            onClick={handleDownloadPNG}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-all border border-neutral-700/80"
          >
            <ImageIcon className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <div className="text-left">
              <div>下载高清 2000px 效果图 (.png)</div>
              <div className="text-[10px] text-neutral-400 font-normal">用于实物效果展示与客户快速确认</div>
            </div>
          </button>
        </div>

        <div className="px-6 py-2.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/20">
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
            <span>
              {exportMode === 'production' ? '<pattern ...> / production SVG' : '<pattern patternUnits="userSpaceOnUse" ...>'}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">已复制 SVG 代码</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>复制代码</span>
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-neutral-950 font-mono text-xs text-neutral-300 leading-relaxed">
          <pre className="whitespace-pre-wrap break-all">{svgCode}</pre>
        </div>
      </div>
    </div>
  );
};
