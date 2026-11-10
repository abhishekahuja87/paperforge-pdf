import React, { useRef, useState } from 'react';
import { FilePlus2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FileDropZoneProps {
  accept?: string;
  multiple?: boolean;
  /** True while a chosen file is being read; shows the same "Reading…" text in every tool. */
  readingPdf?: boolean;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
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

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  accept,
  multiple = false,
  readingPdf = false,
  onFiles,
  disabled = false,
}) => {
  const { t, i18n } = useTranslation();
  const formats = describeAccept(accept);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [showNotice, setShowNotice] = useState(false);

  const selectFiles = (files: File[]) => {
    if (files.length === 0) return;
    if (!multiple && files.length > 1) {
      setShowNotice(true);
      return;
    }
    setShowNotice(false);
    onFiles(files);
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
      {showNotice && <p lang={i18n.language} role="alert" className="mt-2 text-xs text-rose-800">{t('chooseOneFile')}</p>}
    </>
  );
};
