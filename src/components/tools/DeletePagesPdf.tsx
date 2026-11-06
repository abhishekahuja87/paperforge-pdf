import React, { useState } from 'react';
import { FileDropZone } from '../common/FileDropZone';
import { 
  FileText, 
  Trash2, 
  Download, 
  X, 
  AlertCircle, 
  Sparkles,
  RefreshCw 
} from 'lucide-react';
import { getPdfPageCount, parsePageRanges } from '../../lib/pdf/split';
import { deletePdfPages } from '../../lib/pdf/deletePages';
import { generatePdfFilename } from '../../lib/pdf/naming';

export const DeletePagesPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [pagesInput, setPagesInput] = useState<string>('');

  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');

  const [lastGeneratedKey, setLastGeneratedKey] = useState<string>('');

  const currentSettingsKey = JSON.stringify({
    fileName: file?.name,
    pagesInput,
  });

  const isOutOfSync = downloadUrl !== null && currentSettingsKey !== lastGeneratedKey;

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      setErrorMessage('Please select a valid PDF file.');
      setStatus('error');
      return;
    }

    try {
      setStatus('loading');
      setErrorMessage('');
      const buffer = await selectedFile.arrayBuffer();
      const count = await getPdfPageCount(buffer);

      setFile(selectedFile);
      setPageCount(count);
      setPagesInput(count > 1 ? `${count}` : ''); // Suggest removing last page by default
      setStatus('idle');
    } catch {
      setErrorMessage('Failed to read PDF. The document might be password-protected or corrupted.');
      setStatus('error');
    }
  };

  const handleDelete = async () => {
    if (!file) return;

    const indices = parsePageRanges(pagesInput, pageCount);
    if (indices.length === 0) {
      setErrorMessage(`Please enter valid page numbers between 1 and ${pageCount}.`);
      setStatus('error');
      return;
    }

    if (indices.length >= pageCount) {
      setErrorMessage(`Cannot delete all ${pageCount} pages. A PDF must retain at least one page.`);
      setStatus('error');
    }

    try {
      setStatus('processing');
      setErrorMessage('');

      const buffer = await file.arrayBuffer();
      const outputBytes = await deletePdfPages({
        fileBuffer: buffer,
        pagesToRemove: pagesInput,
      });

      const blob = new Blob([outputBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const cleanDetails = `del-${indices.map((i) => i + 1).slice(0, 3).join('_')}${indices.length > 3 ? '-more' : ''}`;
      const finalName = generatePdfFilename(file.name, 'deleted-pages', cleanDetails);

      setDownloadUrl(url);
      setDownloadName(finalName);
      setLastGeneratedKey(currentSettingsKey);
      setStatus('done');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during page deletion.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setFile(null);
    setPageCount(0);
    setPagesInput('');
    setDownloadUrl(null);
    setStatus('idle');
    setErrorMessage('');
    setLastGeneratedKey('');
  };

  return (
    <div className="min-w-0 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6 space-y-4">
      {!file && (
        <FileDropZone
          accept=".pdf,application/pdf"
          disabled={status === 'loading'}
          readingPdf={status === 'loading'}
          onFiles={(files) => { void handleFile(files[0]); }}
        />
      )}
      {!file && errorMessage && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-relaxed text-rose-800">{errorMessage}</p>
      )}

      {file && (
        <div className="space-y-5">
          {/* File summary */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                <p className="text-[11px] text-slate-500">
                  Total pages: <strong className="text-slate-700">{pageCount}</strong> &bull; {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Deletion Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Page Numbers to Remove
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={pagesInput}
                onChange={(e) => setPagesInput(e.target.value)}
                placeholder={`e.g. 1, 3, 5-${pageCount}`}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPagesInput('1')}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  First Page
                </button>
                <button
                  type="button"
                  onClick={() => setPagesInput(`${pageCount}`)}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Last Page
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Enter individual pages (e.g. <code className="text-slate-700">1, 4</code>) or ranges (e.g. <code className="text-slate-700">2-4</code>). You must retain at least one page.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Out of Sync Warning */}
          {isOutOfSync && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-center justify-between">
              <span>Settings changed since last export. Re-generate to apply your new selection.</span>
              <span className="font-semibold text-amber-900 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Unsaved
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDelete}
              disabled={status === 'processing'}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {status === 'processing' ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : isOutOfSync ? (
                <RefreshCw className="w-4 h-4" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>
                {status === 'processing'
                  ? 'Removing Pages...'
                  : isOutOfSync
                  ? 'Re-Process with New Settings'
                  : 'Delete Pages & Download'}
              </span>
            </button>

            {downloadUrl && (
              <a
                href={downloadUrl}
                download={downloadName}
                className={`flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition ${
                  isOutOfSync
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-75'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>{isOutOfSync ? 'Download Outdated File' : 'Download Pruned PDF'}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};