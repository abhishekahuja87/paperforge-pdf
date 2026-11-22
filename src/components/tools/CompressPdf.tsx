import React, { useState, useEffect } from 'react';
import { PdfFileBar } from '../common/PdfFileBar';
import { SaveResult, StartOverButton } from '../common/SaveResult';
import { UploadNote } from '../common/UploadNote';
import { FileDropZone } from '../common/FileDropZone';
import { 
  
  Minimize2, 
  
  AlertCircle, 
  Sparkles, 
  RefreshCw,
  Zap,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { compressPdf, type CompressionLevel, type CompressPdfResult } from '../../lib/pdf/compress';
import { compressToTarget, type TargetCompressResult } from '../../lib/pdf/compressToTarget';
import { getPdfPageCount } from '../../lib/pdf/split';
import { generatePdfFilename } from '../../lib/pdf/naming';
import { useProtectedPdf } from '../common/ProtectedPdfGate';

export const CompressPdf: React.FC = () => {
  const { prepare, dialog: passwordDialog } = useProtectedPdf();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [level, setLevel] = useState<CompressionLevel>('basic');
  // "clean" keeps text and only tidies the file; "target" shrinks the pages to fit a size you give.
  const [mode, setMode] = useState<'clean' | 'target'>('clean');
  const [targetValue, setTargetValue] = useState('200');
  const [targetUnit, setTargetUnit] = useState<'KB' | 'MB'>('KB');
  const [progress, setProgress] = useState('');
  const [targetResult, setTargetResult] = useState<TargetCompressResult | null>(null);

  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  // Free the generated file when it is replaced or the page is left.
  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [downloadUrl]);
  const [downloadName, setDownloadName] = useState<string>('');
  const [result, setResult] = useState<CompressPdfResult | null>(null);

  const [lastGeneratedKey, setLastGeneratedKey] = useState<string>('');

  const currentSettingsKey = JSON.stringify({
    fileName: file?.name,
    fileSize: file?.size,
    level,
    mode,
    targetValue,
    targetUnit,
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
      setResult(null);
      setDownloadUrl(null);
      setDownloadName('');
      setStatus('idle');
    } catch {
      setErrorMessage('Failed to read PDF. The document might be password-protected or corrupted.');
      setStatus('error');
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setErrorMessage('');

      const buffer = await file.arrayBuffer();
      setTargetResult(null);
      if (mode === 'target') {
        const amount = Number(targetValue);
        if (!(amount > 0)) throw new Error('Enter the size you need, for example 200 KB.');
        const targetBytes = Math.floor(amount * (targetUnit === 'MB' ? 1024 * 1024 : 1024));
        const reached = await compressToTarget({ fileBuffer: buffer, targetBytes, onProgress: setProgress });
        const blob = new Blob([reached.pdfBytes.slice().buffer as ArrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const saved = Math.max(0, reached.originalSize - reached.compressedSize);
        setDownloadUrl(url);
        setDownloadName(generatePdfFilename(file.name, 'compressed', `${targetValue}${targetUnit.toLowerCase()}`));
        setTargetResult(reached);
        setResult({
          pdfBytes: reached.pdfBytes,
          originalSize: reached.originalSize,
          compressedSize: reached.compressedSize,
          savedBytes: saved,
          reductionPercentage: reached.originalSize > 0 ? Math.round((saved / reached.originalSize) * 100) : 0,
        });
        setLastGeneratedKey(currentSettingsKey);
        setProgress('');
        setStatus('done');
        return;
      }
      const compressResult = await compressPdf({
        fileBuffer: buffer,
        level,
      });

      const blob = new Blob([compressResult.pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const finalName = generatePdfFilename(file.name, 'compressed', `${level}_${compressResult.reductionPercentage}pct`);

      setDownloadUrl(url);
      setDownloadName(finalName);
      setResult(compressResult);
      setLastGeneratedKey(currentSettingsKey);
      setStatus('done');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during compression.');
      setProgress('');
      setStatus('error');
    }
  };

  const handleReset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setFile(null);
    setPageCount(0);
    setResult(null);
    setTargetResult(null);
    setDownloadUrl(null);
    setDownloadName('');
    setStatus('idle');
    setErrorMessage('');
    setLastGeneratedKey('');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

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
      {!file && (
        <UploadNote>
          <p className="font-semibold text-stone-600">Typical size limits</p>
          <table className="mt-1 w-full text-left">
            <tbody>
              <tr><th scope="row" className="py-1 pr-3 font-medium">Email attachment</th><td className="py-1">about 20–25 MB in total</td></tr>
              <tr><th scope="row" className="py-1 pr-3 font-medium">Government and job portals</th><td className="py-1">about 100 KB to 2 MB per file</td></tr>
            </tbody>
          </table>
          <p className="mt-1">Limits differ by use case, so follow the one that applies to you.</p>
        </UploadNote>
      )}
      {!file && errorMessage && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-relaxed text-rose-800">{errorMessage}</p>
      )}

      {file && (
        <div className="space-y-5">
          {/* File Card */}
          <PdfFileBar name={file.name} size={file.size} pages={pageCount} onChange={handleReset} />

          <div role="group" aria-label="Compression goal" className="grid grid-cols-2 gap-2">
            {([['clean', 'Clean up only', 'Keeps text selectable'], ['target', 'Reduce to a size', 'Fit a limit like 200 KB']] as const).map(([value, title, hint]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
                className={`rounded-xl border p-3 text-left text-xs transition ${mode === value ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <span className="block font-semibold text-slate-800">{title}</span>
                <span className="block text-[11px] text-slate-500">{hint}</span>
              </button>
            ))}
          </div>

          {mode === 'target' && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-end gap-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Largest size allowed
                  <input
                    type="number"
                    inputMode="decimal"
                    min="1"
                    value={targetValue}
                    onChange={(event) => setTargetValue(event.target.value)}
                    className="mt-1 block w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
                <select
                  aria-label="Unit"
                  value={targetUnit}
                  onChange={(event) => setTargetUnit(event.target.value as 'KB' | 'MB')}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="KB">KB</option>
                  <option value="MB">MB</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Common size limits">
                {([['100', 'KB'], ['200', 'KB'], ['500', 'KB'], ['1', 'MB'], ['2', 'MB']] as const).map(([value, unit]) => (
                  <button
                    key={`${value}${unit}`}
                    type="button"
                    onClick={() => { setTargetValue(value); setTargetUnit(unit); }}
                    className={`min-h-9 rounded-lg border px-3 text-xs font-semibold ${targetValue === value && targetUnit === unit ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    {value} {unit}
                  </button>
                ))}
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                The tool first tries a lossless clean-up. If the file is still too big, it turns each page into a picture and picks the sharpest quality that fits. Pictures cannot be selected or searched as text, so keep the original if you need the text.
              </p>
            </div>
          )}

          {/* Compression Level Selector */}
          {mode === 'clean' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Select Optimization Level</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLevel('basic')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  level === 'basic'
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Basic Optimization (Lossless)
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Compresses object streams and purges dead dictionary pointers without touching metadata.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setLevel('strong')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  level === 'strong'
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Zap className="w-4 h-4 text-amber-600" />
                  Strong Optimization (Recommended)
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Purges bulky XMP metadata, creator footprints, embedded thumbnail caches, and compacts cross-reference tables.
                </p>
              </button>
            </div>
          </div>
          )}

          {targetResult && (
            <p role="status" className={`rounded-xl border px-3 py-2.5 text-xs leading-relaxed ${targetResult.met ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
              {targetResult.met
                ? `Under your limit: ${formatBytes(targetResult.compressedSize)} (limit ${formatBytes(targetResult.targetSize)}). `
                : `Could not reach ${formatBytes(targetResult.targetSize)}. This is the smallest result: ${formatBytes(targetResult.compressedSize)}. Try a larger limit, or split the PDF into parts. `}
              {targetResult.method === 'text'
                ? 'Text is still selectable.'
                : `Pages were turned into pictures at about ${targetResult.dpi} dpi and quality ${targetResult.quality}; text is no longer selectable. Check that small print is still readable.`}
            </p>
          )}

          {/* Results Summary Metrics */}
          {result && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Optimization Complete
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  {result.reductionPercentage > 0 ? `-${result.reductionPercentage}%` : 'Cleaned & Optimized'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                <div className="p-2 bg-white/70 rounded-lg border border-emerald-100">
                  <span className="block text-[10px] text-slate-500">Original</span>
                  <strong className="text-slate-800">{formatBytes(result.originalSize)}</strong>
                </div>
                <div className="p-2 bg-white/70 rounded-lg border border-emerald-100">
                  <span className="block text-[10px] text-slate-500">Optimized</span>
                  <strong className="text-emerald-700">{formatBytes(result.compressedSize)}</strong>
                </div>
                <div className="p-2 bg-white/70 rounded-lg border border-emerald-100">
                  <span className="block text-[10px] text-slate-500">Saved</span>
                  <strong className="text-emerald-700">{formatBytes(result.savedBytes)}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}


          {/* Action Buttons */}
          {downloadUrl && <SaveResult href={downloadUrl} name={downloadName} label="Your compressed PDF is ready" saveLabel="Save PDF" outdated={isOutOfSync} />}
          <div className="pt-2 flex flex-col gap-3">
            {(!downloadUrl || isOutOfSync) && (
              <button
                onClick={handleCompress}
                disabled={status === 'processing'}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none bg-orange-700 hover:bg-orange-800 text-white"
              >
                {status === 'processing' ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : isOutOfSync ? (
                  <RefreshCw className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
                <span>
                  {status === 'processing'
                    ? (progress || 'Optimizing PDF...')
                    : isOutOfSync
                    ? 'Re-Compress with New Settings'
                    : mode === 'target' ? 'Reduce to this size' : 'Compress PDF'}
                </span>
              </button>
            )}
            {downloadUrl && !isOutOfSync && <StartOverButton onClick={handleReset}>Compress another PDF</StartOverButton>}

          </div>
        </div>
      )}
    </div>
  );
};