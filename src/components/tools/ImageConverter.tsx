import React, { useState } from 'react';
import { FileDropZone } from '../common/FileDropZone';
import { AlertCircle, Check, Download, Image, LoaderCircle, RotateCcw } from 'lucide-react';
import { downloadBlob, formatBytes } from '../../lib/browserTools';
import { generateFileName } from '../../lib/pdf/naming';
import { processBrowserImage, type BrowserImageFormat } from '../../lib/media/imageProcessing';
import { useTranslation } from 'react-i18next';

interface ConvertedImage {
  file: File;
  blob: Blob;
  width: number;
  height: number;
  format: BrowserImageFormat;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const FORMAT_EXTENSIONS: Record<BrowserImageFormat, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export const ImageConverter: React.FC = () => {
  const { t, i18n } = useTranslation('image');
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ConvertedImage[]>([]);
  const [format, setFormat] = useState<BrowserImageFormat>('image/webp');
  const [quality, setQuality] = useState(85);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const addFiles = (selectedFiles: FileList | File[]) => {
    const accepted = Array.from(selectedFiles).filter((file) => ACCEPTED_TYPES.includes(file.type));
    const rejected = Array.from(selectedFiles).filter((file) => !ACCEPTED_TYPES.includes(file.type));
    setFiles((current) => [...current, ...accepted]);
    setResults([]);
    setError(rejected.length ? `Unsupported file${rejected.length === 1 ? '' : 's'}: ${rejected.map((file) => file.name).join(', ')}. Choose PNG, JPG, or WebP images.` : '');
  };

  const convert = async () => {
    if (!files.length) return;
    setIsProcessing(true);
    setError('');
    setResults([]);
    const converted: ConvertedImage[] = [];
    const failures: string[] = [];
    try {
      for (const file of files) {
        try {
          const result = await processBrowserImage(file, { format, quality: quality / 100 });
          converted.push({ file, ...result, format });
        } catch (reason) {
          failures.push(`${file.name}: ${reason instanceof Error ? reason.message : 'Conversion failed.'}`);
        }
      }
      setResults(converted);
      if (failures.length) setError(failures.join(' '));
      if (!converted.length && !failures.length) setError('No images were converted.');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setResults([]);
    setError('');
  };

  const hasLossyFormat = format !== 'image/png';

  return (
    <section className="mx-auto min-w-0 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6">

      <div className="space-y-4">
        <FileDropZone
          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
          multiple
          disabled={isProcessing}
          onFiles={addFiles}
        />
        {error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-relaxed text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
        {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p lang={i18n.language} className="text-sm font-semibold text-slate-700">{t('selected', { count: files.length })}</p>
            <button lang={i18n.language} type="button" onClick={reset} disabled={isProcessing} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"><RotateCcw className="h-3.5 w-3.5" />{t('startOver')}</button>
          </div>
          <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
            {files.map((file, index) => <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs">
              <span className="min-w-0 truncate font-medium text-slate-700">{file.name}</span>
              <span className="shrink-0 text-slate-400">{formatBytes(file.size)}</span>
            </li>)}
          </ul>

          <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">
              Convert to
              <select value={format} disabled={isProcessing} onChange={(event) => { setFormat(event.target.value as BrowserImageFormat); setResults([]); }} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
                <option value="image/png">PNG · lossless, supports transparency</option>
                <option value="image/jpeg">JPG · compact, no transparency</option>
                <option value="image/webp">WebP · compact, supports transparency</option>
              </select>
            </label>
            {hasLossyFormat ? (
              <label className="text-xs font-semibold text-slate-700">
                <span lang={i18n.language}>{t('quality', { quality })}</span>
                <input type="range" min="10" max="100" step="1" value={quality} disabled={isProcessing} onChange={(event) => { setQuality(Number(event.target.value)); setResults([]); }} className="mt-3 w-full accent-indigo-600" />
                <span className="mt-1 block font-normal text-slate-500">Higher quality usually means a larger file.</span>
              </label>
            ) : (
              <p className="self-center text-xs leading-relaxed text-slate-500">PNG keeps image detail and transparency. Quality settings do not apply to PNG.</p>
            )}
          </div>
          {format === 'image/jpeg' && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">JPG does not support transparency. Transparent areas are filled with white.</p>}

          <button type="button" onClick={() => void convert()} disabled={isProcessing} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-50">
            {isProcessing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
            <span lang={i18n.language}>{isProcessing ? t('converting') : t('convert', { count: files.length })}</span>
          </button>

          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Converted files</h3>
              {results.map((result, index) => {
                const outputName = generateFileName('converted', FORMAT_EXTENSIONS[result.format], { base: result.file.name });
                const difference = result.blob.size - result.file.size;
                return (
                  <div key={`${result.file.name}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800">{outputName}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{result.width} × {result.height} · {formatBytes(result.file.size)} → {formatBytes(result.blob.size)} ({difference <= 0 ? `${formatBytes(Math.abs(difference))} smaller` : `${formatBytes(difference)} larger`})</p>
                    </div>
                    <button type="button" onClick={() => downloadBlob(result.blob, outputName)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50">
                      <Download className="h-3.5 w-3.5" /><span lang={i18n.language}>{t('download')}</span>
                    </button>
                  </div>
                );
              })}
              <p className="flex items-center gap-1.5 text-[10px] text-emerald-700"><Check className="h-3.5 w-3.5" />Converted images are ready. Download each file to save it to your device.</p>
            </div>
          )}
        </div>
        )}
      </div>

      <p className="mt-5 border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400">Images stay on your device. Conversion uses the browser’s built-in image decoder and canvas encoder; metadata is not copied into the converted file.</p>
    </section>
  );
};
