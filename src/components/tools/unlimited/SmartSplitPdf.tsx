import React, { useState } from 'react';
import { Download, FileUp } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Note } from '../../finance/ui';
import { ChoiceButtons, fieldClass } from '../utilities/common';
import { card, heading } from '../paper/controls';
import { saveBlob } from '../../../lib/images/canvas';
import { rangeLabel, rangesBySize, rangesEvery, rangesFromStarts, type PageRange } from '../../../lib/unlimited/split';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
type Mode = 'every' | 'blank' | 'bookmarks' | 'size';
interface Part extends PageRange { title: string }
const SENSITIVITY: Record<string, number> = { strict: 0.0005, normal: 0.003, loose: 0.01 };
const safeName = (text: string) => text.replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'part';
const tick = () => new Promise<void>((resolve) => window.setTimeout(resolve, 0));

/** Cut a PDF into parts by every N pages, at blank separator pages, at bookmarks, or to keep each part under a size. No limit on pages or file size beyond your device. */
export const SmartSplitPdf: React.FC = () => {
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  const [name, setName] = useState('');
  const [pages, setPages] = useState(0);
  const [mode, setMode] = useState<Mode>('every');
  const [every, setEvery] = useState('5');
  const [sensitivity, setSensitivity] = useState('normal');
  const [megabytes, setMegabytes] = useState('5');
  const [parts, setParts] = useState<Part[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [message, setMessage] = useState('');

  const openFile = async (file: File | undefined) => {
    if (!file) return;
    setMessage(''); setParts([]);
    try {
      const data = await file.arrayBuffer();
      const task = pdfjsLib.getDocument({ data: new Uint8Array(data.slice(0)) });
      const doc = await task.promise;
      setBytes(data); setName(file.name.replace(/\.pdf$/i, '')); setPages(doc.numPages);
      void task.destroy();
    } catch { setMessage('Could not open that PDF. If it has a password, unlock it first.'); }
  };

  const plan = async () => {
    if (!bytes) return;
    setBusy(true); setMessage(''); setParts([]); setProgress('');
    const task = pdfjsLib.getDocument({ data: new Uint8Array(bytes.slice(0)) });
    try {
      const doc = await task.promise;
      const total = doc.numPages;
      let result: Part[] = [];
      if (mode === 'every') {
        result = rangesEvery(total, Number(every) || 1).map((range) => ({ ...range, title: '' }));
      } else if (mode === 'blank') {
        const blanks = new Set<number>();
        for (let n = 1; n <= total; n += 1) {
          setProgress(`Looking at page ${n} of ${total}…`);
          const pdfPage = await doc.getPage(n);
          const base = pdfPage.getViewport({ scale: 1 });
          const viewport = pdfPage.getViewport({ scale: Math.min(0.4, 220 / base.width) });
          const surface = document.createElement('canvas');
          surface.width = Math.max(1, Math.floor(viewport.width)); surface.height = Math.max(1, Math.floor(viewport.height));
          const ctx = surface.getContext('2d', { willReadFrequently: true });
          if (!ctx) throw new Error('canvas');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, surface.width, surface.height);
          await pdfPage.render({ canvasContext: ctx, canvas: surface, viewport }).promise;
          const data = ctx.getImageData(0, 0, surface.width, surface.height).data;
          let ink = 0;
          for (let i = 0; i < data.length; i += 4) if (data[i]! + data[i + 1]! + data[i + 2]! < 3 * 235) ink += 1;
          if (ink / (surface.width * surface.height) < (SENSITIVITY[sensitivity] ?? 0.003)) blanks.add(n);
          pdfPage.cleanup();
          if (n % 5 === 0) await tick();
        }
        if (blanks.size === 0) { setMessage('No blank pages were found. Try Loose sensitivity if your separator pages carry a small mark.'); return; }
        result = rangesFromStarts(total, [...blanks].map((page) => page + 1), blanks).map((range) => ({ ...range, title: '' }));
        setMessage(`Found ${blanks.size} blank page${blanks.size === 1 ? '' : 's'} (${[...blanks].slice(0, 12).join(', ')}${blanks.size > 12 ? '…' : ''}). They are left out of the parts.`);
      } else if (mode === 'bookmarks') {
        const outline = await doc.getOutline();
        if (!outline || outline.length === 0) { setMessage('This PDF has no bookmarks. Choose another way to split.'); return; }
        const found: { page: number; title: string }[] = [];
        for (const item of outline) {
          try {
            const dest = typeof item.dest === 'string' ? await doc.getDestination(item.dest) : item.dest;
            const ref = dest?.[0];
            if (ref && typeof ref === 'object') found.push({ page: (await doc.getPageIndex(ref as { num: number; gen: number })) + 1, title: item.title });
          } catch { /* skip a bookmark that points nowhere */ }
        }
        if (found.length === 0) { setMessage('The bookmarks in this PDF do not point to pages, so it cannot be split by them.'); return; }
        const titles = new Map(found.map((entry) => [entry.page, entry.title]));
        result = rangesFromStarts(total, found.map((entry) => entry.page)).map((range) => ({ ...range, title: titles.get(range.from) ?? '' }));
      } else {
        const limit = Math.max(0.05, Number(megabytes) || 5) * 1024 * 1024;
        const { PDFDocument } = await import('pdf-lib');
        const source = await PDFDocument.load(bytes.slice(0));
        const sizes: number[] = [];
        for (let i = 0; i < total; i += 1) {
          setProgress(`Measuring page ${i + 1} of ${total}…`);
          const one = await PDFDocument.create();
          const [copy] = await one.copyPages(source, [i]);
          one.addPage(copy!);
          sizes.push((await one.save()).byteLength);
          if (i % 5 === 0) await tick();
        }
        result = rangesBySize(sizes, limit).map((range) => ({ ...range, title: '' }));
        setMessage('Sizes are estimates, because shared images and fonts are counted once per part. Each part is meant to stay under your limit and may come out smaller.');
      }
      if (result.length <= 1) { setMessage('That setting gives only one part, so there is nothing to split. Change the setting and try again.'); return; }
      setParts(result);
    } catch {
      setMessage('Could not read this PDF. If it is protected, unlock it first.');
    } finally { void task.destroy(); setBusy(false); setProgress(''); }
  };

  const download = async () => {
    if (!bytes || parts.length === 0) return;
    setBusy(true); setMessage('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const JSZip = (await import('jszip')).default;
      const source = await PDFDocument.load(bytes.slice(0));
      const zip = new JSZip();
      const width = String(parts.length).length;
      for (const [index, part] of parts.entries()) {
        setProgress(`Making part ${index + 1} of ${parts.length}…`);
        const out = await PDFDocument.create();
        const copies = await out.copyPages(source, Array.from({ length: part.to - part.from + 1 }, (_, i) => part.from - 1 + i));
        copies.forEach((copy) => out.addPage(copy));
        const label = part.title ? safeName(part.title) : `pages ${part.from}-${part.to}`;
        zip.file(`${String(index + 1).padStart(width, '0')} ${label}.pdf`, await out.save());
        if (index % 3 === 0) await tick();
      }
      saveBlob(await zip.generateAsync({ type: 'blob' }), `${safeName(name || 'document')}-split.zip`);
      setMessage(`Saved a ZIP with ${parts.length} PDFs.`);
    } catch { setMessage('Could not make the parts. For a very large PDF, close other tabs and try again.'); }
    finally { setBusy(false); setProgress(''); }
  };

  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>1. Choose the PDF</h2>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          <FileUp className="h-4 w-4" aria-hidden="true" />{bytes ? 'Choose another PDF' : 'Choose a PDF'}
          <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => { void openFile(event.target.files?.[0]); event.target.value = ''; }} />
        </label>
        {name && <p className="text-xs text-slate-600">{name}.pdf · {pages} page{pages === 1 ? '' : 's'}</p>}
        <p className="text-[11px] text-slate-500">Free, no sign-up, no page or file limit. Your PDF stays on your device.</p>
      </div>

      {bytes && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>2. How to split</h2>
          <ChoiceButtons label="Split" value={mode} onChange={(value) => { setMode(value as Mode); setParts([]); setMessage(''); }} options={[{ value: 'every', label: 'Every N pages' }, { value: 'blank', label: 'At blank pages' }, { value: 'bookmarks', label: 'At bookmarks' }, { value: 'size', label: 'By file size' }]} />
          {mode === 'every' && <label className="block text-xs font-semibold text-slate-700">Pages in each part<input type="number" min={1} value={every} onChange={(event) => setEvery(event.target.value)} className={`${fieldClass} w-28`} /></label>}
          {mode === 'blank' && (
            <>
              <p className="text-xs text-slate-600">A new part starts after each blank page, and the blank pages are left out. Good for batches scanned with a blank sheet between documents.</p>
              <ChoiceButtons label="Blank means" value={sensitivity} onChange={setSensitivity} options={[{ value: 'strict', label: 'Completely empty' }, { value: 'normal', label: 'Almost empty' }, { value: 'loose', label: 'Faint marks allowed' }]} />
            </>
          )}
          {mode === 'bookmarks' && <p className="text-xs text-slate-600">A new part starts at each top-level bookmark, and each file is named after its bookmark.</p>}
          {mode === 'size' && <label className="block text-xs font-semibold text-slate-700">Largest part (MB)<input type="number" min={0.05} step={0.5} value={megabytes} onChange={(event) => setMegabytes(event.target.value)} className={`${fieldClass} w-28`} /></label>}
          <button type="button" disabled={busy} onClick={() => void plan()} className="inline-flex min-h-11 items-center rounded-xl border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-900 disabled:opacity-50">{busy && progress ? progress : 'Show the parts'}</button>
        </div>
      )}

      {parts.length > 0 && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>3. {parts.length} parts</h2>
          <ol className="max-h-72 space-y-1 overflow-auto text-xs text-slate-700">
            {parts.map((part, index) => <li key={`${part.from}-${part.to}`} className="rounded-lg border border-slate-200 px-3 py-1.5">Part {index + 1}: {part.title ? `${part.title} (${rangeLabel(part)})` : rangeLabel(part)}</li>)}
          </ol>
          <button type="button" disabled={busy} onClick={() => void download()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-50"><Download className="h-4 w-4" aria-hidden="true" />{busy && progress ? progress : 'Download all parts (ZIP)'}</button>
        </div>
      )}
      {message && <Note>{message}</Note>}
    </section>
  );
};

export default SmartSplitPdf;
