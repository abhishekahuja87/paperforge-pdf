import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FileUp } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Note } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { Slider, Toggle, card, heading } from '../paper/controls';
import { SignaturePad } from './SignaturePad';
import { saveBlob, whiteToTransparent } from '../../../lib/images/canvas';
import { fileToLogo, type Logo } from '../../../lib/paper/image';
import { generateFileName } from '../../../lib/pdf/naming';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
const MAX_BYTES = 40 * 1024 * 1024;

/** Place a drawn, typed or uploaded signature on a PDF page. Done in the browser; the file is never uploaded. */
export const SignPdf: React.FC = () => {
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  const [name, setName] = useState('');
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [sig, setSig] = useState<Logo | null>(null);
  const [source, setSource] = useState<'draw' | 'upload'>('draw');
  const [clean, setClean] = useState(true);
  const [uploaded, setUploaded] = useState<Logo | null>(null);
  const [pos, setPos] = useState({ x: 0.7, y: 0.85 });
  const [size, setSize] = useState(28);
  const [where, setWhere] = useState<'this' | 'all' | 'last'>('this');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState({ w: 1, h: 1 });

  const active = source === 'draw' ? sig : uploaded;

  const openFile = async (file: File | undefined) => {
    if (!file) return;
    setMessage('');
    if (file.size > MAX_BYTES) { setMessage('That file is over 40 MB. Compress it first, then sign.'); return; }
    try {
      const data = await file.arrayBuffer();
      const task = pdfjsLib.getDocument({ data: new Uint8Array(data.slice(0)) });
      const doc = await task.promise;
      setBytes(data); setName(file.name.replace(/\.pdf$/i, '')); setPages(doc.numPages); setPage(1);
      void task.destroy();
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
      setView({ w: el.width, h: el.height });
    } finally { void task.destroy(); }
  }, [bytes, page]);

  useEffect(() => { void render(); }, [render]);

  const place = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPos({ x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) });
  };

  const apply = async () => {
    if (!bytes || !active) return;
    setBusy(true); setMessage('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: false });
      const png = await doc.embedPng(active.src);
      const total = doc.getPageCount();
      const targets = where === 'all' ? Array.from({ length: total }, (_, i) => i) : where === 'last' ? [total - 1] : [Math.min(page, total) - 1];
      for (const index of targets) {
        const target = doc.getPage(index);
        const { width, height } = target.getSize();
        const w = (width * size) / 100;
        const h = w / active.ratio;
        target.drawImage(png, { x: Math.max(0, Math.min(width - w, pos.x * width - w / 2)), y: Math.max(0, Math.min(height - h, height - pos.y * height - h / 2)), width: w, height: h });
      }
      saveBlob(new Blob([(await doc.save()) as BlobPart], { type: 'application/pdf' }), generateFileName(`${name || 'document'}-signed`, 'pdf'));
    } catch {
      setMessage('Could not sign this PDF. If it is protected, unlock it first, then try again.');
    } finally { setBusy(false); }
  };

  const sigW = (size / 100) * view.w;
  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>1. Choose the PDF</h2>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          <FileUp className="h-4 w-4" aria-hidden="true" />{bytes ? 'Choose another PDF' : 'Choose a PDF'}
          <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => { void openFile(event.target.files?.[0]); event.target.value = ''; }} />
        </label>
        {name && <p className="text-xs text-slate-600">{name}.pdf · {pages} page{pages === 1 ? '' : 's'}</p>}
      </div>

      <div className={`${card} space-y-3`}>
        <h2 className={heading}>2. Your signature</h2>
        <ChoiceButtons label="Signature" value={source} onChange={(v) => setSource(v as 'draw' | 'upload')} options={[{ value: 'draw', label: 'Draw or type' }, { value: 'upload', label: 'Use a picture' }]} />
        {source === 'draw' ? <SignaturePad onChange={setSig} /> : (
          <div className="space-y-2">
            <input type="file" accept="image/*" aria-label="Choose a picture of your signature" className="block w-full text-xs" onChange={(event) => {
              const file = event.target.files?.[0]; event.target.value = '';
              if (!file) return;
              fileToLogo(file).then((logo) => (clean ? whiteToTransparent(logo.src) : logo)).then(setUploaded).catch(() => setMessage('Could not use that picture.'));
            }} />
            <Toggle label="Make the white paper see-through" checked={clean} onChange={setClean} hint="Turn on for a signature written on white paper and photographed. Choose the picture again after changing this." />
            {uploaded && <img src={uploaded.src} alt="Your signature" className="max-h-20 rounded border border-slate-200 bg-white p-1" />}
          </div>
        )}
      </div>

      {bytes && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>3. Place it</h2>
          <p className="text-[11px] text-slate-500">Tap or click on the page where the signature should go.</p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold text-slate-700">Page
              <select value={page} onChange={(event) => setPage(Number(event.target.value))} className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs">
                {Array.from({ length: pages }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
              </select>
            </label>
            <ChoiceButtons label="Sign" value={where} onChange={(v) => setWhere(v as 'this' | 'all' | 'last')} options={[{ value: 'this', label: 'This page' }, { value: 'last', label: 'Last page' }, { value: 'all', label: 'Every page' }]} />
          </div>
          <Slider label="Signature size (share of page width)" value={size} min={8} max={60} step={1} unit="%" onChange={setSize} />
          <div className="relative mx-auto w-full max-w-xl cursor-crosshair touch-none overflow-hidden rounded-lg border border-slate-300 bg-white" onPointerDown={place} onPointerMove={(event) => { if (event.buttons === 1) place(event); }}>
            <canvas ref={canvas} className="block h-auto w-full" />
            {active && <img src={active.src} alt="" aria-hidden="true" className="pointer-events-none absolute" style={{ width: `${size}%`, left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, transform: 'translate(-50%, -50%)', opacity: 0.95, maxWidth: sigW ? undefined : '100%' }} />}
          </div>
          <button type="button" disabled={!active || busy} onClick={() => void apply()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-50"><Download className="h-4 w-4" aria-hidden="true" />{busy ? 'Signing...' : 'Download signed PDF'}</button>
          {!active && <p className="text-[11px] text-slate-500">Add your signature in step 2 first.</p>}
        </div>
      )}
      {message && <p role="status" className="text-xs text-red-700">{message}</p>}
      <Note>Your PDF and signature stay in your browser and are never uploaded. This places a picture of your signature on the page; it is not a certified digital signature, so use it only where a plain signature image is accepted.</Note>
    </section>
  );
};

export default SignPdf;
