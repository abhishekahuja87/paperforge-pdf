import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, FileText, Loader2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { createSource, DEFAULT_STUDIO_SETTINGS, exportMasterPdf } from '../../lib/documentStudio/studio';
import type { OutputSequenceItem, PageCard, SourceItem } from '../../lib/documentStudio/types';
import { formatFileSize } from '../../lib/pdf/fileName';
import { generatePdfFilename } from '../../lib/pdf/naming';
import { FileDropZone } from '../common/FileDropZone';
import { SaveResult, StartOverButton } from '../common/SaveResult';
import { UploadNote } from '../common/UploadNote';

interface Item { id: string; file: File; source: SourceItem; page: PageCard }
type Language = 'eng' | 'hin+eng';

const arrayBufferFromBytes = (bytes: Uint8Array): ArrayBuffer => {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
};

const outputItem = (page: PageCard): OutputSequenceItem => ({
  id: crypto.randomUUID(), page, rotation: 0, crop: { top: 0, right: 0, bottom: 0, left: 0 }, fitMode: 'letterbox', redactions: [],
});

const isImage = (file: File): boolean => ['png', 'jpg', 'jpeg', 'webp'].includes(file.name.split('.').pop()?.toLowerCase() ?? '') && (file.type === '' || file.type.startsWith('image/'));

/** Scan to searchable PDF: choose the images, choose the language, press the button, save. Cropping, rotating and arranging pages live in Master Document Studio. */
export const DigitizeTool: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);
  const [language, setLanguage] = useState<Language>('eng');
  const [separate, setSeparate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ url: string; name: string; zip: boolean } | null>(null);
  const cancel = useRef<AbortController | null>(null);

  useEffect(() => () => cancel.current?.abort(), []);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);

  const addFiles = async (files: File[]) => {
    setResult(null);
    setError('');
    setLoading(true);
    try {
      for (const file of files) {
        if (!isImage(file)) { setError(t('digitize.invalidFile', { name: file.name })); continue; }
        try {
          const created = await createSource(file);
          const page = created.pages[0];
          if (page) setItems((current) => [...current, { id: crypto.randomUUID(), file, source: created.source, page }]);
        } catch (reason) {
          setError(`${file.name}: ${reason instanceof Error ? reason.message : 'Could not read this file.'}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const change = (next: Item[]) => { setItems(next); setResult(null); };
  const move = (index: number, by: number) => {
    const target = index + by;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved!);
    change(copy);
  };
  const startOver = () => { setItems([]); setResult(null); setError(''); setSeparate(false); };

  const make = async () => {
    if (items.length === 0) return;
    setRunning(true);
    setError('');
    setResult(null);
    const controller = new AbortController();
    cancel.current = controller;
    try {
      const { makeSearchable } = await import('../../lib/documentStudio/searchable');
      const sourceMap = new Map(items.map((item) => [item.source.id, item.source]));
      const settings = { ...DEFAULT_STUDIO_SETTINGS, numberPosition: 'none' as const };
      const sequence = items.map((item) => outputItem(item.page));
      const groups = separate ? sequence.map((entry) => [entry]) : [sequence];
      const languages = language === 'hin+eng' ? ['hin', 'eng'] : ['eng'];
      const zip = separate && groups.length > 1 ? new (await import('jszip')).default() : null;
      let single: Uint8Array = new Uint8Array();
      for (const [index, group] of groups.entries()) {
        controller.signal.throwIfAborted();
        const made = await exportMasterPdf(group, sourceMap, settings);
        const searchable = await makeSearchable(made.bytes, (page, total) => {
          setProgress(t('digitize.progress', { document: index + 1, documents: groups.length, page, total }));
        }, controller.signal, languages);
        if (zip) zip.file(`${index + 1}-${generatePdfFilename(items[index]!.file.name.replace(/\.[^.]+$/, ''), 'searchable')}`, searchable);
        else single = searchable;
      }
      controller.signal.throwIfAborted();
      const pdfName = generatePdfFilename(items.length === 1 ? items[0]!.file.name.replace(/\.[^.]+$/, '') : 'documents', 'searchable', items.length > 1 ? `${items.length}images` : undefined);
      const blob = zip ? await zip.generateAsync({ type: 'blob' }) : new Blob([arrayBufferFromBytes(single)], { type: 'application/pdf' });
      setResult({ url: URL.createObjectURL(blob), name: zip ? pdfName.replace(/\.pdf$/i, '.zip') : pdfName, zip: Boolean(zip) });
    } catch (reason) {
      setError(controller.signal.aborted ? t('digitize.cancelled') : reason instanceof Error ? reason.message : 'The PDF could not be made.');
    } finally {
      cancel.current = null;
      setProgress('');
      setRunning(false);
    }
  };

  const select = 'ml-2 rounded-lg border border-stone-200 bg-white p-2 text-xs text-stone-800';
  return (
    <div className="min-w-0 space-y-4 rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6">
      <FileDropZone
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        multiple
        disabled={running}
        readingPdf={loading}
        onFiles={(files) => { void addFiles(files); }}
      />
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-relaxed text-rose-800">{error}</p>}

      {items.length > 0 ? (
        <div className="space-y-3">
          <ol className="space-y-2" aria-label="Images in order">
            {items.map((item, index) => (
              <li key={item.id} className="grid min-w-0 grid-cols-[2rem_3rem_minmax(0,1fr)_auto] items-start gap-2 rounded-xl border border-stone-200 bg-white px-2.5 py-2.5 sm:gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-xs font-bold tabular-nums text-orange-800">{index + 1}</span>
                <img src={item.page.thumbnailUrl} alt="" className="h-12 w-12 rounded-md bg-stone-100 object-cover" />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-stone-800" title={item.file.name}>{item.file.name}</span>
                  <span className="mt-0.5 block text-[10px] text-stone-400">{formatFileSize(item.file.size)}</span>
                </span>
                <span className="-mt-1 flex items-center gap-0.5">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0 || running} aria-label={`Move ${item.file.name} up`} title="Move up" className="rounded-lg p-2 text-stone-500 hover:bg-orange-50 hover:text-orange-800 disabled:cursor-not-allowed disabled:opacity-30"><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1 || running} aria-label={`Move ${item.file.name} down`} title="Move down" className="rounded-lg p-2 text-stone-500 hover:bg-orange-50 hover:text-orange-800 disabled:cursor-not-allowed disabled:opacity-30"><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
                  <button type="button" onClick={() => change(items.filter((entry) => entry.id !== item.id))} disabled={running} aria-label={`Remove ${item.file.name}`} title="Remove" className="rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                </span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <label className="text-xs font-semibold text-stone-700">{t('digitize.language')}
              <select value={language} disabled={running} onChange={(event) => { setLanguage(event.target.value as Language); setResult(null); }} className={select}>
                <option value="eng">{t('digitize.languageEnglish')}</option>
                <option value="hin+eng">{t('digitize.languageHindi')}</option>
              </select>
            </label>
            {items.length > 1 && (
              <label className="text-xs font-semibold text-stone-700">{t('digitize.output')}
                <select value={separate ? 'separate' : 'merged'} disabled={running} onChange={(event) => { setSeparate(event.target.value === 'separate'); setResult(null); }} className={select}>
                  <option value="merged">{t('digitize.merged')}</option>
                  <option value="separate">{t('digitize.separate')}</option>
                </select>
              </label>
            )}
          </div>
        </div>
      ) : (
        <UploadNote>{t('digitize.studioHint', { defaultValue: 'Need to crop, rotate or arrange pages first? Do that in Master Document Studio, then bring the images here.' })} <Link to="/master-document-studio" className="font-semibold underline">Master Document Studio</Link></UploadNote>
      )}

      {running && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-xs text-orange-950">
          <span>{progress || t('digitize.preparing')}</span>
          <button type="button" onClick={() => cancel.current?.abort()} className="rounded-lg border border-orange-300 bg-white px-3 py-1.5 font-bold text-orange-800 hover:bg-orange-100">{t('digitize.cancel')}</button>
        </div>
      )}

      {result && <SaveResult href={result.url} name={result.name} label={result.zip ? 'Your searchable PDFs are ready (ZIP)' : 'Your searchable PDF is ready'} saveLabel={result.zip ? 'Save ZIP' : 'Save PDF'} />}

      {items.length > 0 && !result && (
        <button type="button" onClick={() => void make()} disabled={running || loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none">
          {running ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileText className="h-4 w-4" aria-hidden="true" />}
          <span>{running ? t('digitize.preparing') : t('digitize.create')}</span>
        </button>
      )}
      {result && <StartOverButton onClick={startOver}>Convert other images</StartOverButton>}
    </div>
  );
};

export default DigitizeTool;
