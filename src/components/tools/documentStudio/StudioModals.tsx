import React, { useEffect, useRef, useState } from 'react';
import { Crop, Download, FilePlus2, Image, RotateCcw, RotateCw, Scissors, Trash2, X } from 'lucide-react';
import { renderPageEditorPreview } from '../../../lib/documentStudio/studio';
import type {
  CropBounds,
  GeneratedPageOptions,
  OutputSequenceItem,
  PageCard,
  PageEditorPreview,
  RedactionBox,
  SourceItem,
} from '../../../lib/documentStudio/types';

const ACTION_BUTTON = 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40';

interface ModalProps {
  onClose: () => void;
}

export const ContentsEntryModal: React.FC<ModalProps & {
  item: OutputSequenceItem;
  outputPageName: string;
  onSave: (title: string) => void;
  onRemove: () => void;
}> = ({ onClose, item, outputPageName, onSave, onRemove }) => {
  const [title, setTitle] = useState(item.contentsTitle ?? '');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (trimmed) onSave(trimmed);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4" role="presentation">
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="contents-entry-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="contents-entry-title" className="text-lg font-bold text-slate-900">{item.contentsTitle ? 'Edit contents entry' : 'Add to table of contents'}</h2>
            <p className="mt-1 text-xs text-slate-500">This entry will link to {outputPageName} in the exported PDF.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close contents entry dialog" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <label className="block text-xs font-semibold text-slate-600">
          Contents title
          <input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="e.g. Project overview" />
        </label>
        <div className="mt-5 flex flex-wrap justify-between gap-2">
          <div>
            {item.contentsTitle && <button type="button" onClick={onRemove} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Remove entry</button>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
            <button type="submit" disabled={!title.trim()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">Save entry</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export const CustomPageModal: React.FC<ModalProps & {
  onCreate: (options: GeneratedPageOptions) => void;
}> = ({ onClose, onCreate }) => {
  const [type, setType] = useState<GeneratedPageOptions['type']>('blank');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState('');
  const [date, setDate] = useState('');
  const [text, setText] = useState('');
  const [border, setBorder] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onCreate({ type, title, subtitle, author, date, text, border });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4" role="presentation">
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="custom-page-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 id="custom-page-title" className="text-lg font-bold text-slate-900">Create a custom page</h2>
            <p className="text-xs text-slate-500">The page is generated locally and added to your input deck.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([
            ['blank', 'Blank spacer'],
            ['cover', 'Cover / divider'],
            ['note', 'Custom note'],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setType(value)} className={`rounded-lg border px-2 py-2 text-xs font-semibold ${type === value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>
              {label}
            </button>
          ))}
        </div>
        {type !== 'blank' && (
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-medium text-slate-600">
              Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" maxLength={120} />
            </label>
            {type === 'cover' ? (
              <>
                <label className="block text-xs font-medium text-slate-600">
                  Subtitle
                  <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" maxLength={180} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-medium text-slate-600">
                    Author
                    <input value={author} onChange={(event) => setAuthor(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" maxLength={80} />
                  </label>
                  <label className="block text-xs font-medium text-slate-600">
                    Date
                    <input value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" maxLength={40} />
                  </label>
                </div>
              </>
            ) : (
              <label className="block text-xs font-medium text-slate-600">
                Note text
                <textarea value={text} onChange={(event) => setText(event.target.value)} rows={7} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Plain text or simple Markdown" />
              </label>
            )}
          </div>
        )}
        {type !== 'blank' && (
          <label className="mt-3 flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={border} onChange={(event) => setBorder(event.target.checked)} />
            Add a page border
          </label>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Add to input deck</button>
        </div>
      </form>
    </div>
  );
};

export const ProtectedPdfPasswordModal: React.FC<ModalProps & {
  fileName: string;
  error: string;
  isLoading: boolean;
  onSubmit: (password: string) => void;
}> = ({ onClose, fileName, error, isLoading, onSubmit }) => {
  const [password, setPassword] = useState('');
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password) onSubmit(password);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4" role="presentation">
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="protected-pdf-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="protected-pdf-title" className="text-lg font-bold text-slate-900">Password-protected PDF</h2>
            <p className="mt-1 break-all text-xs text-slate-500">{fileName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cancel protected PDF import" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-slate-600">Enter the PDF’s open (user) password or owner password. It stays in this browser and is needed to preview and include the pages.</p>
        <label className="block text-xs font-semibold text-slate-600">
          PDF password
          <input autoFocus type="password" autoComplete="off" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" disabled={isLoading} onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-50">Cancel file</button>
          <button type="submit" disabled={!password || isLoading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{isLoading ? 'Unlocking locally…' : 'Unlock & add pages'}</button>
        </div>
      </form>
    </div>
  );
};

export const SourcePagePreviewModal: React.FC<ModalProps & {
  page: PageCard;
  source: SourceItem;
}> = ({ onClose, page, source }) => {
  const [preview, setPreview] = useState<PageEditorPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const title = `${page.sourceName} · page ${page.originalPageNumber}`;

  useEffect(() => {
    let active = true;
    void renderPageEditorPreview(source, page, 0, { top: 0, right: 0, bottom: 0, left: 0 })
      .then((result) => {
        if (active) setPreview(result);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not render the page preview.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [page, source]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-3 sm:p-5">
      <div role="dialog" aria-modal="true" aria-labelledby="source-page-preview-title" className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 id="source-page-preview-title" className="truncate text-base font-bold text-slate-900">Preview source page</h2>
            <p className="truncate text-xs text-slate-500">{title} · view only</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close source preview" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex min-h-[50vh] flex-1 items-center justify-center overflow-auto bg-slate-100 p-4 sm:p-6">
          {isLoading ? <p className="text-sm text-slate-500">Rendering page preview…</p>
            : error ? <p role="alert" className="text-sm text-red-600">{error}</p>
              : preview && <img src={preview.image} alt={`${title} enlarged preview`} className="max-h-[78vh] max-w-full object-contain shadow-lg" />}
        </div>
        <div className="flex justify-end border-t border-slate-200 px-4 py-3 sm:px-6">
          <button type="button" onClick={onClose} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700">Close preview</button>
        </div>
      </div>
    </div>
  );
};

export const PageEditorModal: React.FC<ModalProps & {
  item: OutputSequenceItem;
  source: SourceItem;
  onApply: (item: OutputSequenceItem) => void;
  onExportPage: (item: OutputSequenceItem) => Promise<void>;
  onExportImage: (item: OutputSequenceItem, format: 'png' | 'jpeg' | 'webp') => Promise<void>;
  onDuplicate: () => void;
  onDelete: () => void;
}> = ({ onClose, item, source, onApply, onExportPage, onExportImage, onDuplicate, onDelete }) => {
  const [draft, setDraft] = useState(item);
  const [preview, setPreview] = useState<PageEditorPreview | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTextIds, setSelectedTextIds] = useState<number[]>([]);
  const [blackoutMode, setBlackoutMode] = useState(false);
  const [draftBox, setDraftBox] = useState<RedactionBox | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [imageExportError, setImageExportError] = useState('');
  const pointerOrigin = useRef<{ x: number; y: number } | null>(null);
  const imageFrame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void renderPageEditorPreview(source, item.page, draft.rotation, draft.crop)
      .then((result) => {
        if (active) setPreview(result);
      })
      .catch((reason: unknown) => {
        if (active) setPreviewError(reason instanceof Error ? reason.message : 'Could not render the page preview.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [source, item.page, draft.rotation, draft.crop]);

  const updateCrop = (edge: keyof CropBounds, value: number) => {
    setPreview(null);
    setPreviewError('');
    setIsLoading(true);
    setDraft((current) => ({ ...current, crop: { ...current.crop, [edge]: value } }));
  };
  const rotatePage = (angle: number) => {
    setPreview(null);
    setPreviewError('');
    setIsLoading(true);
    setDraft((current) => ({ ...current, rotation: (current.rotation + angle + 360) % 360 }));
  };
  const resetCrop = () => {
    setPreview(null);
    setPreviewError('');
    setIsLoading(true);
    setDraft((current) => ({ ...current, crop: { top: 0, right: 0, bottom: 0, left: 0 } }));
  };
  const toggleTextRegion = (index: number) => {
    setSelectedTextIds((current) => current.includes(index)
      ? current.filter((id) => id !== index)
      : [...current, index]);
  };
  const redactSelectedText = () => {
    if (!preview) return;
    const newBoxes = selectedTextIds
      .map((index) => preview.textRegions[index]?.box)
      .filter((box): box is RedactionBox => Boolean(box));
    setDraft((current) => ({ ...current, redactions: [...current.redactions, ...newBoxes] }));
    setSelectedTextIds([]);
  };
  const pointerPoint = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = imageFrame.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  };
  const startBlackout = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!blackoutMode) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerOrigin.current = pointerPoint(event);
    setDraftBox({ ...pointerOrigin.current, width: 0, height: 0 });
  };
  const moveBlackout = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!blackoutMode || !pointerOrigin.current) return;
    const point = pointerPoint(event);
    const origin = pointerOrigin.current;
    setDraftBox({
      x: Math.min(origin.x, point.x),
      y: Math.min(origin.y, point.y),
      width: Math.abs(point.x - origin.x),
      height: Math.abs(point.y - origin.y),
    });
  };
  const finishBlackout = () => {
    if (draftBox && draftBox.width > 0.003 && draftBox.height > 0.003) {
      setDraft((current) => ({ ...current, redactions: [...current.redactions, draftBox] }));
    }
    pointerOrigin.current = null;
    setDraftBox(null);
  };
  const exportCurrentPage = async () => {
    setIsExporting(true);
    setExportError('');
    try {
      await onExportPage(draft);
    } catch (reason) {
      setExportError(reason instanceof Error ? reason.message : 'Could not export this page.');
    } finally {
      setIsExporting(false);
    }
  };
  const exportCurrentPageImage = async () => {
    setIsExportingImage(true);
    setImageExportError('');
    try {
      await onExportImage(draft, imageFormat);
    } catch (reason) {
      setImageExportError(reason instanceof Error ? reason.message : 'Could not export this page image.');
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-3 sm:p-5">
      <div role="dialog" aria-modal="true" aria-labelledby="page-editor-title" className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 id="page-editor-title" className="truncate text-base font-bold text-slate-900">Zoom &amp; edit page</h2>
            <p className="truncate text-xs text-slate-500">{item.page.sourceName} · source page {item.page.originalPageNumber}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close page editor" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="flex min-h-[65vh] items-center justify-center overflow-auto bg-slate-100 p-4 sm:p-6">
            {isLoading ? (
              <p className="text-sm text-slate-500">Rendering a high-resolution page preview…</p>
            ) : previewError ? (
              <p role="alert" className="text-sm text-red-600">{previewError}</p>
            ) : preview ? (
              <div
                ref={imageFrame}
                onPointerDown={startBlackout}
                onPointerMove={moveBlackout}
                onPointerUp={finishBlackout}
                onPointerCancel={finishBlackout}
                className={`relative inline-block max-h-[60vh] max-w-full select-none ${blackoutMode ? 'cursor-crosshair touch-none' : ''}`}
              >
                <img src={preview.image} alt="Zoomed page preview" draggable={false} className="block max-h-[60vh] max-w-full object-contain shadow-lg" />
                {draft.redactions.map((box, index) => (
                  <div key={`blackout-${index}`} aria-label="Blackout preview" className="pointer-events-none absolute bg-black" style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.width * 100}%`, height: `${box.height * 100}%` }} />
                ))}
                {preview.textRegions.map((region, index) => (
                  <button
                    key={`text-${index}`}
                    type="button"
                    title={`Select text: ${region.text}`}
                    aria-label={`Select text ${region.text}`}
                    disabled={blackoutMode}
                    onClick={() => toggleTextRegion(index)}
                    className={`absolute min-h-[2px] min-w-[2px] border-0 p-0 ${selectedTextIds.includes(index) ? 'bg-rose-500/60 outline outline-2 outline-rose-600' : 'bg-transparent hover:bg-sky-400/30'}`}
                    style={{ left: `${region.box.x * 100}%`, top: `${region.box.y * 100}%`, width: `${region.box.width * 100}%`, height: `${region.box.height * 100}%` }}
                  />
                ))}
                {draftBox && <div className="pointer-events-none absolute border border-black bg-black/50" style={{ left: `${draftBox.x * 100}%`, top: `${draftBox.y * 100}%`, width: `${draftBox.width * 100}%`, height: `${draftBox.height * 100}%` }} />}
              </div>
            ) : null}
          </section>

          <aside className="space-y-4 border-t border-slate-200 p-4 lg:overflow-y-auto lg:border-l lg:border-t-0">
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Page actions</h3>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => rotatePage(-90)} className={ACTION_BUTTON}><RotateCcw className="h-3.5 w-3.5" />-90°</button>
                <button type="button" onClick={() => rotatePage(90)} className={ACTION_BUTTON}><RotateCw className="h-3.5 w-3.5" />+90°</button>
                <button type="button" onClick={() => rotatePage(180)} className={ACTION_BUTTON}>180°</button>
              </div>
              {source.kind === 'image' && (
                <label className="block text-xs font-medium text-slate-600">
                  Image sizing
                  <select value={draft.fitMode} onChange={(event) => setDraft((current) => ({ ...current, fitMode: event.target.value as OutputSequenceItem['fitMode'] }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs">
                    <option value="letterbox">Fit inside page</option>
                    <option value="fill">Fill page (crop edges)</option>
                    <option value="original">Original scale</option>
                  </select>
                </label>
              )}
              <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><Crop className="h-3.5 w-3.5" />Crop / scanner edges</div>
                {([
                  ['top', 'Top'],
                  ['right', 'Right'],
                  ['bottom', 'Bottom'],
                  ['left', 'Left'],
                ] as const).map(([edge, label]) => (
                  <label key={edge} className="block text-[10px] text-slate-500">
                    <span className="mb-1 flex justify-between"><span>{label}</span><span>{Math.round(draft.crop[edge] * 100)}%</span></span>
                    <input type="range" min="0" max="0.45" step="0.01" value={draft.crop[edge]} onChange={(event) => updateCrop(edge, Number(event.target.value))} className="w-full accent-indigo-600" />
                  </label>
                ))}
                <button type="button" onClick={resetCrop} className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800">Reset crop</button>
              </div>
            </section>

            <section className="space-y-2 border-t border-slate-100 pt-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Redact / blackout</h3>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-500">Select text on a digital PDF page, or draw over any area. Scanned pages can be marked by drawing.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" disabled={!preview?.textRegions.length || isLoading} onClick={() => { setBlackoutMode(false); setSelectedTextIds([]); }} className={ACTION_BUTTON}>Select text</button>
                <button type="button" onClick={() => { setBlackoutMode((current) => !current); setSelectedTextIds([]); }} className={`${ACTION_BUTTON} ${blackoutMode ? 'border-rose-400 bg-rose-50 text-rose-700' : ''}`}><Scissors className="h-3.5 w-3.5" />{blackoutMode ? 'Drawing on' : 'Draw area'}</button>
              </div>
              {preview?.textRegions.length === 0 && !isLoading && <p className="rounded-lg bg-amber-50 px-2.5 py-2 text-[10px] text-amber-800">No selectable PDF text detected. Use Draw area for scanned or image pages.</p>}
              {selectedTextIds.length > 0 && (
                <button type="button" onClick={redactSelectedText} className="w-full rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700">Black out {selectedTextIds.length} selected text item{selectedTextIds.length === 1 ? '' : 's'}</button>
              )}
              {draft.redactions.length > 0 && <button type="button" onClick={() => setDraft((current) => ({ ...current, redactions: [] }))} className="w-full rounded-lg px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">Clear all blackouts</button>}
              <p className="text-[10px] text-slate-400">Redacted PDF pages are rasterized on export so hidden text beneath a blackout is not retained.</p>
            </section>

            <section className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              <button type="button" onClick={onDuplicate} className={ACTION_BUTTON}><FilePlus2 className="h-3.5 w-3.5" />Duplicate page</button>
              <button type="button" onClick={onDelete} className={`${ACTION_BUTTON} text-rose-700 hover:bg-rose-50`}><Trash2 className="h-3.5 w-3.5" />Delete page</button>
              <button type="button" disabled={isLoading || isExporting || Boolean(previewError)} onClick={() => void exportCurrentPage()} className={`${ACTION_BUTTON} col-span-2`}>
                {isExporting ? <span className="animate-spin">…</span> : <Download className="h-3.5 w-3.5" />}
                {isExporting ? 'Creating page PDF…' : 'Export this page as PDF'}
              </button>
              {exportError && <p role="alert" className="col-span-2 rounded-lg bg-red-50 px-2.5 py-2 text-[10px] text-red-700">{exportError}</p>}
              <label className="col-span-2 text-[10px] font-semibold text-slate-600">
                Save edited page as image
                <div className="mt-1 flex gap-2">
                  <select value={imageFormat} onChange={(event) => setImageFormat(event.target.value as 'png' | 'jpeg' | 'webp')} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs">
                    <option value="png">PNG · lossless</option>
                    <option value="jpeg">JPG · smaller file</option>
                    <option value="webp">WebP · smaller file</option>
                  </select>
                  <button type="button" disabled={isLoading || isExportingImage || Boolean(previewError)} onClick={() => void exportCurrentPageImage()} className={ACTION_BUTTON}>
                    {isExportingImage ? <span className="animate-spin">…</span> : <Image className="h-3.5 w-3.5" />}
                    {isExportingImage ? 'Saving…' : 'Save image'}
                  </button>
                </div>
              </label>
              {imageExportError && <p role="alert" className="col-span-2 rounded-lg bg-red-50 px-2.5 py-2 text-[10px] text-red-700">{imageExportError}</p>}
            </section>
          </aside>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 sm:px-6">
          <p className="text-[10px] text-slate-400">Edits apply to this output page only.</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
            <button type="button" disabled={isLoading || Boolean(previewError)} onClick={() => onApply(draft)} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50">Apply page edits</button>
          </div>
        </div>
      </div>
    </div>
  );
};
