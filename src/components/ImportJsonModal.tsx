import React, { useState } from 'react';
import { Upload, X, FileJson, AlertCircle } from 'lucide-react';

interface ImportJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportJson: (jsonContent: string) => Promise<void>;
}

export const ImportJsonModal: React.FC<ImportJsonModalProps> = ({
  isOpen,
  onClose,
  onImportJson,
}) => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      setError(null);
    };
    reader.onerror = () => {
      setError('无法读取所选 JSON 文件。');
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!jsonInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Validate JSON format
      JSON.parse(jsonInput);
      await onImportJson(jsonInput);
      setLoading(false);
      onClose();
    } catch (err) {
      setError(`JSON 解析失败: ${(err as Error).message}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-white">导入球衣配置 (Import JSON)</h2>
              <p className="text-xs text-neutral-400">
                导入包含球衣裁片结构、颜色与 PatternMeta 平铺参数的 Fabric JSON 数据
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
              点击选择或拖拽 .json 文件
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5">
              支持由 FabricEditor 导出的球衣配置或标准 Fabric Canvas JSON
            </span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-neutral-800" />
            <span className="text-[11px] text-neutral-500 font-medium uppercase">
              或者直接粘贴 JSON 字符串
            </span>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>

          {/* Raw JSON Textarea */}
          <div>
            <textarea
              rows={7}
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setError(null);
              }}
              placeholder='{ "objects": [...], "canvasWidth": 800, "patternMetaMap": { ... } }'
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs font-mono text-neutral-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/30 border border-rose-800/40 p-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !jsonInput.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg shadow-sm transition-all"
            >
              {loading ? '正在加载...' : '导入并渲染球衣'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
