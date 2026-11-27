import React, { type Dispatch, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, FilePlus2, Sparkles, ZoomIn } from 'lucide-react';
import { FileDropZone } from '../../common/FileDropZone';
import ui from '../../../locales/packs/docstudio.ui.en.json';
import { sourceTypeLabel } from '../../../lib/documentStudio/helpers';

import type { PageCard, SourceItem } from '../../../lib/documentStudio/types';

interface InputDeckProps {
  addFiles: (files: FileList | File[]) => void | Promise<void>;
  applyPageRange: (sourceId: string) => void;
  digitize: boolean;
  isLoading: boolean;
  pageRangeErrors: Record<string, string>;
  pageRanges: Record<string, string>;
  pages: PageCard[];
  selectedIds: string[];
  setPageRangeErrors: Dispatch<SetStateAction<Record<string, string>>>;
  setPageRanges: Dispatch<SetStateAction<Record<string, string>>>;
  setShowCustomPage: (show: boolean) => void;
  setShowSamplePdf: (show: boolean) => void;
  setSourcePreviewPageId: (pageId: string | null) => void;
  sources: SourceItem[];
  togglePage: (pageId: string) => void;
  toggleSourcePages: (sourceId: string, select: boolean) => void;
}

/** The upload area and the list of added documents with their page pickers. */
export const InputDeck: React.FC<InputDeckProps> = ({ addFiles, applyPageRange, digitize, isLoading, pageRangeErrors, pageRanges, pages, selectedIds, setPageRangeErrors, setPageRanges, setShowCustomPage, setShowSamplePdf, setSourcePreviewPageId, sources, togglePage, toggleSourcePages }) => {
  const { t, i18n } = useTranslation();
  return (
    <div className="min-w-0 space-y-4">
      <div className={`mx-auto w-full rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6 ${sources.length > 0 ? '' : 'max-w-3xl'}`}>
        <FileDropZone
          accept={digitize ? '.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp' : '.pdf,.docx,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp'}
          multiple
          disabled={isLoading}
          readingPdf={isLoading}
          onFiles={(files) => { void addFiles(files); }}
        />
        {!digitize && <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => setShowCustomPage(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:border-orange-200 hover:bg-orange-50">
            <FilePlus2 className="h-4 w-4" /> <span lang={i18n.language}>{t('master.custom')}</span>
          </button>
          <button type="button" onClick={() => setShowSamplePdf(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:border-orange-200 hover:bg-orange-50">
            <Sparkles className="h-4 w-4" /> <span lang={i18n.language}>{t('master.sample')}</span>
          </button>
        </div>}
      </div>

      {sources.length > 0 ? (
        <div className="space-y-5">
          {sources.map((source, sourceIndex) => {
            const sourcePages = pages.filter((page) => page.sourceId === source.id);
            return (
              <section key={source.id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                <div className="mb-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="whitespace-nowrap rounded-full bg-slate-900 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white">Document {sourceIndex + 1}</span>
                    <div className="h-px flex-1 bg-indigo-200" />
                    <div className="min-w-0 text-right">
                      <p className="truncate text-xs font-bold text-slate-700" title={source.fileName}>{source.fileName}</p>
                      <p className="text-[10px] text-slate-400">{sourceTypeLabel(source.kind)} · {sourcePages.length} page{sourcePages.length === 1 ? '' : 's'}{source.isEncrypted ? ' · password-protected' : ''}</p>
                    </div>
                  </div>
                  {sourcePages.length > 0 && (
                    <div className="flex flex-wrap items-end gap-2 rounded-xl bg-slate-50 p-2.5">
                      <label className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={sourcePages.every((page) => selectedIds.includes(page.id))}
                          onChange={(event) => toggleSourcePages(source.id, event.target.checked)}
                          className="accent-indigo-600"
                          aria-label={`Select all pages from ${source.fileName}`}
                        />
                        Select all
                      </label>
                      <label className="min-w-[150px] flex-1 text-[10px] font-semibold text-slate-600">
                        Page range
                        <input
                          value={pageRanges[source.id] ?? ''}
                          onChange={(event) => {
                            setPageRanges((current) => ({ ...current, [source.id]: event.target.value }));
                            setPageRangeErrors((current) => ({ ...current, [source.id]: '' }));
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              applyPageRange(source.id);
                            }
                          }}
                          placeholder={ui.eG135}
                          aria-label={`Page range for ${source.fileName}`}
                          aria-invalid={Boolean(pageRangeErrors[source.id])}
                          className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-normal"
                        />
                      </label>
                      <button type="button" onClick={() => applyPageRange(source.id)} className="h-9 rounded-lg border border-indigo-200 bg-white px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">{ui.applyRange}</button>
                      {pageRangeErrors[source.id] && <p role="alert" className="w-full text-[10px] text-red-600">{pageRangeErrors[source.id]}</p>}
                    </div>
                  )}
                </div>
                {sourcePages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                    {sourcePages.map((page) => {
                      const sequenceNumber = selectedIds.indexOf(page.id) + 1;
                      const isSelected = sequenceNumber > 0;
                      return (
                        <article key={page.id} className={`group relative flex min-w-0 flex-col rounded-xl border p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${isSelected ? 'border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-100' : 'border-slate-200 bg-slate-50'}`}>
                          <input type="checkbox" checked={isSelected} onChange={() => togglePage(page.id)} className="absolute left-3 top-3 z-10 h-5 w-5 accent-indigo-600" aria-label={`Add ${page.sourceName} page ${page.originalPageNumber} to output`} />
                          <div className="mb-2 flex h-48 items-center justify-center overflow-hidden rounded-lg bg-white p-2">
                            <img src={page.thumbnailUrl} alt={`${page.sourceName} page ${page.originalPageNumber}`} loading="lazy" className="max-h-full max-w-full object-contain shadow-sm" />
                          </div>
                          <div className="flex min-w-0 items-center justify-between gap-2">
                            <span className="truncate text-[10px] font-semibold text-slate-700">{page.sourceName}</span>
                            <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[9px] text-slate-500">Page {page.originalPageNumber}</span>
                          </div>
                          {isSelected && <span className="mt-2 inline-flex items-center gap-1 self-start rounded-full bg-indigo-600 px-2 py-1 text-[10px] font-bold text-white"><Check className="h-3 w-3" />Page {sequenceNumber} in Output</span>}
                          <button type="button" onClick={() => setSourcePreviewPageId(page.id)} className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"><ZoomIn className="h-3.5 w-3.5" />{ui.zoomPreview}</button>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{ui.thisDocumentCouldNotBe}</p>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">{ui.yourUploadedPagesWillAppear}</div>
      )}
    </div>
  );
};
