import React, { useRef, useState } from 'react';
import { AlertCircle, Check, Download, ImageDown, LoaderCircle, RotateCcw, Upload } from 'lucide-react';
import { downloadBlob, formatBytes, safeFileBaseName } from '../../lib/browserTools';
import { processBrowserImage, type BrowserImageFormat } from '../../lib/media/imageProcessing';

interface CompressedImage {
  file: File;
  blob: Blob;
  width: number;
  height: number;
  format: BrowserImageFormat;
}

type CompressionFormat = 'keep' | 'image/jpeg' | 'image/webp' | 'image/png';
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function chooseFormat(file: File, format: CompressionFormat): BrowserImageFormat {
  if (format !== 'keep') return format;
  return file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg';
}

const extensionFor: Record<BrowserImageFormat, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

export const ImageCompressor: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<CompressedImage[]>([]);
  const [quality, setQuality] = useState(75);
  const [maxDimension, setMaxDimension] = useState(0);
  const [format, setFormat] = useState<CompressionFormat>('keep');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (selected: FileList | File[]) => {
    const added = Array.from(selected);
    const supported = added.filter((file) => IMAGE_TYPES.includes(file.type));
    const rejected = added.filter((file) => !IMAGE_TYPES.includes(file.type));
    setFiles((current) => [...current, ...supported]);
    setResults([]);
    setError(rejected.length ? `Unsupported file${rejected.length === 1 ? '' : 's'}: ${rejected.map((file) => file.name).join(', ')}. Choose PNG, JPG, or WebP images.` : '');
  };

  const compress = async () => {
    setIsProcessing(true);
    setError('');
    const processed: CompressedImage[] = [];
    const failures: string[] = [];
    try {
      for (const file of files) {
        try {
          const targetFormat = chooseFormat(file, format);
          const result = await processBrowserImage(file, {
            format: targetFormat,
            quality: quality / 100,
            ...(maxDimension > 0 ? { maxDimension } : {}),
          });
          processed.push({ file, ...result, format: targetFormat });
        } catch (reason) {
          failures.push(`${file.name}: ${reason instanceof Error ? reason.message : 'Compression failed.'}`);
        }
      }
      setResults(processed);
      if (failures.length) setError(failures.join(' '));
      if (processed.length > 0 && processed.every((result) => result.blob.size >= result.file.size)) {
        setError((current) => `${current ? `${current} ` : ''}The selected settings did not reduce any file size. Try a lower quality or smaller maximum dimension.`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setResults([]);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <section className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <header className="mb-6 text-center">
        <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><ImageDown className="h-5 w-5" /></span>
        <h2 className="text-xl font-bold text-slate-900">Reduce image file size</h2>
        <p className="mt-1 text-sm text-slate-500">Compress multiple PNG, JPG, or WebP images locally. Compare each result before downloading.</p>
      </header>

      <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(event) => {
        if (event.target.files) addFiles(event.target.files);
        event.target.value = '';
      }} />
      {!files.length ? (
        <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full flex-col items-center rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-10 text-center transition hover:bg-indigo-50">
          <Upload className="mb-2 h-9 w-9 text-indigo-500" />
          <span className="text-sm font-semibold text-slate-700">Choose images to compress</span>
          <span className="mt-1 text-xs text-slate-500">PNG, JPG, or WebP · multiple files supported</span>
        </button>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700">{files.length} image{files.length === 1 ? '' : 's'} selected</p>
            <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600"><RotateCcw className="h-3.5 w-3.5" />Start over</button>
          </div>
          <ul className="max-h-40 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
            {files.map((file, index) => <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
              <span className="min-w-0 truncate font-medium text-slate-700">{file.name}</span><span className="shrink-0 text-slate-400">{formatBytes(file.size)}</span>
            </li>)}
          </ul>

          <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">
              Output format
              <select value={format} onChange={(event) => { setFormat(event.target.value as CompressionFormat); setResults([]); }} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
                <option value="keep">Keep format when possible</option>
                <option value="image/jpeg">JPG · smaller, no transparency</option>
                <option value="image/webp">WebP · efficient, supports transparency</option>
                <option value="image/png">PNG · lossless, may be larger</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Quality · {quality}%
              <input type="range" min="10" max="95" step="1" value={quality} onChange={(event) => { setQuality(Number(event.target.value)); setResults([]); }} className="mt-3 w-full accent-indigo-600" />
              <span className="mt-1 block font-normal text-slate-500">Applies to JPG and WebP output.</span>
            </label>
            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
              Maximum width or height
              <select value={maxDimension} onChange={(event) => { setMaxDimension(Number(event.target.value)); setResults([]); }} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
                <option value={0}>Keep original dimensions</option>
                <option value={2560}>Up to 2560 px · large images</option>
                <option value={1920}>Up to 1920 px · Full HD</option>
                <option value={1280}>Up to 1280 px · web</option>
                <option value={800}>Up to 800 px · small web images</option>
              </select>
            </label>
          </div>
          {format === 'image/png' && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">PNG is lossless; changing the dimensions may reduce size, but PNG re-encoding can also make some images larger.</p>}
          <button type="button" onClick={() => void compress()} disabled={isProcessing} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50">
            {isProcessing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImageDown className="h-4 w-4" />}
            {isProcessing ? 'Compressing locally...' : `Compress ${files.length} image${files.length === 1 ? '' : 's'}`}
          </button>

          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Compression results</h3>
              {results.map((result, index) => {
                const outputName = `${safeFileBaseName(result.file.name)}.${extensionFor[result.format]}`;
                const saved = result.file.size - result.blob.size;
                const percent = result.file.size ? (saved / result.file.size) * 100 : 0;
                return (
                  <div key={`${result.file.name}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800">{outputName}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{result.width} × {result.height} · {formatBytes(result.file.size)} → {formatBytes(result.blob.size)}</p>
                      <p className={`mt-1 text-[10px] font-semibold ${saved > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>{saved > 0 ? `${percent.toFixed(1)}% smaller (${formatBytes(saved)} saved)` : `${formatBytes(Math.abs(saved))} larger; try lower quality or dimensions`}</p>
                    </div>
                    <button type="button" onClick={() => downloadBlob(result.blob, outputName)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"><Download className="h-3.5 w-3.5" />Download</button>
                  </div>
                );
              })}
              <p className="flex items-center gap-1.5 text-[10px] text-slate-500"><Check className="h-3.5 w-3.5 text-emerald-600" />Compare sizes above; compression results depend on image content and settings.</p>
            </div>
          )}
        </div>
      )}

      {error && <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs leading-relaxed text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
      <p className="mt-5 border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400">Processing happens in this browser using canvas. Resizing and lossy formats may reduce visual quality; original files are not changed.</p>
    </section>
  );
};
