import React, { useState, useEffect } from 'react';
import { FileDropZone } from '../common/FileDropZone';
import { 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Download, 
  Sparkles, 
  RefreshCw, 
  AlertCircle,
  Layers
} from 'lucide-react';
import { 
  convertImagesToPdf, 
  type PageLayoutOption, 
  type ImageFileEntry 
} from '../../lib/pdf/imagesToPdf';
import { generatePdfFilename } from '../../lib/pdf/naming';
import { useTranslation } from 'react-i18next';

export const ImagesToPdf: React.FC = () => {
  const { t, i18n } = useTranslation('image');
  const [images, setImages] = useState<ImageFileEntry[]>([]);
  const [pageLayout, setPageLayout] = useState<PageLayoutOption>('a4-portrait');
  const [marginSize, setMarginSize] = useState<number>(20);

  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  // Free the generated file when it is replaced or the page is left.
  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [downloadUrl]);
  const [downloadName, setDownloadName] = useState<string>('');

  const [lastGeneratedKey, setLastGeneratedKey] = useState<string>('');

  const currentSettingsKey = JSON.stringify({
    imageIds: images.map((img) => `${img.file.name}_${img.file.size}`).join('|'),
    pageLayout,
    marginSize,
  });

  const isOutOfSync = downloadUrl !== null && currentSettingsKey !== lastGeneratedKey;

  const handleFiles = (fileList: File[]) => {
    if (!fileList || fileList.length === 0) return;

    const validFiles = Array.from(fileList).filter((f) => 
      f.type.startsWith('image/') || f.name.match(/\.(png|jpe?g|webp)$/i)
    );

    if (validFiles.length === 0) {
      setErrorMessage('Please select valid image files (JPG, PNG, WebP).');
      setStatus('error');
      return;
    }

    setErrorMessage('');

    // Load every image first so the pages keep the order the files were chosen in.
    void Promise.all(validFiles.map((file) => new Promise<ImageFileEntry | null>((resolve) => {
      const previewUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => resolve({ file, previewUrl, width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => {
        URL.revokeObjectURL(previewUrl);
        resolve(null);
      };
      img.src = previewUrl;
    }))).then((loaded) => {
      const entries = loaded.filter((entry): entry is ImageFileEntry => entry !== null);
      if (entries.length > 0) setImages((prev) => [...prev, ...entries]);
      const failed = validFiles.filter((_, index) => loaded[index] === null);
      if (failed.length > 0) {
        setErrorMessage(`These images could not be read and were skipped: ${failed.map((file) => file.name).join(', ')}.`);
      }
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
  };

  const handleConvert = async () => {
    if (images.length === 0) return;

    try {
      setStatus('processing');
      setErrorMessage('');

      const pdfBytes = await convertImagesToPdf({
        images,
        pageLayout,
        margin: pageLayout === 'fit' ? 0 : marginSize,
      });

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const baseName = images[0]?.file.name.replace(/\.[^/.]+$/, '') || 'images';
      const finalName = generatePdfFilename(baseName, 'converted', `${images.length}imgs_${pageLayout}`);

      setDownloadUrl(url);
      setDownloadName(finalName);
      setLastGeneratedKey(currentSettingsKey);
      setStatus('done');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during PDF compilation.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setDownloadUrl(null);
    setDownloadName('');
    setStatus('idle');
    setErrorMessage('');
    setLastGeneratedKey('');
  };

  const layoutOptions: { id: PageLayoutOption; label: string; desc: string }[] = [
    { id: 'a4-portrait', label: 'A4 Portrait', desc: 'Standard page format' },
    { id: 'a4-landscape', label: 'A4 Landscape', desc: 'Wide spreadsheet/photo' },
    { id: 'letter-portrait', label: 'US Letter', desc: 'Standard North America' },
    { id: 'fit', label: 'Fit to Image', desc: 'Page matches image size' },
  ];

  return (
    <div className="min-w-0 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6 space-y-4">
      <FileDropZone
        accept="image/png,image/jpeg,image/webp"
        multiple
        disabled={status === 'processing'}
        label={t('choose')}
        hint={t('hint')}
        labelLanguage={i18n.language}
        onFiles={handleFiles}
      />
      {images.length === 0 && errorMessage && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-relaxed text-rose-800">{errorMessage}</p>
      )}

      {images.length > 0 && (
        <div className="space-y-5">
          {/* Layout & Margin Controls */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="block text-xs font-semibold text-slate-700">Choose Page Format & Sizing</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {layoutOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPageLayout(opt.id)}
                  className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                    pageLayout === opt.id
                      ? 'border-indigo-600 bg-white text-indigo-950 font-semibold ring-1 ring-indigo-600 shadow-xs'
                      : 'border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-semibold">{opt.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>

            {pageLayout !== 'fit' && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-2">
                <span className="text-xs text-slate-600 font-medium">Page Margins:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'None', val: 0 },
                    { label: 'Small (20pt)', val: 20 },
                    { label: 'Standard (40pt)', val: 40 },
                  ].map((m) => (
                    <button
                      key={m.val}
                      type="button"
                      onClick={() => setMarginSize(m.val)}
                      className={`px-2.5 py-1 text-[11px] rounded font-medium border transition cursor-pointer ${
                        marginSize === m.val
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Image List Preview with Ordering */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 px-1">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Pages Order ({images.length} Image{images.length > 1 ? 's' : ''})
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-slate-400 hover:text-slate-700 underline cursor-pointer"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {images.map((entry, idx) => (
                <div
                  key={`${entry.file.name}-${idx}`}
                  className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 transition"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span className="w-5 text-center text-xs font-bold text-slate-400">
                      {idx + 1}
                    </span>
                    <img
                      src={entry.previewUrl}
                      alt={entry.file.name}
                      className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-800 truncate">{entry.file.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {entry.width} &times; {entry.height} px &bull; {(entry.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveImage(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg disabled:opacity-30 cursor-pointer"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(idx, 'down')}
                      disabled={idx === images.length - 1}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg disabled:opacity-30 cursor-pointer"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer ml-1"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
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
              <span>Settings or image order changed. Re-generate to update your download file.</span>
              <span className="font-semibold text-amber-900 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Unsaved
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleConvert}
              disabled={status === 'processing'}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {status === 'processing' ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : isOutOfSync ? (
                <RefreshCw className="w-4 h-4" />
              ) : (
                <Layers className="w-4 h-4" />
              )}
              <span>
                {status === 'processing'
                  ? 'Compiling PDF...'
                  : isOutOfSync
                  ? 'Re-Compile with New Settings'
                  : `Convert ${images.length} Image${images.length > 1 ? 's' : ''} to PDF`}
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
                <span>{isOutOfSync ? 'Download Outdated File' : 'Download Assembled PDF'}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};