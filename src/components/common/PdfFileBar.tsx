import React from 'react';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatFileSize } from '../../lib/pdf/fileName';

interface PdfFileBarProps {
  /** File name as chosen. */
  name: string;
  /** Size in bytes. */
  size?: number;
  /** Number of pages, when known. Left out while it is still being counted. */
  pages?: number | null;
  /** Called when the person wants a different file. */
  onChange: () => void;
}

/** The same "file you chose" bar at the top of every PDF tool: name, pages and size, and a Change button. */
export const PdfFileBar: React.FC<PdfFileBarProps> = ({ name, size, pages, onChange }) => {
  const { t, i18n } = useTranslation();
  const facts = [
    pages ? t('fileBar.pages', { count: pages }) : '',
    size !== undefined ? formatFileSize(size) : '',
  ].filter(Boolean).join(' • ');
  return (
    <div lang={i18n.language} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-800"><FileText className="h-4 w-4" aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-stone-900" title={name}>{name}</p>
          {facts && <p className="text-[11px] text-stone-500">{facts}</p>}
        </div>
      </div>
      <button type="button" onClick={onChange} className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-200 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
        {t('fileBar.change')}
      </button>
    </div>
  );
};
