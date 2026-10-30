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
  const [activeTab, setActiveTab] = useState<'svg' | 'info'>('svg');

  if (!isOpen || !editorRef.current) return null;

  const svgCode = editorRef.current.exportSVGWithPatterns();

  const handleCopy = () => {
    navigator.clipboard.writeText(svgCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = () => {
    downloadFile(svgCode, `jersey-with-patterns-${Date.now()}.svg`, 'image/svg+xml');
  };

  const handleDownloadPNG = () => {
    if (!editorRef.current) return;
    const dataUrl = editorRef.current.exportPNG(2.5); // High-res 2000px
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `jersey-sublimation-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                导出球衣矢量图 (保持 SVG Pattern 结构)
              </h2>
              <p className="text-xs text-neutral-400">
                导出的 SVG 严格保留 &lt;defs&gt;&lt;pattern&gt; 矢量平铺结构与 fill=&quot;url(#...)&quot; 链接，可直接导入 AI / 裁床印花
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

        {/* Quick Action Download Row */}
        <div className="p-6 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-950/40 border-b border-neutral-800/80">
          <button
            onClick={handleDownloadSVG}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all group"
          >
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <div className="text-left">
              <div>下载保持 SVG Pattern 矢量文件 (.svg)</div>
              <div className="text-[10px] text-indigo-200 font-normal">支持 Illustrator / CorelDraw / 升华印花</div>
            </div>
          </button>

          <button
            onClick={handleDownloadPNG}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-all border border-neutral-700/60 group"
          >
            <ImageIcon className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <div className="text-left">
              <div>下载高清 2000px 效果图 (.png)</div>
              <div className="text-[10px] text-neutral-400 font-normal">用于实物效果展示与客户快速确认</div>
            </div>
          </button>
        </div>

        {/* Code View Header */}
        <div className="px-6 py-2.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/20">
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
            <span>&lt;pattern patternUnits=&quot;userSpaceOnUse&quot; ...&gt;</span>
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

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-neutral-950 font-mono text-xs text-neutral-300 leading-relaxed">
          <pre className="whitespace-pre-wrap break-all">{svgCode}</pre>
        </div>
      </div>
    </div>
  );
};
