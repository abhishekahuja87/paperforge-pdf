import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, Download, FileUp, Trash2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Note } from '../../finance/ui';
import { ChoiceButtons, fieldClass } from '../utilities/common';
import { Slider, Toggle, card, heading } from '../paper/controls';
import { saveBlob } from '../../../lib/images/canvas';
import { generateFileName } from '../../../lib/pdf/naming';
import { applyFormFields, readFormFields, type FieldEntry, type FormFieldInfo } from '../../../lib/toolkit/formFields';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

type Mode = 'text' | 'tick' | 'cross';
interface Item { id: number; page: number; kind: Mode; text: string; x: number; y: number; size: number; color: string }
const COLORS = { black: '#111111', blue: '#1d4ed8', red: '#b91c1c' } as const;
const SUPPORTED = /^[\x20-\x7E\xA0-\xFF]*$/;
const todayText = () => { const d = new Date(); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };
const hexToRgb = (hex: string): [number, number, number] => [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];

/** Type text, ticks and crosses onto any PDF page: forms, applications, declarations. Done in the browser; the file is never uploaded. */
export const FillPdf: React.FC = () => {
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  const [name, setName] = useState('');
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<Mode>('text');
  const [text, setText] = useState('');
  const [size, setSize] = useState(12);
  const [color, setColor] = useState<keyof typeof COLORS>('black');
  const [items, setItems] = useState<Item[]>([]);
  const [fields, setFields] = useState<FormFieldInfo[]>([]);
  const [entries, setEntries] = useState<Record<string, FieldEntry>>({});
  const [flatten, setFlatten] = useState(true);
  const [pageWidth, setPageWidth] = useState(595);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef<number | null>(null);
  const nextId = useRef(1);
  const [view, setView] = useState({ w: 1, h: 1 });

  const openFile = async (file: File | undefined) => {
    if (!file) return;
    setMessage('');
    try {
      const data = await file.arrayBuffer();
      const task = pdfjsLib.getDocument({ data: new Uint8Array(data.slice(0)) });
      const doc = await task.promise;
      setBytes(data); setName(file.name.replace(/\.pdf$/i, '')); setPages(doc.numPages); setPage(1); setItems([]);
      void task.destroy();
      const found = await readFormFields(data);
      setFields(found);
      setEntries(Object.fromEntries(found.map((field) => [field.name, { value: field.value, checked: field.checked }])));
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
      setPageWidth(base.width);
      setView({ w: el.width, h: el.height });
    } finally { void task.destroy(); }
  }, [bytes, page]);

  useEffect(() => { void render(); }, [render]);

  const fraction = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) };
  };

  const addAt = (event: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current !== null) return;
    if (mode === 'text') {
      if (!text.trim()) { setMessage('Type the text in step 2 first, then tap the page where it should go.'); return; }
      if (!SUPPORTED.test(text)) { setMessage('Only letters, digits and keyboard symbols can be added. Write Rs. instead of the rupee sign; other scripts are not supported yet.'); return; }
    }
    setMessage('');
    const at = fraction(event);
    const id = nextId.current;
    nextId.current += 1;
    setItems((list) => [...list, { id, page, kind: mode, text: mode === 'text' ? text.trim() : '', x: at.x, y: at.y, size, color: COLORS[color] }]);
  };

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    const id = drag.current;
    if (id === null) return;
    const at = fraction(event);
    setItems((list) => list.map((item) => (item.id === id ? { ...item, ...at } : item)));
  };

  const fieldsChanged = fields.some((field) => { const entry = entries[field.name]; return entry !== undefined && (entry.value !== field.value || entry.checked !== field.checked); });
  const setEntry = (name: string, patch: Partial<FieldEntry>) => setEntries((all) => ({ ...all, [name]: { ...(all[name] ?? { value: '', checked: false }), ...patch } }));

  const save = async () => {
    if (!bytes || (items.length === 0 && !fieldsChanged)) return;
    setBusy(true); setMessage('');
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const doc = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: false });
      if (fieldsChanged) await applyFormFields(doc, fields, entries, flatten);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      for (const item of items) {
        const target = doc.getPage(Math.min(item.page, doc.getPageCount()) - 1);
        const { width, height } = target.getSize();
        const [r, g, b] = hexToRgb(item.color);
        const colour = rgb(r, g, b);
        const px = item.x * width; const py = height - item.y * height;
        if (item.kind === 'text') {
          target.drawText(item.text, { x: px, y: py - item.size * 0.8, size: item.size, font, color: colour });
        } else {
          const s = item.size; const left = px - s / 2; const top = py + s / 2;
          const stroke = Math.max(1, s * 0.12);
          if (item.kind === 'tick') {
            target.drawLine({ start: { x: left + s * 0.08, y: top - s * 0.55 }, end: { x: left + s * 0.38, y: top - s * 0.9 }, thickness: stroke, color: colour });
            target.drawLine({ start: { x: left + s * 0.38, y: top - s * 0.9 }, end: { x: left + s * 0.95, y: top - s * 0.1 }, thickness: stroke, color: colour });
          } else {
            target.drawLine({ start: { x: left + s * 0.1, y: top - s * 0.1 }, end: { x: left + s * 0.9, y: top - s * 0.9 }, thickness: stroke, color: colour });
            target.drawLine({ start: { x: left + s * 0.9, y: top - s * 0.1 }, end: { x: left + s * 0.1, y: top - s * 0.9 }, thickness: stroke, color: colour });
          }
        }
      }
      saveBlob(new Blob([(await doc.save()) as BlobPart], { type: 'application/pdf' }), generateFileName(`${name || 'document'}-filled`, 'pdf'));
    } catch {
      setMessage('Could not fill this PDF. If it is protected, unlock it first. A form field may also contain a character it cannot hold: use plain letters and digits there, then try again.');
    } finally { setBusy(false); }
  };

  const scale = view.w / pageWidth;
  const here = items.filter((item) => item.page === page);
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

      {bytes && fields.length > 0 && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>Fill the form fields in this PDF</h2>
          <p className="text-[11px] text-slate-500">This PDF has {fields.length} fillable field{fields.length === 1 ? '' : 's'}. Type into them here. You can still add text and marks anywhere with the steps below.</p>
          <div className="max-h-96 space-y-2 overflow-auto pr-1">
            {fields.map((field) => {
              const entry = entries[field.name] ?? { value: field.value, checked: field.checked };
              return field.kind === 'check' ? (
                <Toggle key={field.name} label={field.name} checked={entry.checked} onChange={(checked) => setEntry(field.name, { checked })} />
              ) : field.kind === 'choice' ? (
                <label key={field.name} className="block text-xs font-semibold text-slate-700">{field.name}
                  <select value={entry.value} onChange={(event) => setEntry(field.name, { value: event.target.value })} className={fieldClass}>
                    <option value="">Choose…</option>
                    {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
              ) : (
                <label key={field.name} className="block text-xs font-semibold text-slate-700">{field.name}
                  <input value={entry.value} maxLength={field.maxLength ?? 300} onChange={(event) => setEntry(field.name, { value: event.target.value })} className={fieldClass} />
                </label>
              );
            })}
          </div>
          <Toggle label="Lock the filled fields into the page" hint="Recommended: every phone and computer viewer then shows what you typed. Turn off to keep the fields editable." checked={flatten} onChange={setFlatten} />
        </div>
      )}

      {bytes && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>{fields.length > 0 ? 'Add text or marks anywhere' : '2. What to add'}</h2>
          <ChoiceButtons label="Add" value={mode} onChange={(v) => setMode(v as Mode)} options={[{ value: 'text', label: 'Text' }, { value: 'tick', label: 'Tick' }, { value: 'cross', label: 'Cross' }]} />
          {mode === 'text' && (
            <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-0 flex-1 text-xs font-semibold text-slate-700">Text
                <input value={text} maxLength={120} onChange={(event) => setText(event.target.value)} placeholder="Asha Verma" className={fieldClass} />
              </label>
              <button type="button" onClick={() => setText(todayText())} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"><CalendarDays className="h-4 w-4" aria-hidden="true" />Today's date</button>
            </div>
          )}
          <Slider label={mode === 'text' ? 'Text size' : 'Mark size'} value={size} min={6} max={40} step={1} unit=" pt" onChange={setSize} />
          <ChoiceButtons label="Colour" value={color} onChange={(v) => setColor(v as keyof typeof COLORS)} options={[{ value: 'black', label: 'Black' }, { value: 'blue', label: 'Blue' }, { value: 'red', label: 'Red' }]} />
        </div>
      )}

      {bytes && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>3. Tap the page to place it</h2>
          <p className="text-[11px] text-slate-500">Tap an empty spot to add. Drag something you added to move it.</p>
          <label className="text-xs font-semibold text-slate-700">Page
            <select value={page} onChange={(event) => setPage(Number(event.target.value))} className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs">
              {Array.from({ length: pages }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
            </select>
          </label>
          <div
            className="relative mx-auto w-full max-w-xl cursor-crosshair touch-none select-none overflow-hidden rounded-lg border border-slate-300 bg-white"
            onPointerDown={addAt}
            onPointerMove={move}
            onPointerUp={() => { drag.current = null; }}
            onPointerLeave={() => { drag.current = null; }}
          >
            <canvas ref={canvas} className="block h-auto w-full" />
            {here.map((item) => (
              <div
                key={item.id}
                onPointerDown={(event) => { event.stopPropagation(); drag.current = item.id; }}
                className="absolute cursor-move whitespace-nowrap outline outline-1 outline-dashed outline-orange-400"
                style={item.kind === 'text'
                  ? { left: `${item.x * 100}%`, top: `${item.y * 100}%`, fontSize: item.size * scale, lineHeight: 1, color: item.color, fontFamily: 'Helvetica, Arial, sans-serif' }
                  : { left: `${item.x * 100}%`, top: `${item.y * 100}%`, width: item.size * scale, height: item.size * scale, transform: 'translate(-50%, -50%)', color: item.color }}
              >
                {item.kind === 'text' ? item.text : (
                  <svg viewBox="0 0 10 10" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {item.kind === 'tick' ? <polyline points="0.8,4.5 3.8,9 9.5,1" /> : <><line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" /></>}
                  </svg>
                )}
              </div>
            ))}
          </div>
          {items.length > 0 && (
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700">
                  <span className="min-w-0 truncate">Page {item.page}: {item.kind === 'text' ? item.text : item.kind === 'tick' ? 'Tick' : 'Cross'}</span>
                  <button type="button" onClick={() => setItems((list) => list.filter((entry) => entry.id !== item.id))} aria-label="Remove this item" className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" disabled={(items.length === 0 && !fieldsChanged) || busy} onClick={() => void save()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-50"><Download className="h-4 w-4" aria-hidden="true" />{busy ? 'Saving...' : 'Download filled PDF'}</button>
        </div>
      )}
      {message && <p role="status" className="text-xs text-red-700">{message}</p>}
      <Note>Your PDF stays in your browser and is never uploaded. It fills the form's own fields when the PDF has them, and can also write plain text and marks on the page. It is not a certified signature. Check the downloaded file before you send it.</Note>
    </section>
  );
};

export default FillPdf;
