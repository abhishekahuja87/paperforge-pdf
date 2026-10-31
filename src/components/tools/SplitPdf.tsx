import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, Scissors, Download, X } from 'lucide-react';
import { getPdfPageCount, parsePageRanges, extractPages } from '../../lib/pdf/split';

export const SplitPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [rangeInput, setRangeInput] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setRangeInput(`1-${Math.min(count, 3)}`);
      setStatus('idle');
    } catch {
      setErrorMessage('Failed to read PDF. The document might be password protected or corrupted.');
      setStatus('error');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
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

      setDownloadUrl(url);
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
    setStatus('idle');
    setErrorMessage('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      {!file && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/20"
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="application/pdf"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            Click to upload or drag & drop a PDF
          </h3>
          <p className="text-xs text-slate-500 mt-1">Processed locally on your device</p>
        </div>
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
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Pages to Extract
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder={`e.g. 1-3, 5, 8-${pageCount}`}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setRangeInput(`1-${pageCount}`)}
                className="px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
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

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            {status !== 'done' ? (
              <button
                onClick={handleSplit}
                disabled={status === 'processing'}
                className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
              >
                <Scissors className="w-4 h-4" />
                <span>{status === 'processing' ? 'Extracting Pages...' : 'Extract & Download PDF'}</span>
              </button>
            ) : (
              <div className="w-full space-y-3">
                <a
                  href={downloadUrl!}
                  download={`split_${file.name}`}
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Extracted PDF</span>
                </a>
                <button
                  onClick={handleReset}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
                >
                  Split another range or document
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};