import React, { useEffect, useState } from 'react';
import { AlertCircle, Download, LoaderCircle, Maximize2, RotateCcw } from 'lucide-react';
import { FileDropZone } from '../common/FileDropZone';
import { downloadBlob, formatBytes } from '../../lib/browserTools';
import { generateFileName } from '../../lib/pdf/naming';
import { PHOTO_PRESETS, toPixels, type PhotoPreset, type SizeUnit } from '../../lib/media/photoPresets';
import { resizeImageToTarget, type ResizeFit, type ResizeToTargetResult } from '../../lib/media/resizeToTarget';

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_EXACT_SIDE = 8000;

interface ResizedImage extends ResizeToTargetResult {
  file: File;
  previewUrl: string;
}

interface ImageResizerProps {
  /** Starting value for the size limit, in KB. */
  defaultMaxKb?: number;
  /** Id of a preset in photoPresets.ts to apply when the page opens. */
  defaultPreset?: string;
}

export const ImageResizer: React.FC<ImageResizerProps> = ({ defaultMaxKb = 100, defaultPreset }) => {
  const initial = PHOTO_PRESETS.find((item) => item.id === defaultPreset);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ResizedImage[]>([]);
  const [maxKb, setMaxKb] = useState(String(initial?.maxKb ?? defaultMaxKb));
  const [useExact, setUseExact] = useState(Boolean(initial));
  const [unit, setUnit] = useState<SizeUnit>(initial?.unit ?? 'px');
  const [dpi, setDpi] = useState(String(initial?.dpi ?? 300));
  const [width, setWidth] = useState(String(initial?.width ?? 600));
  const [height, setHeight] = useState(String(initial?.height ?? 600));
  const [background, setBackground] = useState('#ffffff');
  const [activePreset, setActivePreset] = useState(initial?.id ?? '');
  const [fit, setFit] = useState<ResizeFit>('crop');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [enlarged, setEnlarged] = useState<number | null>(null);

  useEffect(() => () => results.forEach((result) => URL.revokeObjectURL(result.previewUrl)), [results]);

  const clearResults = () => { setResults([]); setEnlarged(null); };

  const addFiles = (selected: FileList | File[]) => {
    const added = Array.from(selected);
    const supported = added.filter((file) => IMAGE_TYPES.includes(file.type));
    const rejected = added.filter((file) => !IMAGE_TYPES.includes(file.type));
    setFiles((current) => [...current, ...supported]);
    clearResults();
    setError(rejected.length ? `Unsupported file${rejected.length === 1 ? '' : 's'}: ${rejected.map((file) => file.name).join(', ')}. Choose PNG, JPG, or WebP images.` : '');
  };

  const run = async () => {
    const kb = Number(maxKb);
    const dpiValue = Number(dpi);
    if (useExact && unit !== 'px' && !(dpiValue >= 50 && dpiValue <= 1200)) {
      setError('Enter a resolution between 50 and 1200 DPI.');
      return;
    }
    const exactWidth = toPixels(Number(width), unit, dpiValue);
    const exactHeight = toPixels(Number(height), unit, dpiValue);
    if (!Number.isFinite(kb) || kb < 5 || kb > 20000) {
      setError('Enter a size limit between 5 KB and 20000 KB.');
      return;
    }
    if (useExact && (![exactWidth, exactHeight].every((side) => side >= 16 && side <= MAX_EXACT_SIDE))) {
      setError(`Enter a width and height between 16 and ${MAX_EXACT_SIDE} pixels.`);
      return;
    }
    setIsProcessing(true);
    setError('');
    clearResults();
    const processed: ResizedImage[] = [];
    const failures: string[] = [];
    try {
      for (const file of files) {
        try {
          const result = await resizeImageToTarget(file, {
            maxBytes: Math.floor(kb * 1024),
            background,
            ...(useExact ? { exact: { width: exactWidth, height: exactHeight, fit } } : {}),
          });
          processed.push({ ...result, file, previewUrl: URL.createObjectURL(result.blob) });
        } catch (reason) {
          failures.push(`${file.name}: ${reason instanceof Error ? reason.message : 'Resizing failed.'}`);
        }
      }
      setResults(processed);
      if (failures.length) setError(failures.join(' '));
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFiles([]);
    clearResults();
    setError('');
  };

  const applyPreset = (preset: PhotoPreset) => {
    setActivePreset(preset.id);
    setUseExact(true);
    setUnit(preset.unit);
    setDpi(String(preset.dpi));
    setWidth(String(preset.width));
    setHeight(String(preset.height));
    setMaxKb(String(preset.maxKb));
    setFit('crop');
    clearResults();
  };
  const pixelsW = toPixels(Number(width), unit, Number(dpi));
  const pixelsH = toPixels(Number(height), unit, Number(dpi));

  const field = 'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm';

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
              <p className="text-sm font-semibold text-slate-700">{files.length} image{files.length === 1 ? '' : 's'} selected</p>
              <button type="button" onClick={reset} disabled={isProcessing} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"><RotateCcw className="h-3.5 w-3.5" />Start over</button>
            </div>
            <ul className="max-h-40 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                  <span className="min-w-0 truncate font-medium text-slate-700">{file.name}</span>
                  <span className="shrink-0 text-slate-400">{formatBytes(file.size)}</span>
                </li>
              ))}
            </ul>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Quick presets for forms</h3>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Photo size presets">
                {PHOTO_PRESETS.map((preset) => (
                  <button key={preset.id} type="button" aria-pressed={activePreset === preset.id} disabled={isProcessing} onClick={() => applyPreset(preset)} className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${activePreset === preset.id ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                    {preset.label}, up to {preset.maxKb} KB
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">These are commonly requested sizes. Forms differ and change, so always follow the size and KB limit written on yours; you can edit every value below.</p>
            </div>
            <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                Maximum file size (KB)
                <input type="number" inputMode="numeric" min={5} max={20000} value={maxKb} disabled={isProcessing} onChange={(event) => { setMaxKb(event.target.value); clearResults(); }} className={field} />
                <span className="mt-1 block font-normal text-slate-500">The output is a JPG at or under this size whenever that is possible.</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 sm:col-span-2">
                <input type="checkbox" checked={useExact} disabled={isProcessing} onChange={(event) => { setUseExact(event.target.checked); clearResults(); }} className="h-4 w-4 accent-indigo-600" />
                Set an exact width and height
              </label>
              <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 sm:col-span-2">
                Background colour (for transparent areas{useExact ? ' and white borders' : ''})
                <input type="color" value={background} disabled={isProcessing} onChange={(event) => { setBackground(event.target.value); clearResults(); }} className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-white p-0.5" />
              </label>
              {useExact && (
                <>
                  <label className="text-xs font-semibold text-slate-700">
                    Unit
                    <select value={unit} disabled={isProcessing} onChange={(event) => { setUnit(event.target.value as SizeUnit); setActivePreset(''); clearResults(); }} className={field}>
                      <option value="px">Pixels (px)</option>
                      <option value="mm">Millimetres (mm)</option>
                      <option value="cm">Centimetres (cm)</option>
                      <option value="in">Inches (in)</option>
                    </select>
                  </label>
                  {unit !== 'px' ? (
                    <label className="text-xs font-semibold text-slate-700">
                      Resolution (DPI)
                      <input type="number" inputMode="numeric" min={50} max={1200} value={dpi} disabled={isProcessing} onChange={(event) => { setDpi(event.target.value); clearResults(); }} className={field} />
                      <span className="mt-1 block font-normal text-slate-500">300 DPI is common for printed photos</span>
                    </label>
                  ) : <div className="hidden sm:block" />}
                  <label className="text-xs font-semibold text-slate-700">
                    Width ({unit})
                    <input type="number" inputMode="decimal" step="any" min={0} value={width} disabled={isProcessing} onChange={(event) => { setWidth(event.target.value); setActivePreset(''); clearResults(); }} className={field} />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Height ({unit})
                    <input type="number" inputMode="decimal" step="any" min={0} value={height} disabled={isProcessing} onChange={(event) => { setHeight(event.target.value); setActivePreset(''); clearResults(); }} className={field} />
                  </label>
                  <p className="text-xs text-slate-600 sm:col-span-2" aria-live="polite">Output size: <strong>{Number.isFinite(pixelsW) && Number.isFinite(pixelsH) ? `${pixelsW} × ${pixelsH} px` : '—'}</strong></p>
                  <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                    If the shape is different
                    <select value={fit} disabled={isProcessing} onChange={(event) => { setFit(event.target.value as ResizeFit); clearResults(); }} className={field}>
                      <option value="crop">Crop to fill the size (centered)</option>
                      <option value="contain">Fit inside with white borders</option>
                      <option value="stretch">Stretch to the size (may distort)</option>
                    </select>
                  </label>
                </>
              )}
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              {useExact
                ? 'With an exact size, only the quality is lowered to reach the file-size limit. If the limit cannot be reached at that size, you will be told.'
                : 'Without an exact size, quality is lowered first and the picture is scaled down in small steps only if that is not enough. Proportions are kept.'}
            </p>

            <button type="button" onClick={() => void run()} disabled={isProcessing} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-50">
              {isProcessing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Maximize2 className="h-4 w-4" />}
              {isProcessing ? 'Resizing…' : `Resize ${files.length} image${files.length === 1 ? '' : 's'}`}
            </button>

            {results.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Results</h3>
                  {results.length > 1 && (
                    <button type="button" onClick={() => results.forEach((item) => downloadBlob(item.blob, generateFileName('resized', 'jpg', { base: item.file.name })))} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"><Download className="h-3.5 w-3.5" />Download all</button>
                  )}
                </div>
                {results.map((result, index) => {
                  const outputName = generateFileName('resized', 'jpg', { base: result.file.name });
                  return (
                    <div key={`${result.file.name}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <button type="button" onClick={() => setEnlarged(enlarged === index ? null : index)} aria-expanded={enlarged === index} aria-label={`${enlarged === index ? 'Hide' : 'Show'} full-size preview of ${outputName}`} className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200">
                          <img src={result.previewUrl} alt="" className="h-14 w-14 rounded-lg border border-slate-200 bg-white object-contain" />
                        </button>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800">{outputName}</p>
                          <p className="mt-1 text-[10px] text-slate-500">{result.width} × {result.height} px · {formatBytes(result.file.size)} → {formatBytes(result.blob.size)} · quality {Math.round(result.quality * 100)}%</p>
                          <p className={`mt-1 text-[10px] font-semibold ${result.reachedTarget ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {result.reachedTarget ? `Under ${maxKb} KB` : `Could not reach ${maxKb} KB. Raise the limit${useExact ? ' or use a smaller width and height' : ''}.`}
                          </p>
                          <ul className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-slate-600" aria-label="Checks against your settings">
                            <li>{result.reachedTarget ? '✓' : '✗'} Size {formatBytes(result.blob.size)} of {maxKb} KB</li>
                            {useExact && <li>{result.width === pixelsW && result.height === pixelsH ? '✓' : '✗'} Exactly {pixelsW} × {pixelsH} px</li>}
                            <li>✓ JPG</li>
                          </ul>
                        </div>
                      </div>
                      <button type="button" onClick={() => downloadBlob(result.blob, outputName)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"><Download className="h-3.5 w-3.5" />Download</button>
                      {enlarged === index && (
                        <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2">
                          <img src={result.previewUrl} alt={`Full-size preview of ${outputName}`} className="mx-auto max-h-96 max-w-full object-contain" />
                          <p className="mt-1 text-center text-[10px] text-slate-500">Shown at {result.width} × {result.height} px. Check that the face or signature is clear before you upload.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <p className="mt-5 border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400">Processing happens in this browser using canvas. Output is JPG, transparent areas become white, and original files are not changed.</p>
    </section>
  );
};

export default ImageResizer;
