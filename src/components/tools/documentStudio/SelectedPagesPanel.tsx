import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, X } from 'lucide-react';

import type { PageCard } from '../../../lib/documentStudio/types';

interface SelectedPagesPanelProps {
  pageMap: Map<string, PageCard>;
  proceedToStudio: () => void;
  selectedIds: string[];
  togglePage: (pageId: string) => void;
}

/** The queue of pages chosen so far, with the Continue button. */
export const SelectedPagesPanel: React.FC<SelectedPagesPanelProps> = ({ pageMap, proceedToStudio, selectedIds, togglePage }) => {
  const { t, i18n } = useTranslation();
  return (
    <aside className="min-w-0 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 lang={i18n.language} className="text-sm font-bold text-slate-900">{t('master.selected')}</h2>
          <p lang={i18n.language} className="mt-1 text-xs text-slate-500">{t('master.queued', { count: selectedIds.length })}</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700">{selectedIds.length}</span>
      </div>
      <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
        {selectedIds.map((id, index) => {
          const page = pageMap.get(id);
          if (!page) return null;
          return (
            <div key={id} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">{index + 1}</span>
              <img src={page.thumbnailUrl} alt="" className="h-12 w-9 rounded bg-white object-contain" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-semibold text-slate-700">{page.sourceName}</p>
                <p className="text-[9px] text-slate-400">Original page {page.originalPageNumber}</p>
              </div>
              <button type="button" aria-label={`Remove output page ${index + 1}`} onClick={() => togglePage(id)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
            </div>
          );
        })}
        {selectedIds.length === 0 && <div lang={i18n.language} className="rounded-lg border border-dashed border-slate-200 px-3 py-8 text-center text-xs text-slate-400">{t('master.empty')}</div>}
      </div>
      {selectedIds.length > 0 && <button type="button" onClick={proceedToStudio} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200">
        <span lang={i18n.language}>{t('master.continue')}</span> <ArrowRight className="h-4 w-4" />
      </button>}
    </aside>
  );
};
