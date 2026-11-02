import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Grid, 
  Download, 
  X, 
  AlertCircle, 
  Sparkles, 
  RefreshCw,
  Printer,
  Presentation,
  Check
} from 'lucide-react';
import { getPdfPageCount } from '../../lib/pdf/split';
import { createNUpPdf, type NUpLayout, type NUpPaperSize } from '../../lib/pdf/nUp';
import { generatePdfFilename } from '../../lib/pdf/naming';

export const NUpPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);

  // Settings
  const [layout, setLayout] = useState<NUpLayout>('2-up');
  const [paperSize, setPaperSize] = useState<NUpPaperSize>('a4-landscape');
  const [spacing, setSpacing] = useState<number>(15);
  const [drawBorders, setDrawBorders] = useState<boolean>(true);

  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');

  const [lastGeneratedKey, setLastGeneratedKey] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSettingsKey = JSON.stringify({
    fileName: file?.name,
    layout,
    paperSize,
    spacing,
    drawBorders,
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
      setDownloadUrl(null);
      setDownloadName('');
      setStatus('idle');
    } catch {
      setErrorMessage('Failed to read PDF. The document might be password-protected or corrupted.');
      setStatus('error');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleCompile = async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setErrorMessage('');

      const buffer = await file.arrayBuffer();
      const nUpBytes = await createNUpPdf({
        fileBuffer: buffer,
        layout,
        paperSize,
        spacing,
        drawBorders,
      });

      const blob = new Blob([nUpBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const finalName = generatePdfFilename(file.name, 'nup', `${layout}_${paperSize}`);

      setDownloadUrl(url);
      setDownloadName(finalName);
      setLastGeneratedKey(currentSettingsKey);
      setStatus('done');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during N-Up compilation.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setFile(null);
    setPageCount(0);
    setDownloadUrl(null);
    setDownloadName('');
    setStatus('idle');
    setErrorMessage('');
    setLastGeneratedKey('');
  };

  const calculatedOutputSheets = Math.ceil(pageCount / (layout === '2-up' ? 2 : 4));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
      
      {/* Real-World Use Case Header Card */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Grid className="w-4 h-4 text-indigo-600" />
          High-Yield Multi-Page Layouts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
              <Printer className="w-3.5 h-3.5 text-indigo-600" /> Paper & Toner Saver
            </span>
            <p className="text-[11px] text-slate-500 leading-snug">
              Print invoices, receipts, and technical manuals with 50% to 75% fewer paper sheets.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
              <Presentation className="w-3.5 h-3.5 text-emerald-600" /> Slide Decks & Handouts
            </span>
            <p className="text-[11px] text-slate-500 leading-snug">
              Convert 40-slide presentations into clean, multi-slide conference handouts and revision guides.
            </p>
          </div>
        </div>
      </div>

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
          <p className="text-xs text-slate-500 mt-1">Processed in your browser; the selected PDF is not uploaded to MyDailyUtils for processing.</p>
        </div>
      )}

      {file && (
        <div className="space-y-5">
          {/* File Card */}
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

          {/* Layout Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Pages Per Sheet</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLayout('2-up')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  layout === '2-up'
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>2 Pages Per Sheet (2-Up)</span>
                  {layout === '2-up' && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Side-by-side layout, ideal for reading and compact documents.</p>
              </button>

              <button
                type="button"
                onClick={() => setLayout('4-up')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  layout === '4-up'
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>4 Pages Per Sheet (4-Up)</span>
                  {layout === '4-up' && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">2&times;2 grid, ideal for slides, handouts, and maximum paper savings.</p>
              </button>
            </div>
          </div>

          {/* Paper Size & Options */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">Output Sheet Format</label>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as NUpPaperSize)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="a4-landscape">A4 Landscape (Recommended for 2-Up)</option>
                  <option value="a4-portrait">A4 Portrait (Recommended for 4-Up)</option>
                  <option value="letter-landscape">US Letter Landscape</option>
                  <option value="letter-portrait">US Letter Portrait</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                  <span>Page Spacing (Gutter)</span>
                  <span className="text-indigo-600 font-bold">{spacing}pt</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={spacing}
                  onChange={(e) => setSpacing(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={drawBorders}
                  onChange={(e) => setDrawBorders(e.target.checked)}
                  className="rounded text-indigo-600 w-3.5 h-3.5 accent-indigo-600"
                />
                <span className="text-xs text-slate-700 font-medium">Draw thin boundary line around each page</span>
              </label>

              <div className="text-xs text-slate-500">
                Output: <strong className="text-indigo-700">{calculatedOutputSheets} Sheet{calculatedOutputSheets > 1 ? 's' : ''}</strong> (from {pageCount} pages)
              </div>
            </div>
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
              <span>Settings changed since last compile. Re-generate to update your download file.</span>
              <span className="font-semibold text-amber-900 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Unsaved
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCompile}
              disabled={status === 'processing'}
              className={`flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer ${
                isOutOfSync
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {status === 'processing' ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : isOutOfSync ? (
                <RefreshCw className="w-4 h-4" />
              ) : (
                <Grid className="w-4 h-4" />
              )}
              <span>
                {status === 'processing'
                  ? 'Arranging Pages...'
                  : isOutOfSync
                  ? 'Re-Compile with New Layout'
                  : `Compile into ${layout.toUpperCase()} PDF`}
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
                <span>{isOutOfSync ? 'Download Outdated File' : 'Download N-Up PDF'}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};