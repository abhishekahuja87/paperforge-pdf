import React, { useState } from 'react';
import { Upload, FileText, Trash2, ArrowUp, ArrowDown, Download, Loader2 } from 'lucide-react';
import { mergePdfFiles } from '../../lib/pdf/merge';
import { generatePdfFilename } from '../../lib/pdf/naming';

export const MergePdf: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).filter(
        (f) => f.type === 'application/pdf' || f.name.endsWith('.pdf')
      );
      setFiles((prev) => [...prev, ...selected]);
      setDownloadUrl(null);
      setDownloadName('');
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setDownloadUrl(null);
    setDownloadName('');
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;

    const updated = [...files];
    const [movedFile] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedFile);
    setFiles(updated);
    setDownloadUrl(null);
    setDownloadName('');
  };

  const handleMerge = async () => {
    if (files.length < 2) return;

    try {
      setIsProcessing(true);
      setError(null);

      const mergedBlob = await mergePdfFiles(files);
      const url = URL.createObjectURL(mergedBlob);
      const finalName = generatePdfFilename('documents', 'merged', `${files.length}files`);

      setDownloadUrl(url);
      setDownloadName(finalName);
    } catch {
      setError('Failed to merge PDF files. Please ensure none are password-protected or corrupted.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Merge PDF Files</h2>
        <p className="text-slate-500 text-sm mt-1">
          Combine multiple PDFs in your chosen order. 100% processed directly in your browser.
        </p>
      </div>

      {/* Upload Drop Zone */}
      <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/40 hover:bg-indigo-50/70 transition cursor-pointer">
        <Upload className="w-10 h-10 text-indigo-500 mb-2" />
        <span className="font-semibold text-slate-700">Click to upload or drag & drop</span>
        <span className="text-xs text-slate-400 mt-1">Select multiple PDF files</span>
        <input
          type="file"
          multiple
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Files to merge ({files.length})
          </div>
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                <span className="text-xs text-slate-400 shrink-0">
                  ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                <button
                  type="button"
                  onClick={() => moveFile(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 cursor-pointer"
                  title="Move up"
                >
                  <ArrowUp className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  type="button"
                  onClick={() => moveFile(idx, 'down')}
                  disabled={idx === files.length - 1}
                  className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 cursor-pointer"
                  title="Move down"
                >
                  <ArrowDown className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="p-1 hover:bg-red-50 rounded text-red-500 cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
        <button
          type="button"
          onClick={handleMerge}
          disabled={files.length < 2 || isProcessing}
          className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Merging...</span>
            </>
          ) : (
            <span>Merge PDFs</span>
          )}
        </button>

        {downloadUrl && (
          <a
            href={downloadUrl}
            download={downloadName || 'merged_documents.pdf'}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Download className="w-5 h-5" />
            <span>Download Merged PDF</span>
          </a>
        )}
      </div>
    </div>
  );
};