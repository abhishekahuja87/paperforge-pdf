import React, { useState, useEffect } from 'react';
import { PdfFileBar } from '../common/PdfFileBar';
import { SaveResult, StartOverButton } from '../common/SaveResult';
import { FileDropZone } from '../common/FileDropZone';
import { 
  
  Grid, 
  
  AlertCircle, 
  Sparkles, 
  RefreshCw,
  
  
  Check
} from 'lucide-react';
import { getPdfPageCount } from '../../lib/pdf/split';
import { createNUpPdf, type NUpLayout, type NUpPaperSize } from '../../lib/pdf/nUp';
import { generatePdfFilename } from '../../lib/pdf/naming';
import { useProtectedPdf } from '../common/ProtectedPdfGate';

export const NUpPdf: React.FC = () => {
  const { prepare, dialog: passwordDialog } = useProtectedPdf();
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
  // Free the generated file when it is replaced or the page is left.
  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [downloadUrl]);
  const [downloadName, setDownloadName] = useState<string>('');

  const [lastGeneratedKey, setLastGeneratedKey] = useState<string>('');

  const currentSettingsKey = JSON.stringify({
    fileName: file?.name,
    layout,
    paperSize,
    spacing,
    drawBorders,
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
      setDownloadUrl(null);
      setDownloadName('');
      setStatus('idle');
    } catch {
      setErrorMessage('Failed to read PDF. The document might be password-protected or corrupted.');
      setStatus('error');
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
    <div className="min-w-0 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6 space-y-4">
      {passwordDialog}
      

      {!file && (
        <FileDropZone
          accept=".pdf,application/pdf"
          disabled={status === 'loading'}
          readingPdf={status === 'loading'}
          onFiles={(files) => { void prepare(files[0]).then((prepared) => { if (prepared) void handleFile(prepared); }); }}
        />
      )}
      {!file && errorMessage && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-relaxed text-rose-800">{errorMessage}</p>
      )}



      {file && (
        <div className="space-y-5">
          {/* File Card */}
          <PdfFileBar name={file.name} size={file.size} pages={pageCount} onChange={handleReset} />

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
                <label className="block text-[11px] font-semibold text-slate-700" htmlFor="NUpPdf-231">Output Sheet Format</label>
                <select id="NUpPdf-231"
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
                <input aria-label="Page spacing in points"
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


          {/* Action Buttons */}
          {downloadUrl && <SaveResult href={downloadUrl} name={downloadName} label="Your N-up PDF is ready" saveLabel="Save PDF" outdated={isOutOfSync} />}
          <div className="pt-2 flex flex-col gap-3">
            {(!downloadUrl || isOutOfSync) && (
              <button
                onClick={handleCompile}
                disabled={status === 'processing'}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none bg-orange-700 hover:bg-orange-800 text-white"
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
            )}
            {downloadUrl && !isOutOfSync && <StartOverButton onClick={handleReset}>Arrange another PDF</StartOverButton>}

          </div>
        </div>
      )}
    </div>
  );
};