import React, { useState, useEffect } from 'react';
import { FileDropZone } from '../common/FileDropZone';
import { 
  FileText, 
  Hash, 
  Download, 
  X, 
  AlertCircle, 
  Sparkles, 
  RefreshCw 
} from 'lucide-react';
import { getPdfPageCount } from '../../lib/pdf/split';
import { 
  addPageNumbersToPdf, 
  type PageNumberPosition, 
  type PageNumberFormat, 
  type NumberingFont 
} from '../../lib/pdf/pageNumbers';
import { generatePdfFilename } from '../../lib/pdf/naming';

export const AddPageNumbers: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);

  // Configuration options
  const [position, setPosition] = useState<PageNumberPosition>('bottom-center');
  const [format, setFormat] = useState<PageNumberFormat>('page-x-of-y');
  const [fontChoice, setFontChoice] = useState<NumberingFont>('helvetica');
  const [fontSize, setFontSize] = useState<number>(10);
  const [margin, setMargin] = useState<number>(30);
  const [startNumber, setStartNumber] = useState<number>(1);
  const [skipFirstPage, setSkipFirstPage] = useState<boolean>(false);
  const [scope, setScope] = useState<'all' | 'custom'>('all');
  const [rangeString, setRangeString] = useState<string>('');

  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  // Free the generated file when it is replaced or the page is left.
  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [downloadUrl]);
  const [downloadName, setDownloadName] = useState<string>('');

  const [lastGeneratedKey, setLastGeneratedKey] = useState<string>('');

  const currentSettingsKey = JSON.stringify({
    fileName: file?.name,
    position,
    format,
    fontChoice,
    fontSize,
    margin,
    startNumber,
    skipFirstPage,
    scope,
    rangeString: rangeString.trim(),
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
      setRangeString(`1-${count}`);
      setDownloadUrl(null);
      setDownloadName('');
      setStatus('idle');
    } catch {
      setErrorMessage('Failed to read PDF. The document might be password-protected or corrupted.');
      setStatus('error');
    }
  };

  const handleApply = async () => {
    if (!file) return;
    if (scope === 'custom' && !rangeString.trim()) {
      setErrorMessage('Enter the pages to number, for example 2-5, 8.');
      setStatus('error');
      return;
    }

    try {
      setStatus('processing');
      setErrorMessage('');

      const buffer = await file.arrayBuffer();
      const stampedBytes = await addPageNumbersToPdf({
        fileBuffer: buffer,
        position,
        format,
        fontChoice,
        fontSize,
        margin,
        startNumber,
        skipFirstPage,
        scope,
        rangeString,
      });

      const blob = new Blob([stampedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const finalName = generatePdfFilename(file.name, 'numbered', `${position}_${format}`);

      setDownloadUrl(url);
      setDownloadName(finalName);
      setLastGeneratedKey(currentSettingsKey);
      setStatus('done');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while stamping page numbers.');
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

  const positions: { id: PageNumberPosition; label: string }[] = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-center', label: 'Top Center' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-center', label: 'Bottom Center' },
    { id: 'bottom-right', label: 'Bottom Right' },
  ];

  const formats: { id: PageNumberFormat; label: string; preview: string }[] = [
    { id: 'page-x-of-y', label: 'Page X of Y', preview: 'Page 1 of 5' },
    { id: 'slash', label: 'Slash Notation', preview: '1 / 5' },
    { id: 'number-only', label: 'Number Only', preview: '1' },
    { id: 'hyphen', label: 'Hyphenated', preview: '- 1 -' },
  ];

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

          {/* Position Selector (Visual Grid) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Placement Position</label>
            <div className="grid grid-cols-3 gap-2">
              {positions.map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => setPosition(pos.id)}
                  className={`p-2.5 rounded-lg border text-center transition cursor-pointer text-xs ${
                    position === pos.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Numbering Format</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {formats.map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setFormat(fmt.id)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    format === fmt.id
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-semibold">{fmt.label}</div>
                  <div className="text-[10px] text-indigo-600 font-mono mt-0.5">{fmt.preview}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Granular Adjustments */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700" htmlFor="AddPageNumbers-239">Typography Font</label>
                <select id="AddPageNumbers-239"
                  value={fontChoice}
                  onChange={(e) => setFontChoice(e.target.value as NumberingFont)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="helvetica">Standard Helvetica</option>
                  <option value="helvetica-bold">Helvetica Bold</option>
                  <option value="courier">Courier Monospace</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700" htmlFor="AddPageNumbers-254">
                  Font Size: <span className="text-indigo-600 font-bold">{fontSize}pt</span>
                </label>
                <input id="AddPageNumbers-254"
                  type="range"
                  min={8}
                  max={16}
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700" htmlFor="AddPageNumbers-268">
                  Page Margin: <span className="text-indigo-600 font-bold">{margin}pt</span>
                </label>
                <input id="AddPageNumbers-268"
                  type="range"
                  min={15}
                  max={60}
                  value={margin}
                  onChange={(e) => setMargin(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-2 border-t border-slate-200/60">
              <label className="block text-xs font-medium text-slate-700">
                Pages to number
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value === 'custom' ? 'custom' : 'all')}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">All pages</option>
                  <option value="custom">Selected pages only</option>
                </select>
              </label>
              {scope === 'custom' && (
                <label className="block text-xs font-medium text-slate-700">
                  Page range
                  <input
                    type="text"
                    value={rangeString}
                    onChange={(e) => setRangeString(e.target.value)}
                    placeholder="e.g. 2-5, 8"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-200/60">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipFirstPage}
                  onChange={(e) => setSkipFirstPage(e.target.checked)}
                  className="rounded text-indigo-600 w-3.5 h-3.5 accent-indigo-600"
                />
                <span className="text-xs text-slate-700 font-medium">Skip first page (Cover page)</span>
              </label>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-600">Start count from:</span>
                <input id="AddPageNumbers-318" aria-label="Start page numbering from"
                  type="number"
                  min={1}
                  max={9999}
                  value={startNumber}
                  onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-16 px-2 py-1 text-xs border border-slate-300 rounded-lg text-center bg-white"
                />
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
              <span>Settings changed since last export. Re-stamp to refresh your download file.</span>
              <span className="font-semibold text-amber-900 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Unsaved
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleApply}
              disabled={status === 'processing'}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {status === 'processing' ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : isOutOfSync ? (
                <RefreshCw className="w-4 h-4" />
              ) : (
                <Hash className="w-4 h-4" />
              )}
              <span>
                {status === 'processing'
                  ? 'Stamping Numbers...'
                  : isOutOfSync
                  ? 'Re-Stamp with New Settings'
                  : 'Add Page Numbers & Download'}
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
                <span>{isOutOfSync ? 'Download Outdated File' : 'Download Numbered PDF'}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};