import React, { useState } from 'react';
import { FileDropZone } from '../common/FileDropZone';
import {
  FileText,
  Download,
  Copy,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { extractTextFromPdf } from '../../lib/pdf/extractText';
import type { ExtractedPageText } from '../../lib/pdf/extractText';

export const ExtractText: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<ExtractedPageText[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resetState = () => {
    setFile(null);
    setPages([]);
    setError(null);
    setCopied(false);
  };

  const handleFileChange = (selected: File) => {
    if (selected) {
      if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
        setError('Please select a valid PDF file.');
        return;
      }
      resetState();
      setFile(selected);
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);

      const buffer = await file.arrayBuffer();
      const extracted = await extractTextFromPdf(buffer);
      setPages(extracted);
    } catch {
      setError('Failed to extract text from PDF. Please verify the document is not corrupted or password-protected.');
    } finally {
      setIsProcessing(false);
    }
  };

  const hasAnyText = pages.some((p) => p.text.length > 0);
  const fullText = hasAnyText ? pages.map((p) => `--- Page ${p.pageNumber} ---\n\n${p.text}`).join('\n\n') : '';

  const copyToClipboard = () => {
    if (!fullText) return;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTextFile = () => {
    if (!fullText || !file) return;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.name.replace(/\.pdf$/i, '')}_text.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto min-w-0 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6">

      {/* Upload Drop Zone matching MergePdf identically */}
      {!file ? (
        <FileDropZone
          accept=".pdf,application/pdf"
          onFiles={(files) => { void handleFileChange(files[0]); }}
        />
      ) : (
        <div className="space-y-5">
          {/* Selected File Card */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center space-x-3 overflow-hidden">
              <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
              <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
              <span className="text-xs text-slate-400 shrink-0">
                ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
            </div>

            <button
              type="button"
              onClick={resetState}
              className="text-xs text-slate-500 hover:text-red-500 font-medium px-2 py-1 rounded cursor-pointer transition"
            >
              Change
            </button>
          </div>

          {/* Action Button before extraction */}
          {!pages.length && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleExtract}
                disabled={isProcessing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Extracting Text...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    <span>Extract Text</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Rendered Text Box and Actions */}
          {pages.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Extracted Text ({pages.length} Pages)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy All'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={downloadTextFile}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium rounded-lg transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .txt</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetState}
                    className="text-xs font-medium text-slate-500 hover:text-indigo-600 px-2 py-1 cursor-pointer"
                  >
                    Another File
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed select-all">
                {fullText || 'No extractable text found in this document (pages might be scanned images).'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ExtractText;