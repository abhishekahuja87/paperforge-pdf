import React, { useState, useEffect } from 'react';
import { FileDropZone } from '../common/FileDropZone';
import { 
  FileText, 
  RotateCw, 
  Download, 
  X, 
  AlertCircle, 
  Sparkles,
  RefreshCw 
} from 'lucide-react';
import { getPdfPageCount } from '../../lib/pdf/split';
import { rotatePdf, type RotationAngle, type RotationScope } from '../../lib/pdf/rotate';
import { generatePdfFilename } from '../../lib/pdf/naming';
import { useTranslation } from 'react-i18next';

export const RotatePdf: React.FC = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [angle, setAngle] = useState<RotationAngle>(90);
  const [scope, setScope] = useState<RotationScope>('all');
  const [rangeInput, setRangeInput] = useState<string>('');

  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<'' | 'invalid' | 'readError' | 'rotateError'>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  // Free the generated file when it is replaced or the page is left.
  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [downloadUrl]);
  const [downloadName, setDownloadName] = useState<string>('');

  const [lastGeneratedKey, setLastGeneratedKey] = useState<string>('');

  const currentSettingsKey = JSON.stringify({
    fileName: file?.name,
    angle,
    scope,
    rangeInput: rangeInput.trim(),
  });

  const isOutOfSync = downloadUrl !== null && currentSettingsKey !== lastGeneratedKey;

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('invalid');
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
      setRangeInput(`1-${count}`);
      setStatus('idle');
    } catch {
      setErrorMessage('readError');
      setStatus('error');
    }
  };

  const handleRotate = async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setErrorMessage('');

      const buffer = await file.arrayBuffer();
      const rotatedBytes = await rotatePdf({
        fileBuffer: buffer,
        angle,
        scope,
        rangeString: rangeInput,
      });

      const blob = new Blob([rotatedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const scopeDetail = scope === 'custom' 
        ? `pages-${rangeInput.replace(/\s+/g, '').replace(/,/g, '_')}` 
        : scope;
      const finalName = generatePdfFilename(file.name, 'rotated', `${angle}deg_${scopeDetail}`);

      setDownloadUrl(url);
      setDownloadName(finalName);
      setLastGeneratedKey(currentSettingsKey);
      setStatus('done');
    } catch {
      setErrorMessage('rotateError');
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

  return (
    <div className="min-w-0 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6 space-y-4">
      {!file && (
        <FileDropZone
          accept=".pdf,application/pdf"
          disabled={status === 'loading'}
          label={t(status === 'loading' ? 'rotateControls.reading' : 'rotateControls.choose')}
          hint={t('rotateControls.pdfOnly')}
          onFiles={(files) => { void handleFile(files[0]); }}
        />
      )}
      {!file && errorMessage && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-relaxed text-rose-800">{t(`rotateControls.${errorMessage}`)}</p>
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
                  {t('rotateControls.pages')} <strong className="text-slate-700">{pageCount}</strong> &bull; {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer"
              title={t('rotateControls.remove')}
              aria-label={t('rotateControls.remove')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Rotation Angle Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">{t('rotateControls.angle')}</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { deg: 90 as RotationAngle, label: t('rotateControls.clockwise'), desc: t('rotateControls.right') },
                { deg: 180 as RotationAngle, label: t('rotateControls.flip'), desc: t('rotateControls.upsideDown') },
                { deg: 270 as RotationAngle, label: t('rotateControls.counterclockwise'), desc: t('rotateControls.left') },
              ].map((item) => (
                <button
                  key={item.deg}
                  type="button"
                  onClick={() => setAngle(item.deg)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    angle === item.deg
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Scope Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">{t('rotateControls.scope')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'all' as RotationScope, label: t('rotateControls.all') },
                { id: 'odd' as RotationScope, label: t('rotateControls.odd') },
                { id: 'even' as RotationScope, label: t('rotateControls.even') },
                { id: 'custom' as RotationScope, label: t('rotateControls.custom') },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScope(item.id)}
                  className={`p-2 rounded-lg border text-center transition cursor-pointer text-xs ${
                    scope === item.id
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 font-semibold ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Range Input (shown when scope === 'custom') */}
          {scope === 'custom' && (
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-semibold text-slate-700">
                {t('rotateControls.range')}
              </label>
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder={t('rotateControls.placeholder', { count: pageCount })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
              />
              <p className="text-[11px] text-slate-500">
                {t('rotateControls.rangeHint', { count: pageCount })}
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{t(`rotateControls.${errorMessage}`)}</span>
            </div>
          )}

          {/* Dirty State Warning */}
          {isOutOfSync && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-center justify-between">
              <span>{t('rotateControls.changed')}</span>
              <span className="font-semibold text-amber-900 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> {t('rotateControls.unsaved')}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRotate}
              disabled={status === 'processing'}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {status === 'processing' ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : isOutOfSync ? (
                <RefreshCw className="w-4 h-4" />
              ) : (
                <RotateCw className="w-4 h-4" />
              )}
              <span>
                {status === 'processing'
                  ? t('rotateControls.rotating')
                  : isOutOfSync
                  ? t('rotateControls.rerotate')
                  : t('rotateControls.rotate')}
              </span>
            </button>

            {downloadUrl && (
              <a
                href={downloadUrl}
                download={downloadName || 'rotated_document.pdf'}
                className={`flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition ${
                  isOutOfSync
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-75'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>
                  {t(isOutOfSync ? 'rotateControls.outdated' : 'rotateControls.download')}
                </span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};