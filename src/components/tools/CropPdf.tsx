import React, { useState, useEffect } from 'react';
import { FileDropZone } from '../common/FileDropZone';
import { 
  FileText, 
  Crop, 
  Download, 
  X, 
  AlertCircle, 
  Sparkles, 
  RefreshCw,
  Link,
  Unlink
} from 'lucide-react';
import { getPdfPageCount } from '../../lib/pdf/split';
import { cropPdf, convertToPoints, type CropUnit, type CropMargins } from '../../lib/pdf/crop';
import { generatePdfFilename } from '../../lib/pdf/naming';
import { useProtectedPdf } from '../common/ProtectedPdfGate';

export const CropPdf: React.FC = () => {
  const { prepare, dialog: passwordDialog } = useProtectedPdf();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Settings
  const [unit, setUnit] = useState<CropUnit>('pt');
  const [isLinked, setIsLinked] = useState<boolean>(true);
  const [margins, setMargins] = useState<CropMargins>({ top: 20, bottom: 20, left: 20, right: 20 });
  const [scope, setScope] = useState<'all' | 'odd' | 'even' | 'custom'>('all');
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
    unit,
    margins,
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

      // Estimate initial A4 size in points for UI preview
      setFile(selectedFile);
      setPageCount(count);
      setPageSize({ width: 595, height: 842 });
      setRangeString(`1-${count}`);
      setDownloadUrl(null);
      setDownloadName('');
      setStatus('idle');
    } catch {
      setErrorMessage('Failed to read PDF. The document might be password-protected or corrupted.');
      setStatus('error');
    }
  };

  const updateMargin = (side: keyof CropMargins, val: number) => {
    const safeVal = Math.max(0, val);
    if (isLinked) {
      setMargins({ top: safeVal, bottom: safeVal, left: safeVal, right: safeVal });
    } else {
      setMargins((prev) => ({ ...prev, [side]: safeVal }));
    }
  };

  const applyPreset = (t: number, b: number, l: number, r: number) => {
    setIsLinked(false);
    setMargins({ top: t, bottom: b, left: l, right: r });
  };

  const handleApply = async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setErrorMessage('');

      const buffer = await file.arrayBuffer();
      const croppedBytes = await cropPdf({
        fileBuffer: buffer,
        margins,
        unit,
        scope,
        rangeString,
      });

      const blob = new Blob([croppedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const detail = `${margins.top}t_${margins.bottom}b_${margins.left}l_${margins.right}r_${unit}`;
      const finalName = generatePdfFilename(file.name, 'cropped', detail);

      setDownloadUrl(url);
      setDownloadName(finalName);
      setLastGeneratedKey(currentSettingsKey);
      setStatus('done');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during cropping.');
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

  const topPt = convertToPoints(margins.top, unit);
  const bottomPt = convertToPoints(margins.bottom, unit);
  const leftPt = convertToPoints(margins.left, unit);
  const rightPt = convertToPoints(margins.right, unit);

  const previewW = Math.max(0, Math.round(pageSize.width - leftPt - rightPt));
  const previewH = Math.max(0, Math.round(pageSize.height - topPt - bottomPt));

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

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Quick Trim Presets</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyPreset(15, 15, 15, 15)}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition cursor-pointer text-xs"
              >
                <span className="font-semibold block text-slate-800">Bleed Clean</span>
                <span className="text-[10px] text-slate-400">15pt all sides</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(35, 35, 10, 10)}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition cursor-pointer text-xs"
              >
                <span className="font-semibold block text-slate-800">Header & Footer</span>
                <span className="text-[10px] text-slate-400">35pt top & bottom</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(10, 10, 30, 30)}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition cursor-pointer text-xs"
              >
                <span className="font-semibold block text-slate-800">Side Margins</span>
                <span className="text-[10px] text-slate-400">30pt left & right</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(0, 0, 0, 0)}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition cursor-pointer text-xs"
              >
                <span className="font-semibold block text-slate-800">Reset to 0</span>
                <span className="text-[10px] text-slate-400">No trimming</span>
              </button>
            </div>
          </div>

          {/* Margins Configuration Box */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Trim Margins</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsLinked(!isLinked)}
                  className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-[11px] ${
                    isLinked
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                  title={isLinked ? 'Margins linked together' : 'Margins unlinked'}
                >
                  {isLinked ? <Link className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
                  <span>{isLinked ? 'Linked' : 'Unlinked'}</span>
                </button>

                <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 text-[11px]">
                  {(['pt', 'mm', 'in'] as CropUnit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnit(u)}
                      className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                        unit === u ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Margin Inputs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['top', 'bottom', 'left', 'right'] as (keyof CropMargins)[]).map((side) => (
                <div key={side} className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider" htmlFor="CropPdf-262">
                    {side}
                  </label>
                  <div className="relative">
                    <input id="CropPdf-262"
                      type="number"
                      min={0}
                      step={unit === 'pt' ? 1 : 0.1}
                      value={margins[side]}
                      onChange={(e) => updateMargin(side, parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-400 font-mono">
                      {unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Scope Selection */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-200/60">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700" htmlFor="CropPdf-282">Apply Crop To</label>
                <select id="CropPdf-282"
                  value={scope}
                  onChange={(e) => setScope(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Pages</option>
                  <option value="odd">Odd Pages Only (1, 3, 5...)</option>
                  <option value="even">Even Pages Only (2, 4, 6...)</option>
                  <option value="custom">Custom Page Range</option>
                </select>
              </div>

              <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Calculated Crop:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {previewW} &times; {previewH} pt
                </span>
              </div>
            </div>

            {scope === 'custom' && (
              <div className="pt-1">
                <input aria-label="Custom page ranges to crop"
                  type="text"
                  value={rangeString}
                  onChange={(e) => setRangeString(e.target.value)}
                  placeholder={`e.g. 1-2, 4, 6-${pageCount}`}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">Separate pages with commas or hyphens.</p>
              </div>
            )}
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
              <span>Settings changed since last crop. Re-apply to refresh your download file.</span>
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
                <Crop className="w-4 h-4" />
              )}
              <span>
                {status === 'processing'
                  ? 'Cropping Document...'
                  : isOutOfSync
                  ? 'Re-Crop with New Margins'
                  : 'Crop PDF & Download'}
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
                <span>{isOutOfSync ? 'Download Outdated File' : 'Download Cropped PDF'}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};