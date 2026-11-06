import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  FileText,
  Files,
  Loader2,
  Trash2,
} from 'lucide-react';
import { mergePdfFiles } from '../../lib/pdf/merge';
import { generatePdfFilename } from '../../lib/pdf/naming';
import { FileDropZone } from '../common/FileDropZone';
import { useTranslation } from 'react-i18next';

export const MergePdf: React.FC = () => {
  const { t } = useTranslation('merge');
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');
  const [error, setError] = useState<{ key: 'invalid' | 'failed'; reason?: string } | null>(null);

  useEffect(() => {
    if (!downloadUrl) return;
    return () => URL.revokeObjectURL(downloadUrl);
  }, [downloadUrl]);

  const addFiles = (selectedFiles: File[]) => {
    const pdfFiles = selectedFiles.filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'),
    );
    const rejectedCount = selectedFiles.length - pdfFiles.length;

    if (pdfFiles.length > 0) {
      setFiles((currentFiles) => [...currentFiles, ...pdfFiles]);
      setDownloadUrl(null);
      setDownloadName('');
    }

    setError(rejectedCount > 0 ? { key: 'invalid' } : null);
  };

  const removeFile = (index: number) => {
    setFiles((currentFiles) => currentFiles.filter((_, fileIndex) => fileIndex !== index));
    setDownloadUrl(null);
    setDownloadName('');
    setError(null);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;

    const updatedFiles = [...files];
    const [movedFile] = updatedFiles.splice(index, 1);
    updatedFiles.splice(targetIndex, 0, movedFile);
    setFiles(updatedFiles);
    setDownloadUrl(null);
    setDownloadName('');
  };

  const handleMerge = async () => {
    if (files.length < 2) return;

    try {
      setIsProcessing(true);
      setError(null);

      const mergedBlob = await mergePdfFiles(files);
      setDownloadUrl(URL.createObjectURL(mergedBlob));
      setDownloadName(generatePdfFilename('documents', 'merged', `${files.length}files`));
    } catch (mergeError) {
      const reason = mergeError instanceof Error ? mergeError.message : undefined;
      setError({ key: 'failed', reason });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <section className="min-w-0 overflow-hidden rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)]">
        <div className="space-y-4 p-4 sm:p-6">
          <FileDropZone
            accept=".pdf,application/pdf"
            multiple
            disabled={isProcessing}
            label={t('choose')}
            hint={t('hint')}
            onFiles={addFiles}
          />

          {error && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-relaxed text-rose-800">
              {t(error.key)} {error.reason && <span lang="en">{error.reason}</span>}
            </p>
          )}

          {files.length > 0 ? (
            <div className="space-y-2" aria-label={t('order')}>
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600" aria-live="polite">
                  {t('orderCount', { count: files.length })}
                </h3>
                <span className="text-[10px] text-stone-400">{t('firstPage')}</span>
              </div>
              <ol className="space-y-2">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-stone-200 bg-white px-2.5 py-2.5 transition hover:border-orange-200 sm:gap-3 sm:px-3"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-xs font-bold tabular-nums text-orange-800">
                      {index + 1}
                    </span>
                    <span className="flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-orange-700" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-stone-800" title={file.name}>{file.name}</span>
                        <span className="mt-0.5 block text-[10px] text-stone-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </span>
                    </span>
                    <span className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveFile(index, 'up')}
                        disabled={index === 0 || isProcessing}
                        aria-label={t('moveFileUp', { file: file.name })}
                        title={t('moveUp')}
                        className="rounded-lg p-2 text-stone-500 transition hover:bg-orange-50 hover:text-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFile(index, 'down')}
                        disabled={index === files.length - 1 || isProcessing}
                        aria-label={t('moveFileDown', { file: file.name })}
                        title={t('moveDown')}
                        className="rounded-lg p-2 text-stone-500 transition hover:bg-orange-50 hover:text-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        disabled={isProcessing}
                        aria-label={t('removeFile', { file: file.name })}
                        title={t('remove')}
                        className="rounded-lg p-2 text-stone-400 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-1 text-[11px] text-stone-400">
              <Files className="h-4 w-4" aria-hidden="true" />
              {t('empty')}
            </div>
          )}

          {downloadUrl && (
            <div role="status" className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <Check className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-emerald-950">{t('ready')}</span>
                <span className="block truncate text-[10px] text-emerald-800">{downloadName}</span>
              </span>
              <a
                href={downloadUrl}
                download={downloadName}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                {t('save')}
              </a>
            </div>
          )}

          {files.length > 0 && <button
            type="button"
            onClick={handleMerge}
            disabled={files.length < 2 || isProcessing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-orange-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>{t('merging')}</span>
              </>
            ) : (
              <>
                <Files className="h-4 w-4" aria-hidden="true" />
                <span>{files.length < 2 ? t('addMore') : t('action')}</span>
              </>
            )}
          </button>}
        </div>
      </section>
    </>
  );
};

export default MergePdf;
