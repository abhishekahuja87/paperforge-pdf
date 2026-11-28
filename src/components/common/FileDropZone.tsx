import React, { useRef, useState } from 'react';
import { FilePlus2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CameraButton } from './CameraButton';
import { pdfBlob } from '../../lib/pdf/toBlob';

interface FileDropZoneProps {
  accept?: string;
  multiple?: boolean;
  /** True while a chosen file is being read; shows the same "Reading…" text in every tool. */
  readingPdf?: boolean;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  /** Offer "try a sample PDF" under a PDF-only box, so a visitor with no file at hand can still see the tool work. Turn off where a sample makes no sense (for example unlocking). */
  showSample?: boolean;
}

const FORMAT_NAMES: Array<[RegExp, string]> = [
  [/pdf/, 'PDF'],
  [/png/, 'PNG'],
  [/jpe?g/, 'JPG'],
  [/webp/, 'WebP'],
  [/gif/, 'GIF'],
  [/json/, 'JSON'],
  [/docx?|wordprocessingml/, 'Word'],
  [/vcf|vcard/, 'VCF'],
];

/** Readable list of the accepted file types, for example "PDF, PNG, JPG". Empty when it cannot tell. */
export function describeAccept(accept?: string): string {
  if (!accept) return '';
  const lower = accept.toLowerCase();
  const names = FORMAT_NAMES.filter(([pattern]) => pattern.test(lower)).map(([, name]) => name);
  if (lower.includes('image/*') && !names.includes('PNG')) names.push('Images');
  return names.join(', ');
}

/** True when the tool takes pictures only (no PDF or other documents), so a camera button makes sense. */
export function acceptsPhotosOnly(accept?: string): boolean {
  if (!accept) return false;
  const lower = accept.toLowerCase();
  return lower.includes('image/') && !/pdf|docx?|json|vcf|vcard|text\//.test(lower);
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  accept,
  multiple = false,
  readingPdf = false,
  onFiles,
  disabled = false,
  showSample = true,
}) => {
  const { t, i18n } = useTranslation();
  const formats = describeAccept(accept);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [makingSample, setMakingSample] = useState(false);
  const offerSample = showSample && !disabled && describeAccept(accept) === 'PDF';

  const selectFiles = (files: File[]) => {
    if (files.length === 0) return;
    if (!multiple && files.length > 1) {
      setShowNotice(true);
      return;
    }
    setShowNotice(false);
    onFiles(files);
  };

  /** Makes one made-up PDF (two when the tool takes several files) and hands it over as if it had been chosen. Nothing leaves the device. */
  const trySample = async (): Promise<void> => {
    setMakingSample(true);
    try {
      const { generateSamplePdf } = await import('../../lib/pdf/generateSample');
      const files = await Promise.all(Array.from({ length: multiple ? 2 : 1 }, async (_, index) => {
        const bytes = await generateSamplePdf({ pageCount: 4 - index, template: 'invoice', title: `Sample document ${index + 1}` });
        return new File([pdfBlob(bytes)], `sample-document-${index + 1}.pdf`, { type: 'application/pdf' });
      }));
      selectFiles(files);
    } catch {
      setShowNotice(false);
    } finally {
      setMakingSample(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          selectFiles(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
            setDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) selectFiles(Array.from(event.dataTransfer.files));
        }}
        className={`group flex min-h-36 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-5 text-center outline-none transition duration-200 focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50 ${dragging ? 'border-orange-500 bg-orange-100/70' : 'border-orange-200 bg-orange-50/60 hover:border-orange-400 hover:bg-orange-50'}`}
      >
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-orange-800 shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow">
          <FilePlus2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <span lang={i18n.language} className="text-sm font-bold text-stone-900">{readingPdf ? t('dropZone.reading') : t(multiple ? 'dropZone.chooseMany' : 'dropZone.chooseOne')}</span>
        <span lang={i18n.language} className="mt-1 text-xs text-stone-500">{formats ? t('dropZone.hint', { formats }) : t('dropZone.hintPlain')}</span>
      </button>
      {acceptsPhotosOnly(accept) && !disabled && (
        <div className="mt-2 flex justify-center"><CameraButton onPhoto={(file) => selectFiles([file])} className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-900 hover:bg-orange-50" /></div>
      )}
      {offerSample && (
        <div className="mt-2 flex justify-center">
          <button type="button" disabled={makingSample} onClick={() => void trySample()} className="min-h-10 rounded-lg px-3 text-xs font-semibold text-orange-800 underline decoration-orange-300 underline-offset-2 hover:text-orange-900 disabled:opacity-60">
            <span lang={i18n.language}>{t('dropZone.trySample')}</span>
          </button>
        </div>
      )}
      {showNotice && <p lang={i18n.language} role="alert" className="mt-2 text-xs text-rose-800">{t('chooseOneFile')}</p>}
    </>
  );
};
