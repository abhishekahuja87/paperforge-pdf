import React, { useState, useEffect } from 'react';
import { FileDropZone } from '../common/FileDropZone';
import { FileText, AlertCircle, Scissors, Download, X, RefreshCw, Sparkles } from 'lucide-react';
import { getPdfPageCount, parsePageRanges, extractPages } from '../../lib/pdf/split';
import { generatePdfFilename } from '../../lib/pdf/naming';

export const SplitPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [rangeInput, setRangeInput] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  // Free the generated file when it is replaced or the page is left.
  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [downloadUrl]);
  const [downloadName, setDownloadName] = useState<string>('');

  // Dirty state tracking
  const [lastGeneratedKey, setLastGeneratedKey] = useState<string>('');

  const currentSettingsKey = JSON.stringify({
    fileName: file?.name,
    rangeInput: rangeInput.trim(),
  });

  const isOutOfSync = downloadUrl !== null && currentSettingsKey !== lastGeneratedKey;

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
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
      setRangeInput(`1-${Math.min(count, 3)}`);
      setStatus('idle');
    } catch {
      setErrorMessage('Failed to read PDF. The document might be password protected or corrupted.');
      setStatus('error');
    }
  };

  const handleSplit = async () => {
    if (!file) return;

    const indices = parsePageRanges(rangeInput, pageCount);
    if (indices.length === 0) {
      setErrorMessage(`Please enter a valid page range between 1 and ${pageCount}.`);
      setStatus('error');
      return;
    }

    try {
      setStatus('processing');
      setErrorMessage('');

      const buffer = await file.arrayBuffer();
      const outputBytes = await extractPages(buffer, indices);
      const blob = new Blob([outputBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const cleanRange = rangeInput.replace(/\s+/g, '').replace(/,/g, '_');
      const finalName = generatePdfFilename(file.name, 'split', `pages-${cleanRange}`);

      setDownloadUrl(url);
      setDownloadName(finalName);
      setLastGeneratedKey(currentSettingsKey);
      setStatus('done');
    } catch {
      setErrorMessage('An error occurred during extraction. Check if pages are within range.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setFile(null);
    setPageCount(0);
    setRangeInput('');
    setDownloadUrl(null);
    setDownloadName('');
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

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700" htmlFor="SplitPdf-137">
              Pages to Extract
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input id="SplitPdf-137"
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder={`e.g. 1-3, 5, 8-${pageCount}`}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
              />
              <button
                type="button"
                onClick={() => setRangeInput(`1-${pageCount}`)}
                className="px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition cursor-pointer"
              >
                All Pages
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Enter individual pages (e.g. <code className="text-slate-700 font-mono">1, 4, 7</code>) or ranges (e.g. <code className="text-slate-700 font-mono">2-5</code>). Max: {pageCount}.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isOutOfSync && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-center justify-between">
              <span>Page range changed since last split. Click below to refresh your file.</span>
              <span className="font-semibold text-amber-900 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Unsaved
              </span>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSplit}
              disabled={status === 'processing'}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {status === 'processing' ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : isOutOfSync ? (
                <RefreshCw className="w-4 h-4" />
              ) : (
                <Scissors className="w-4 h-4" />
              )}
              <span>
                {status === 'processing'
                  ? 'Extracting Pages...'
                  : isOutOfSync
                  ? 'Re-Extract with New Range'
                  : 'Extract & Download PDF'}
              </span>
            </button>

            {downloadUrl && (
              <a
                href={downloadUrl}
                download={downloadName || 'split_document.pdf'}
                className={`flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition ${
                  isOutOfSync
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-75'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>{isOutOfSync ? 'Download Outdated File' : 'Download Extracted PDF'}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};