import React, { type RefObject } from 'react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import ui from '../../../locales/packs/docstudio.ui.en.json';
import { sourceTypeLabel } from '../../../lib/documentStudio/helpers';

import type { OutputSequenceItem, PageCard, SourceItem } from '../../../lib/documentStudio/types';

interface SourceRailProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  outputItems: OutputSequenceItem[];
  pages: PageCard[];
  removeSource: (sourceId: string) => void;
  setStage: (stage: 'selection' | 'studio') => void;
  sources: SourceItem[];
}

/** The sources list shown beside the page editor. */
export const SourceRail: React.FC<SourceRailProps> = ({ fileInputRef, outputItems, pages, removeSource, setStage, sources }) => {
  return (
    <aside className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-sm font-bold text-slate-900">{ui.sourceOverview}</h2>
        <p className="mt-1 text-xs text-slate-500">{sources.length} source{sources.length === 1 ? '' : 's'} · {outputItems.length} output pages</p>
      </div>
      <div className="space-y-2">
        {sources.map((source) => {
          const sourcePages = pages.filter((page) => page.sourceId === source.id);
          return (
            <div key={source.id} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2">
              <div className="h-11 w-9 shrink-0 overflow-hidden rounded bg-white">
                {sourcePages[0] && <img src={sourcePages[0].thumbnailUrl} alt="" className="h-full w-full object-contain" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-slate-700" title={source.fileName}>{source.fileName}</p>
                <p className="text-[10px] text-slate-400">{sourceTypeLabel(source.kind)} · {sourcePages.length} page{sourcePages.length === 1 ? '' : 's'}</p>
              </div>
              <button type="button" onClick={() => removeSource(source.id)} title={`Remove ${source.fileName}`} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
            </div>
          );
        })}
      </div>
      <div className="grid gap-2">
        <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"><Plus className="h-4 w-4" />{ui.addMoreFiles}</button>
        <button type="button" onClick={() => setStage('selection')} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />{ui.backToSelection}</button>
      </div>
    </aside>
  );
};
