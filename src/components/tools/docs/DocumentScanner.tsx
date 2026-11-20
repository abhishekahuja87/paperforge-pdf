import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Camera, Download, ImagePlus, RotateCcw, RotateCw, Trash2 } from 'lucide-react';
import { Note } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { Slider, card, heading } from '../paper/controls';
import { canvasToBlob, loadBitmap, saveBlob } from '../../../lib/images/canvas';
import { FILTERS, renderScan, type ScanFilter, type ScanPage } from '../../../lib/images/scan';
import { generateFileName } from '../../../lib/pdf/naming';

const MAX_PAGES = 30;
const A4 = { w: 595.28, h: 841.89 };
const blankCrop = { top: 0, right: 0, bottom: 0, left: 0 };

/** Photograph or choose pages, straighten and clean them, and save one PDF. Everything is done in the browser. */
export const DocumentScanner: React.FC = () => {
  const [pages, setPages] = useState<ScanPage[]>([]);
  const [current, setCurrent] = useState(0);
  const [size, setSize] = useState<'a4' | 'fit'>('a4');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const preview = useRef<HTMLCanvasElement>(null);
  const page = pages[Math.min(current, pages.length - 1)];

  const add = async (files: FileList | null) => {
    if (!files) return;
    setMessage('');
    const next: ScanPage[] = [];
    for (const file of Array.from(files)) {
      if (pages.length + next.length >= MAX_PAGES) { setMessage(`Up to ${MAX_PAGES} pages at a time.`); break; }
      if (file.size > 30 * 1024 * 1024) { setMessage('One picture was over 30 MB and was skipped.'); continue; }
      try { next.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, bitmap: await loadBitmap(file), rotate: 0, crop: { ...blankCrop }, filter: 'clean' }); } catch { setMessage('One file could not be read as a picture.'); }
    }
    if (next.length) { setPages((all) => [...all, ...next]); setCurrent(pages.length); }
  };

  const update = (patch: Partial<ScanPage>) => setPages((all) => all.map((item, i) => (i === Math.min(current, all.length - 1) ? { ...item, ...patch } : item)));

  useEffect(() => {
    const el = preview.current;
    if (!el || !page) return;
    const out = renderScan(page, 900);
    el.width = out.width; el.height = out.height;
    el.getContext('2d')?.drawImage(out, 0, 0);
  }, [page]);

  const thumbs = useMemo(() => pages.map((item) => { const c = renderScan({ ...item, filter: 'original' }, 120); return c.toDataURL('image/jpeg', 0.6); }), [pages.map((p) => `${p.id}${p.rotate}${JSON.stringify(p.crop)}`).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  const savePdf = async () => {
    setBusy(true); setMessage('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      for (const item of pages) {
        const canvas = renderScan(item, item.filter === 'bw' ? 2200 : 1900);
        const jpg = await doc.embedJpg(new Uint8Array(await (await canvasToBlob(canvas, 'image/jpeg', 0.82)).arrayBuffer()));
        if (size === 'fit') { const sheet = doc.addPage([canvas.width * 0.75, canvas.height * 0.75]); sheet.drawImage(jpg, { x: 0, y: 0, width: sheet.getWidth(), height: sheet.getHeight() }); continue; }
        const landscape = canvas.width > canvas.height * 1.15;
        const pw = landscape ? A4.h : A4.w; const ph = landscape ? A4.w : A4.h;
        const sheet = doc.addPage([pw, ph]);
        const fit = Math.min((pw - 24) / canvas.width, (ph - 24) / canvas.height);
        sheet.drawImage(jpg, { x: (pw - canvas.width * fit) / 2, y: (ph - canvas.height * fit) / 2, width: canvas.width * fit, height: canvas.height * fit });
      }
      doc.setTitle('Scanned document'); doc.setCreator('MyDailyUtils');
      saveBlob(new Blob([(await doc.save()) as BlobPart], { type: 'application/pdf' }), generateFileName('scan', 'pdf'));
    } catch {
      setMessage('Could not build the PDF. Try fewer or smaller pictures.');
    } finally { setBusy(false); }
  };

  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>1. Add pages</h2>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800">
            <Camera className="h-4 w-4" aria-hidden="true" />Take a photo
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => { void add(event.target.files); event.target.value = ''; }} />
          </label>
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            <ImagePlus className="h-4 w-4" aria-hidden="true" />Choose pictures
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => { void add(event.target.files); event.target.value = ''; }} />
          </label>
        </div>
        <p className="text-[11px] text-slate-500">Lay the page flat in good light and fill the frame. Take one photo per page; add more at any time.</p>
        {pages.length > 0 && (
          <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Pages">
            {pages.map((item, i) => (
              <li key={item.id}><button type="button" aria-pressed={i === current} aria-label={`Page ${i + 1}`} onClick={() => setCurrent(i)} className={`block rounded-lg border-2 p-0.5 ${i === current ? 'border-orange-500' : 'border-slate-200'}`}><img src={thumbs[i]} alt="" className="h-20 w-auto rounded" /><span className="block text-center text-[10px] text-slate-600">{i + 1}</span></button></li>
            ))}
          </ul>
        )}
      </div>

      {page && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>2. Clean up page {Math.min(current, pages.length - 1) + 1}</h2>
          <div className="mx-auto max-w-xl overflow-hidden rounded-lg border border-slate-300 bg-slate-100"><canvas ref={preview} className="block h-auto max-h-[60vh] w-full object-contain" /></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => update({ rotate: (((page.rotate + 270) % 360) as ScanPage['rotate']) })} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold"><RotateCcw className="h-4 w-4" aria-hidden="true" />Turn left</button>
            <button type="button" onClick={() => update({ rotate: (((page.rotate + 90) % 360) as ScanPage['rotate']) })} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold"><RotateCw className="h-4 w-4" aria-hidden="true" />Turn right</button>
            <button type="button" disabled={current === 0} onClick={() => { setPages((all) => { const next = [...all]; const [m] = next.splice(current, 1); next.splice(current - 1, 0, m!); return next; }); setCurrent(current - 1); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold disabled:opacity-40"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Earlier</button>
            <button type="button" disabled={current >= pages.length - 1} onClick={() => { setPages((all) => { const next = [...all]; const [m] = next.splice(current, 1); next.splice(current + 1, 0, m!); return next; }); setCurrent(current + 1); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold disabled:opacity-40"><ArrowRight className="h-4 w-4" aria-hidden="true" />Later</button>
            <button type="button" onClick={() => { setPages((all) => all.filter((_, i) => i !== current)); setCurrent((c) => Math.max(0, c - 1)); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-800"><Trash2 className="h-4 w-4" aria-hidden="true" />Remove</button>
          </div>
          <ChoiceButtons label="Look" value={page.filter} onChange={(value) => update({ filter: value as ScanFilter })} options={FILTERS.map((f) => ({ value: f.value, label: f.label }))} />
          <p className="text-[11px] text-slate-500">{FILTERS.find((f) => f.value === page.filter)?.hint}. Black and white is best for text pages; keep colour for photos and stamps.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Slider label="Trim top" value={page.crop.top} min={0} max={40} step={1} unit="%" onChange={(top) => update({ crop: { ...page.crop, top } })} />
            <Slider label="Trim bottom" value={page.crop.bottom} min={0} max={40} step={1} unit="%" onChange={(bottom) => update({ crop: { ...page.crop, bottom } })} />
            <Slider label="Trim left" value={page.crop.left} min={0} max={40} step={1} unit="%" onChange={(left) => update({ crop: { ...page.crop, left } })} />
            <Slider label="Trim right" value={page.crop.right} min={0} max={40} step={1} unit="%" onChange={(right) => update({ crop: { ...page.crop, right } })} />
          </div>
        </div>
      )}

      {pages.length > 0 && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>3. Save</h2>
          <ChoiceButtons label="Page size" value={size} onChange={(v) => setSize(v as 'a4' | 'fit')} options={[{ value: 'a4', label: 'A4 pages' }, { value: 'fit', label: 'Same size as the picture' }]} />
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => void savePdf()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-60"><Download className="h-4 w-4" aria-hidden="true" />{busy ? 'Building...' : `Download PDF (${pages.length} page${pages.length === 1 ? '' : 's'})`}</button>
            <button type="button" onClick={async () => { if (page) saveBlob(await canvasToBlob(renderScan(page, 2400), 'image/jpeg', 0.88), generateFileName('scan-page', 'jpg')); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800">This page as a picture</button>
          </div>
        </div>
      )}
      {message && <p role="status" className="text-xs text-slate-700">{message}</p>}
      <Note>Your pictures are processed in your browser and are never uploaded. The clean-up lifts shadows and whitens paper; it does not read the text (use Scan to Searchable PDF for that). Check the result before you send an important document.</Note>
    </section>
  );
};

export default DocumentScanner;
