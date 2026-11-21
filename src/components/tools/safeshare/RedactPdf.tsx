import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FileUp, Search, Trash2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Note } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { Toggle, card, heading } from '../paper/controls';
import { saveBlob, canvasToBlob, makeCanvas } from '../../../lib/images/canvas';
import { generateFileName } from '../../../lib/pdf/naming';
import { safeRenderScale } from '../../../lib/pdf/renderScale';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/** A black box on one page, as fractions (0 to 1) of the page width and height so it works at any zoom. */
interface Box { id: number; page: number; x: number; y: number; w: number; h: number }
type Matrix = number[];
const multiply = (m1: Matrix, m2: Matrix): Matrix => [
  m1[0]! * m2[0]! + m1[2]! * m2[1]!, m1[1]! * m2[0]! + m1[3]! * m2[1]!,
  m1[0]! * m2[2]! + m1[2]! * m2[3]!, m1[1]! * m2[2]! + m1[3]! * m2[3]!,
  m1[0]! * m2[4]! + m1[2]! * m2[5]! + m1[4]!, m1[1]! * m2[4]! + m1[3]! * m2[5]! + m1[5]!,
];

/** Black out names, numbers and addresses in a PDF so they are really gone, not just covered. Done in your browser. */
export const RedactPdf: React.FC = () => {
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  const [name, setName] = useState('');
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [mode, setMode] = useState<'draw' | 'scroll'>('draw');
  const [term, setTerm] = useState('');
  const [keepText, setKeepText] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const nextId = useRef(1);

  const openFile = async (file: File | undefined) => {
    if (!file) return;
    setMessage('');
    try {
      const data = await file.arrayBuffer();
      const task = pdfjsLib.getDocument({ data: new Uint8Array(data.slice(0)) });
      const doc = await task.promise;
      const count = doc.numPages;
      void task.destroy();
      setBytes(data); setName(file.name.replace(/\.pdf$/i, '')); setPages(count); setPage(1); setBoxes([]);
    } catch {
      setMessage('Could not open that PDF. If it has a password, unlock it first.');
    }
  };

  const render = useCallback(async () => {
    const el = canvas.current;
    if (!bytes || !el) return;
    const task = pdfjsLib.getDocument({ data: new Uint8Array(bytes.slice(0)) });
    const doc = await task.promise;
    try {
      const pdfPage = await doc.getPage(Math.min(page, doc.numPages));
      const base = pdfPage.getViewport({ scale: 1 });
      const viewport = pdfPage.getViewport({ scale: Math.min(2, 900 / base.width) });
      el.width = Math.floor(viewport.width); el.height = Math.floor(viewport.height);
      const ctx = el.getContext('2d');
      if (!ctx) return;
      await pdfPage.render({ canvasContext: ctx, canvas: el, viewport }).promise;
    } finally { void task.destroy(); }
  }, [bytes, page]);
  useEffect(() => { void render(); }, [render]);

  const point = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) };
  };
  const down = (event: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== 'draw') return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const at = point(event);
    setDraft({ x0: at.x, y0: at.y, x1: at.x, y1: at.y });
  };
  const moveTo = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draft) return;
    const at = point(event);
    setDraft({ ...draft, x1: at.x, y1: at.y });
  };
  const up = () => {
    if (!draft) return;
    const x = Math.min(draft.x0, draft.x1); const y = Math.min(draft.y0, draft.y1);
    const w = Math.abs(draft.x1 - draft.x0); const h = Math.abs(draft.y1 - draft.y0);
    setDraft(null);
    if (w < 0.01 || h < 0.004) return;
    const id = nextId.current; nextId.current += 1;
    setBoxes((list) => [...list, { id, page, x, y, w, h }]);
  };

  const findText = async () => {
    const wanted = term.trim().toLowerCase();
    if (!bytes || wanted.length < 2) { setMessage('Type at least two characters of the word or number to find.'); return; }
    setBusy(true); setMessage('');
    const task = pdfjsLib.getDocument({ data: new Uint8Array(bytes.slice(0)) });
    try {
      const doc = await task.promise;
      const found: Box[] = [];
      for (let n = 1; n <= doc.numPages; n += 1) {
        const pdfPage = await doc.getPage(n);
        const viewport = pdfPage.getViewport({ scale: 1 });
        const content = await pdfPage.getTextContent();
        for (const item of content.items) {
          const piece = item as { str?: string; transform?: number[]; width?: number };
          if (!piece.str || !piece.transform || !piece.width) continue;
          const lower = piece.str.toLowerCase();
          let from = lower.indexOf(wanted);
          while (from !== -1) {
            const t = multiply(viewport.transform as Matrix, piece.transform);
            const fontHeight = Math.hypot(t[2]!, t[3]!) || 10;
            const per = piece.width / piece.str.length;
            const left = t[4]! + per * from;
            const id = nextId.current; nextId.current += 1;
            found.push({ id, page: n, x: Math.max(0, (left - 1.5) / viewport.width), y: Math.max(0, (t[5]! - fontHeight * 0.95) / viewport.height), w: Math.min(1, (per * wanted.length + 3) / viewport.width), h: Math.min(1, (fontHeight * 1.25) / viewport.height) });
            from = lower.indexOf(wanted, from + wanted.length);
          }
        }
        pdfPage.cleanup();
      }
      if (found.length === 0) setMessage('Nothing found. If this is a scanned page there is no text to search: draw the boxes by hand. A word split across two lines also needs a hand-drawn box.');
      else { setBoxes((list) => [...list, ...found]); setMessage(`Added ${found.length} black box${found.length === 1 ? '' : 'es'}. Look at every page to check each one covers what it should.`); }
    } catch { setMessage('Could not search this PDF.'); } finally { void task.destroy(); setBusy(false); }
  };

  const save = async () => {
    if (!bytes || boxes.length === 0) return;
    setBusy(true); setMessage('');
    const task = pdfjsLib.getDocument({ data: new Uint8Array(bytes.slice(0)) });
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await task.promise;
      const out = await PDFDocument.create();
      const source = keepText ? await PDFDocument.load(bytes.slice(0), { ignoreEncryption: false }) : null;
      for (let n = 1; n <= doc.numPages; n += 1) {
        const mine = boxes.filter((box) => box.page === n);
        if (mine.length === 0 && source) { const [copy] = await out.copyPages(source, [n - 1]); out.addPage(copy!); continue; }
        const pdfPage = await doc.getPage(n);
        const base = pdfPage.getViewport({ scale: 1 });
        const viewport = pdfPage.getViewport({ scale: safeRenderScale(pdfPage, 2) });
        const surface = makeCanvas(viewport.width, viewport.height);
        const ctx = surface.getContext('2d');
        if (!ctx) throw new Error('canvas');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, surface.width, surface.height);
        await pdfPage.render({ canvasContext: ctx, canvas: surface, viewport }).promise;
        ctx.fillStyle = '#000000';
        for (const box of mine) ctx.fillRect(box.x * surface.width, box.y * surface.height, box.w * surface.width, box.h * surface.height);
        const jpg = await out.embedJpg(await (await canvasToBlob(surface, 'image/jpeg', 0.88)).arrayBuffer());
        const target = out.addPage([base.width, base.height]);
        target.drawImage(jpg, { x: 0, y: 0, width: base.width, height: base.height });
        pdfPage.cleanup();
      }
      out.setTitle(''); out.setAuthor(''); out.setSubject(''); out.setKeywords([]); out.setProducer(''); out.setCreator('');
      saveBlob(new Blob([(await out.save()) as BlobPart], { type: 'application/pdf' }), generateFileName(`${name || 'document'}-redacted`, 'pdf'));
      setMessage('Saved. Pages with black boxes are now pictures, so the covered text is gone for good. Open the file and try to select text under a box to check.');
    } catch {
      setMessage('Could not make the redacted PDF. If the file is protected, unlock it first. A very large PDF may need more memory than your device has: split it with Smart Split PDF and try again.');
    } finally { void task.destroy(); setBusy(false); }
  };

  const here = boxes.filter((box) => box.page === page);
  const shown = draft ? { x: Math.min(draft.x0, draft.x1), y: Math.min(draft.y0, draft.y1), w: Math.abs(draft.x1 - draft.x0), h: Math.abs(draft.y1 - draft.y0) } : null;
  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>1. Choose the PDF</h2>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          <FileUp className="h-4 w-4" aria-hidden="true" />{bytes ? 'Choose another PDF' : 'Choose a PDF'}
          <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => { void openFile(event.target.files?.[0]); event.target.value = ''; }} />
        </label>
        <p className="text-[11px] text-slate-500">Your file stays on your device. Nothing is uploaded.</p>
      </div>

      {bytes && (
        <>
          <div className={`${card} space-y-3`}>
            <h2 className={heading}>2. Black out what must stay private</h2>
            <label className="block text-xs font-semibold text-slate-700">Find a word or number on every page
              <span className="mt-1.5 flex gap-2">
                <input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="for example an account number or a name" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900" />
                <button type="button" disabled={busy} onClick={() => void findText()} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"><Search className="h-4 w-4" aria-hidden="true" />Find and cover</button>
              </span>
            </label>
            <p className="text-xs text-slate-600">Or draw a box on the page below with your finger or mouse. Choose Scroll to move the page.</p>
            <ChoiceButtons label="Touch does" value={mode} onChange={(value) => setMode(value as 'draw' | 'scroll')} options={[{ value: 'draw', label: 'Draw boxes' }, { value: 'scroll', label: 'Scroll' }]} />
            <div className="flex items-center justify-between gap-2 text-xs">
              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 font-semibold disabled:opacity-40">Previous</button>
              <span className="font-semibold text-slate-700">Page {page} of {pages}</span>
              <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 font-semibold disabled:opacity-40">Next</button>
            </div>
            <div className="relative mx-auto w-full max-w-[900px] overflow-hidden rounded-lg border border-slate-300 bg-white">
              <canvas ref={canvas} className="block h-auto w-full" />
              <div className={`absolute inset-0 ${mode === 'draw' ? 'cursor-crosshair touch-none' : ''}`} onPointerDown={down} onPointerMove={moveTo} onPointerUp={up} onPointerCancel={() => setDraft(null)}>
                {here.map((box) => <div key={box.id} className="absolute bg-black" style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.w * 100}%`, height: `${box.h * 100}%` }} />)}
                {shown && <div className="absolute border-2 border-orange-600 bg-black/60" style={{ left: `${shown.x * 100}%`, top: `${shown.y * 100}%`, width: `${shown.w * 100}%`, height: `${shown.h * 100}%` }} />}
              </div>
            </div>
            {here.length > 0 && (
              <ul className="space-y-1.5">
                {here.map((box, index) => (
                  <li key={box.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700">
                    <span>Black box {index + 1} on this page</span>
                    <button type="button" onClick={() => setBoxes((list) => list.filter((item) => item.id !== box.id))} className="inline-flex min-h-9 items-center gap-1 font-semibold text-red-700" aria-label={`Remove black box ${index + 1}`}><Trash2 className="h-4 w-4" aria-hidden="true" />Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={`${card} space-y-3`}>
            <h2 className={heading}>3. Download</h2>
            <Toggle label="Keep other pages as normal text" hint="Pages without black boxes stay searchable and sharp. Turn off to turn every page into a picture." checked={keepText} onChange={setKeepText} />
            <p className="text-xs text-slate-600">{boxes.length} black box{boxes.length === 1 ? '' : 'es'} on {new Set(boxes.map((box) => box.page)).size} page{new Set(boxes.map((box) => box.page)).size === 1 ? '' : 's'}.</p>
            <button type="button" disabled={busy || boxes.length === 0} onClick={() => void save()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-5 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-50"><Download className="h-4 w-4" aria-hidden="true" />{busy ? 'Working…' : 'Download redacted PDF'}</button>
          </div>
        </>
      )}
      {message && <Note>{message}</Note>}
    </section>
  );
};

export default RedactPdf;
