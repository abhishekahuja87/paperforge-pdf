import React, { useState, useEffect } from 'react';
import { PdfFileBar } from '../common/PdfFileBar';
import { FileDropZone } from '../common/FileDropZone';
import { generatePdfFilename } from '../../lib/pdf/naming';
import { RotateCw, Trash2, AlertCircle, Loader2, MoveLeft, MoveRight, GripVertical, Copy, FilePlus2, Undo2, ArrowDownUp, RefreshCw } from 'lucide-react';
import { loadPdfThumbnails, exportOrganizedPdf } from '../../lib/pdf/organize';
import type { PageThumbnailItem } from '../../lib/pdf/organize';
import { useProtectedPdf } from '../common/ProtectedPdfGate';
import { SaveResult, StartOverButton } from '../common/SaveResult';
import { pdfBlob } from '../../lib/pdf/toBlob';

const toolButton = 'inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 transition hover:border-orange-400 disabled:cursor-not-allowed disabled:opacity-40';
const iconButton = 'inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent';

export const OrganizePdf: React.FC = () => {
  const { prepare, dialog: passwordDialog } = useProtectedPdf();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageThumbnailItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  // Free the generated file when it is replaced or the page is left.
  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [downloadUrl]);
  const [error, setError] = useState<string | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  // Earlier page lists, newest last, so every change can be undone. The first loaded list is kept for "Start from the original".
  const [history, setHistory] = useState<PageThumbnailItem[][]>([]);
  const [original, setOriginal] = useState<PageThumbnailItem[]>([]);
  const [moveDraft, setMoveDraft] = useState<Record<string, string>>({});
  // Page being dragged by its grip, the page it is over, and the last move so it can be undone right where the person is looking.
  const [drag, setDrag] = useState<{ from: number; over: number } | null>(null);
  const [lastMove, setLastMove] = useState('');

  const resetState = () => {
    setFile(null);
    setPages([]);
    setIsLoading(false);
    setIsExporting(false);
    setError(null);
    setFileBuffer(null);
    setHistory([]);
    setOriginal([]);
    setMoveDraft({});
    setDrag(null);
    setLastMove('');
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  };

  const handleFileChange = async (selected: File) => {
    if (!selected) return;

    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file.');
      return;
    }

    resetState();
    setFile(selected);
    setIsLoading(true);

    try {
      const buffer = await selected.arrayBuffer();
      setFileBuffer(buffer);
      const loadedPages = await loadPdfThumbnails(buffer);
      setPages(loadedPages);
      setOriginal(loadedPages);
    } catch {
      setError('Failed to render PDF pages. The file may be password-protected or corrupted.');
    } finally {
      setIsLoading(false);
    }
  };

  // Any edit makes a previously exported file out of date, so drop it.
  const discardExport = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  };

  /** Every change goes through here, so it can be undone and an earlier exported file is dropped. */
  const update = (next: PageThumbnailItem[]) => {
    setHistory((list) => [...list.slice(-49), pages]);
    discardExport();
    setError(null);
    setPages(next);
  };

  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory(history.slice(0, -1));
    setLastMove('');
    discardExport();
    setPages(previous);
  };

  /** Moves one page to a new position (0-based), shifting the others. */
  const moveTo = (index: number, target: number) => {
    if (target < 0 || target >= pages.length || target === index) return;
    const updated = [...pages];
    const [item] = updated.splice(index, 1);
    updated.splice(target, 0, item);
    update(updated);
    setLastMove(`Page ${index + 1} moved to position ${target + 1}.`);
  };

  /** Dragging works with a finger or a mouse: the grip follows the pointer and the page under it is the drop place. */
  const pageUnder = (x: number, y: number): number | null => {
    const holder = document.elementFromPoint(x, y)?.closest('[data-page-index]');
    return holder ? Number(holder.getAttribute('data-page-index')) : null;
  };
  const startDrag = (event: React.PointerEvent<HTMLButtonElement>, index: number) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ from: index, over: index });
  };
  const dragOver = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const over = pageUnder(event.clientX, event.clientY);
    if (over !== null && over !== drag.over) setDrag({ ...drag, over });
  };
  const endDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const over = pageUnder(event.clientX, event.clientY) ?? drag.over;
    const from = drag.from;
    setDrag(null);
    moveTo(from, over);
  };

  const movePage = (index: number, direction: 'left' | 'right') => moveTo(index, direction === 'left' ? index - 1 : index + 1);
  const rotatePage = (index: number) => update(pages.map((item, i) => (i === index ? { ...item, rotation: (item.rotation + 90) % 360 } : item)));
  const rotateAll = () => update(pages.map((item) => ({ ...item, rotation: (item.rotation + 90) % 360 })));
  const reverseAll = () => update([...pages].reverse());
  const newId = (base: string) => `${base}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const duplicatePage = (index: number) => { const updated = [...pages]; updated.splice(index + 1, 0, { ...pages[index], id: newId('copy') }); update(updated); };
  const insertBlank = (index: number) => { const updated = [...pages]; updated.splice(index + 1, 0, { id: newId('blank'), originalPageIndex: -1, rotation: 0, thumbnailUrl: '' }); update(updated); };

  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      setError('A document must have at least one page.');
      return;
    }
    update(pages.filter((_, idx) => idx !== index));
  };

  const commitMove = (item: PageThumbnailItem, index: number) => {
    const wanted = Number(moveDraft[item.id]);
    setMoveDraft((draft) => { const next = { ...draft }; delete next[item.id]; return next; });
    if (Number.isInteger(wanted) && wanted >= 1 && wanted <= pages.length) moveTo(index, wanted - 1);
  };

  const handleExport = async () => {
    if (!fileBuffer || pages.length === 0) return;

    setIsExporting(true);
    setError(null);

    try {
      const bytes = await exportOrganizedPdf(fileBuffer, pages);
      const blob = pdfBlob(bytes);
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch {
      setError('Failed to export organized PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto min-w-0 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6">
      {passwordDialog}

      {!file && error && (
        <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">{error}</p>
      )}
      {/* Upload Drop Zone matching MergePdf identically */}
      {!file ? (
        <FileDropZone
          accept=".pdf,application/pdf"
          onFiles={(files) => { void prepare(files[0]).then((prepared) => { if (prepared) void handleFileChange(prepared); }); }}
        />
      ) : (
        <div className="space-y-5">
          {/* Selected File Card */}
          <PdfFileBar name={file.name} size={file.size} pages={pages.length} onChange={resetState} />

          {/* Loading Previews Spinner */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-500 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Generating page previews in memory...</span>
            </div>
          )}

          {!isLoading && pages.length > 0 && (
            <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Changes to all pages">
              <button type="button" onClick={undo} disabled={history.length === 0} className={toolButton}><Undo2 className="h-4 w-4" aria-hidden="true" />Undo</button>
              <button type="button" onClick={rotateAll} className={toolButton}><RotateCw className="h-4 w-4" aria-hidden="true" />Rotate all</button>
              <button type="button" onClick={reverseAll} disabled={pages.length < 2} className={toolButton}><ArrowDownUp className="h-4 w-4" aria-hidden="true" />Reverse order</button>
              <button type="button" onClick={() => update(original)} disabled={history.length === 0} className={toolButton}><RefreshCw className="h-4 w-4" aria-hidden="true" />Start from the original</button>
              <p className="w-full text-[11px] text-slate-500">Drag the grip at the top of a page to move it, or type a number in its box to move it straight there. The plus page button adds a blank page after that page, and the copy button repeats a page.</p>
            </div>
          )}

          {/* Interactive Thumbnails Grid */}
          {!isLoading && pages.length > 0 && (
            <div className="grid grid-cols-2 gap-3.5 pt-2 sm:grid-cols-3 md:grid-cols-4">
              {pages.map((p, idx) => (
                <div
                  key={p.id}
                  data-page-index={idx}
                  className={`group relative flex min-w-0 flex-col space-y-2 rounded-xl border bg-slate-50 p-2.5 shadow-sm transition-all hover:border-indigo-400 ${drag && drag.from === idx ? 'border-orange-500 opacity-60' : drag && drag.over === idx ? 'border-orange-500 ring-2 ring-orange-300' : 'border-slate-200'}`}
                >
                  <button
                    type="button"
                    aria-label={`Drag page ${idx + 1} to a new place`}
                    title="Drag to move"
                    onPointerDown={(event) => startDrag(event, idx)}
                    onPointerMove={dragOver}
                    onPointerUp={endDrag}
                    onPointerCancel={() => setDrag(null)}
                    className="flex min-h-10 w-full cursor-grab touch-none select-none items-center justify-center gap-1 rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-500 active:cursor-grabbing"
                  >
                    <GripVertical className="h-4 w-4 rotate-90" aria-hidden="true" /> Drag
                  </button>
                  {/* Thumbnail Image */}
                  <div className="relative aspect-[3/4] bg-white rounded-lg overflow-hidden border border-slate-100 flex items-center justify-center">
                    {p.originalPageIndex < 0 ? (
                      <span className="text-[11px] font-semibold text-slate-400">Blank page</span>
                    ) : (
                      <img
                        src={p.thumbnailUrl}
                        alt={`Page ${idx + 1}${p.originalPageIndex !== idx ? `, originally page ${p.originalPageIndex + 1}` : ''}`}
                        style={{ transform: `rotate(${p.rotation}deg)` }}
                        className="max-h-full max-w-full object-contain transition-transform duration-200"
                      />
                    )}
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-slate-900/70 text-white rounded text-[10px] font-semibold">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Ordering & Rotation Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-1 border-t border-slate-100 pt-1 text-slate-600">
                    <button type="button" aria-label={`Move page ${idx + 1} left`} title="Move left" disabled={idx === 0} onClick={() => movePage(idx, 'left')} className={iconButton}><MoveLeft className="h-4 w-4" aria-hidden="true" /></button>
                    <label className="flex items-center gap-1 text-[11px] text-slate-500">
                      <span className="sr-only">Move page {idx + 1} to position</span>
                      <input
                        type="number"
                        min={1}
                        max={pages.length}
                        inputMode="numeric"
                        value={moveDraft[p.id] ?? String(idx + 1)}
                        onChange={(event) => setMoveDraft((draft) => ({ ...draft, [p.id]: event.target.value }))}
                        onBlur={() => commitMove(p, idx)}
                        onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); commitMove(p, idx); } }}
                        className="h-10 w-12 rounded-lg border border-slate-300 bg-white px-1 text-center text-xs font-semibold text-slate-800"
                      />
                    </label>
                    <button type="button" aria-label={`Move page ${idx + 1} right`} title="Move right" disabled={idx === pages.length - 1} onClick={() => movePage(idx, 'right')} className={iconButton}><MoveRight className="h-4 w-4" aria-hidden="true" /></button>
                    <button type="button" aria-label={`Rotate page ${idx + 1}`} title="Rotate 90°" onClick={() => rotatePage(idx)} className={`${iconButton} text-indigo-700`}><RotateCw className="h-4 w-4" aria-hidden="true" /></button>
                    <button type="button" aria-label={`Duplicate page ${idx + 1}`} title="Duplicate" onClick={() => duplicatePage(idx)} className={iconButton}><Copy className="h-4 w-4" aria-hidden="true" /></button>
                    <button type="button" aria-label={`Add a blank page after page ${idx + 1}`} title="Add blank page after" onClick={() => insertBlank(idx)} className={iconButton}><FilePlus2 className="h-4 w-4" aria-hidden="true" /></button>
                    <button type="button" aria-label={`Delete page ${idx + 1}`} title="Delete" onClick={() => deletePage(idx)} className={`${iconButton} text-rose-700 hover:bg-rose-100`}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {lastMove && (
            <div role="status" className="sticky bottom-3 z-10 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg">
              <span>{lastMove}</span>
              <button type="button" onClick={undo} className={toolButton}><Undo2 className="h-4 w-4" aria-hidden="true" />Undo</button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          {!isLoading && pages.length > 0 && (
            <div className="mt-8 flex flex-col gap-3 items-stretch">
              {!downloadUrl ? (
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Organizing...</span>
                    </>
                  ) : (
                    <span>Organize PDF</span>
                  )}
                </button>
              ) : (
                <SaveResult href={downloadUrl} name={generatePdfFilename(file.name, 'organized')} label="Your organized PDF is ready" saveLabel="Save PDF" />
              )}

              {downloadUrl && (
                <StartOverButton onClick={resetState}>Organize another PDF</StartOverButton>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizePdf;