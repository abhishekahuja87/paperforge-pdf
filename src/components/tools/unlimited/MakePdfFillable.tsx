import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FileUp, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Note } from '../../finance/ui';
import { ChoiceButtons, fieldClass } from '../utilities/common';
import { Toggle, card, heading } from '../paper/controls';
import { saveBlob } from '../../../lib/images/canvas';
import { generateFileName } from '../../../lib/pdf/naming';
import { displayRectToPage, displaySize, normRotation } from '../../../lib/unlimited/geometry';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

type Kind = 'text' | 'check' | 'choice';
/** One field to add, as fractions (0 to 1) of the page as displayed. */
interface FieldSpec { id: number; page: number; kind: Kind; name: string; options: string; multiline: boolean; x: number; y: number; w: number; h: number }
const KIND_LABEL: Record<Kind, string> = { text: 'Text box', check: 'Tick box', choice: 'Drop-down list' };

/** Turn any PDF into a fillable form: draw text boxes, tick boxes and drop-down lists on the page. Done in your browser; no limit on pages or file size beyond your device. */
export const MakePdfFillable: React.FC = () => {
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  const [name, setName] = useState('');
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState<Kind>('text');
  const [fields, setFields] = useState<FieldSpec[]>([]);
  const [pageWidth, setPageWidth] = useState(595);
  const [draft, setDraft] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null);
  const nextId = useRef(1);

  const openFile = async (file: File | undefined) => {
    if (!file) return;
    setMessage('');
    try {
      const data = await file.arrayBuffer();
      const task = pdfjsLib.getDocument({ data: new Uint8Array(data.slice(0)) });
      const doc = await task.promise;
      setBytes(data); setName(file.name.replace(/\.pdf$/i, '')); setPages(doc.numPages); setPage(1); setFields([]);
      void task.destroy();
    } catch { setMessage('Could not open that PDF. If it has a password, unlock it first.'); }
  };

  const render = useCallback(async () => {
    const el = canvas.current;
    if (!bytes || !el) return;
    const task = pdfjsLib.getDocument({ data: new Uint8Array(bytes.slice(0)) });
    try {
      const doc = await task.promise;
      const pdfPage = await doc.getPage(Math.min(page, doc.numPages));
      const base = pdfPage.getViewport({ scale: 1 });
      const viewport = pdfPage.getViewport({ scale: Math.min(2, 900 / base.width) });
      el.width = Math.floor(viewport.width); el.height = Math.floor(viewport.height);
      const ctx = el.getContext('2d');
      if (!ctx) return;
      await pdfPage.render({ canvasContext: ctx, canvas: el, viewport }).promise;
      setPageWidth(base.width);
    } finally { void task.destroy(); }
  }, [bytes, page]);
  useEffect(() => { void render(); }, [render]);

  const point = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) };
  };
  const down = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const at = point(event);
    setDraft({ x0: at.x, y0: at.y, x1: at.x, y1: at.y });
  };
  const move = (event: React.PointerEvent<HTMLDivElement>) => { if (draft) { const at = point(event); setDraft({ ...draft, x1: at.x, y1: at.y }); } };
  const up = () => {
    if (!draft) return;
    let x = Math.min(draft.x0, draft.x1); let y = Math.min(draft.y0, draft.y1);
    let w = Math.abs(draft.x1 - draft.x0); let h = Math.abs(draft.y1 - draft.y0);
    setDraft(null);
    if (kind === 'check') {
      const side = Math.max(w, 18 / pageWidth);
      x = Math.min(x, 1 - side); y = Math.max(0, y); w = side; h = side * (canvas.current ? canvas.current.width / canvas.current.height : 0.7);
    } else if (w < 0.03 || h < 0.008) { setMessage('Drag across the page to draw the box.'); return; }
    setMessage('');
    const id = nextId.current; nextId.current += 1;
    const count = fields.filter((field) => field.kind === kind).length + 1;
    setFields((list) => [...list, { id, page, kind, name: `${kind === 'text' ? 'Text' : kind === 'check' ? 'Check' : 'Choice'}${count}`, options: 'Yes, No', multiline: false, x, y, w, h }]);
  };

  const patch = (id: number, change: Partial<FieldSpec>) => setFields((list) => list.map((field) => (field.id === id ? { ...field, ...change } : field)));

  const save = async () => {
    if (!bytes || fields.length === 0) return;
    const names = fields.map((field) => field.name.trim());
    if (names.some((value) => !value)) { setMessage('Give every field a name.'); return; }
    if (new Set(names).size !== names.length) { setMessage('Two fields share a name. Each field needs its own name, so change one of them.'); return; }
    setBusy(true); setMessage('');
    try {
      const { PDFDocument, StandardFonts, degrees, rgb } = await import('pdf-lib');
      const doc = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: false });
      const form = doc.getForm();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      for (const spec of fields) {
        const target = doc.getPage(Math.min(spec.page, doc.getPageCount()) - 1);
        const { width, height } = target.getSize();
        const rotation = normRotation(target.getRotation().angle);
        const shown = displaySize(rotation, width, height);
        const rect = displayRectToPage(rotation, width, height, spec.x * shown.w, spec.y * shown.h, spec.w * shown.w, spec.h * shown.h);
        const look = { ...rect, borderWidth: 1, borderColor: rgb(0.25, 0.25, 0.3), backgroundColor: rgb(0.95, 0.97, 1), ...(rotation ? { rotate: degrees(rotation) } : {}) };
        const fieldName = spec.name.trim();
        if (spec.kind === 'text') {
          const field = form.createTextField(fieldName);
          if (spec.multiline) field.enableMultiline();
          field.setFontSize(spec.multiline ? 11 : Math.max(6, Math.min(12, rect.height * 0.7)));
          field.addToPage(target, { ...look, font });
        } else if (spec.kind === 'check') {
          form.createCheckBox(fieldName).addToPage(target, look);
        } else {
          const field = form.createDropdown(fieldName);
          field.addOptions(spec.options.split(',').map((option) => option.trim()).filter(Boolean));
          field.addToPage(target, { ...look, font });
        }
      }
      saveBlob(new Blob([(await doc.save()) as BlobPart], { type: 'application/pdf' }), generateFileName(`${name || 'document'}-fillable`, 'pdf'));
      setMessage('Saved. Open the file in a PDF viewer to type in the boxes, or use the Fill PDF tool.');
    } catch {
      setMessage('Could not add the fields. If the PDF is protected, unlock it first. Field names should be plain letters and digits, and a drop-down needs at least one option.');
    } finally { setBusy(false); }
  };

  const here = fields.filter((field) => field.page === page);
  const shown = draft ? { x: Math.min(draft.x0, draft.x1), y: Math.min(draft.y0, draft.y1), w: Math.abs(draft.x1 - draft.x0), h: Math.abs(draft.y1 - draft.y0) } : null;
  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>1. Choose the PDF</h2>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          <FileUp className="h-4 w-4" aria-hidden="true" />{bytes ? 'Choose another PDF' : 'Choose a PDF'}
          <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => { void openFile(event.target.files?.[0]); event.target.value = ''; }} />
        </label>
        {name && <p className="text-xs text-slate-600">{name}.pdf · {pages} page{pages === 1 ? '' : 's'}</p>}
        <p className="text-[11px] text-slate-500">Draw fields on any page, then download the fillable PDF.</p>
      </div>

      {bytes && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>2. Draw the fields</h2>
          <ChoiceButtons label="Add a" value={kind} onChange={(value) => setKind(value as Kind)} options={(['text', 'check', 'choice'] as Kind[]).map((value) => ({ value, label: KIND_LABEL[value] }))} />
          <p className="text-xs text-slate-600">{kind === 'check' ? 'Tap the page where the tick box should go.' : 'Drag across the page to draw the box.'}</p>
          <label className="text-xs font-semibold text-slate-700">Page
            <select value={page} onChange={(event) => setPage(Number(event.target.value))} className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs">
              {Array.from({ length: pages }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
            </select>
          </label>
          <div className="relative mx-auto w-full max-w-xl cursor-crosshair touch-none select-none overflow-hidden rounded-lg border border-slate-300 bg-white" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => setDraft(null)}>
            <canvas ref={canvas} className="block h-auto w-full" />
            {here.map((field) => <div key={field.id} className="absolute border border-sky-700 bg-sky-100/60" style={{ left: `${field.x * 100}%`, top: `${field.y * 100}%`, width: `${field.w * 100}%`, height: `${field.h * 100}%` }} />)}
            {shown && <div className="absolute border-2 border-orange-600 bg-orange-200/40" style={{ left: `${shown.x * 100}%`, top: `${shown.y * 100}%`, width: `${shown.w * 100}%`, height: `${shown.h * 100}%` }} />}
          </div>
        </div>
      )}

      {fields.length > 0 && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>3. Name them and download</h2>
          <ul className="space-y-2">
            {fields.map((field) => (
              <li key={field.id} className="space-y-2 rounded-lg border border-slate-200 p-3">
                <div className="flex items-end gap-2">
                  <label className="min-w-0 flex-1 text-xs font-semibold text-slate-700">{KIND_LABEL[field.kind]} on page {field.page}
                    <input value={field.name} maxLength={60} onChange={(event) => patch(field.id, { name: event.target.value })} className={fieldClass} />
                  </label>
                  <button type="button" onClick={() => setFields((list) => list.filter((item) => item.id !== field.id))} aria-label={`Remove ${field.name}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                </div>
                {field.kind === 'text' && <Toggle label="Allow several lines" checked={field.multiline} onChange={(multiline) => patch(field.id, { multiline })} />}
                {field.kind === 'choice' && (
                  <label className="block text-xs font-semibold text-slate-700">Choices, separated by commas
                    <input value={field.options} onChange={(event) => patch(field.id, { options: event.target.value })} className={fieldClass} />
                  </label>
                )}
              </li>
            ))}
          </ul>
          <button type="button" disabled={busy} onClick={() => void save()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-50"><Download className="h-4 w-4" aria-hidden="true" />{busy ? 'Saving…' : 'Download fillable PDF'}</button>
          <p className="text-[11px] text-slate-500">Then fill it in with <Link to="/fill-pdf" className="font-semibold text-orange-800 underline">Fill PDF</Link>, or send it to someone to fill in.</p>
        </div>
      )}
      {message && <Note>{message}</Note>}
    </section>
  );
};

export default MakePdfFillable;
