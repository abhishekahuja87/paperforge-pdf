import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileText, LayoutGrid } from 'lucide-react';
import { Note } from '../../finance/ui';
import { Toggle, card, heading } from '../paper/controls';
import { fieldClass } from '../utilities/common';
import { CARD_H, CARD_W, drawCard, type CardData } from '../../../lib/cards/cardRender';
import { CARD_TEMPLATES, DEFAULT_CARD_TEMPLATE, getCardTemplate, isCardTemplateId } from '../../../lib/cards/cardTemplates';
import { buildCardPdf, type CardPdfMode } from '../../../lib/cards/cardPdf';
import { encodeQr } from '../../../lib/qr/encoder';
import { contactPayload, urlPayload } from '../../../lib/qr/payloads';
import { generateFileName } from '../../../lib/pdf/naming';
import { CardThumb } from './CardThumb';

const STORAGE_KEY = 'mdu-visiting-card-v1';

const SAMPLE: CardData = {
  name: 'Aarav Mehta',
  title: 'Product Designer',
  company: 'Brightside Studio',
  phone: '+91 98765 43210',
  email: 'aarav@brightside.example',
  website: 'www.brightside.example',
  address: '12 MG Road, Bengaluru 560001',
};

interface Saved { data: CardData; template: string; accent: string; qr: boolean; qrKind: 'contact' | 'website' }

function readSaved(): Saved {
  const base: Saved = { data: SAMPLE, template: DEFAULT_CARD_TEMPLATE, accent: getCardTemplate(DEFAULT_CARD_TEMPLATE).accent, qr: false, qrKind: 'contact' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<Saved>;
    return {
      data: { ...SAMPLE, ...(saved.data ?? {}) },
      template: isCardTemplateId(saved.template) ? saved.template : base.template,
      accent: typeof saved.accent === 'string' && /^#[0-9a-f]{6}$/i.test(saved.accent) ? saved.accent : base.accent,
      qr: saved.qr === true,
      qrKind: saved.qrKind === 'website' ? 'website' : 'contact',
    };
  } catch { return base; }
}

const FIELDS: { key: keyof CardData; label: string; max: number; mode?: 'tel' | 'email' | 'url' }[] = [
  { key: 'name', label: 'Name', max: 40 },
  { key: 'title', label: 'Job title', max: 50 },
  { key: 'company', label: 'Company', max: 50 },
  { key: 'phone', label: 'Phone', max: 30, mode: 'tel' },
  { key: 'email', label: 'Email', max: 60, mode: 'email' },
  { key: 'website', label: 'Website', max: 60, mode: 'url' },
];

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export const VisitingCardMaker: React.FC = () => {
  const initial = useMemo(readSaved, []);
  const [data, setData] = useState<CardData>(initial.data);
  const [template, setTemplate] = useState(initial.template);
  const [accent, setAccent] = useState(initial.accent);
  const [useQr, setUseQr] = useState(initial.qr);
  const [qrKind, setQrKind] = useState<'contact' | 'website'>(initial.qrKind);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const spec = getCardTemplate(template);
  const deferredData = useDeferredValue(data);
  const deferredAccent = useDeferredValue(accent);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, template, accent, qr: useQr, qrKind } satisfies Saved)); } catch { /* storage unavailable */ }
  }, [data, template, accent, useQr, qrKind]);

  const qr = useMemo(() => {
    if (!useQr) return null;
    try {
      const [first, ...rest] = data.name.trim().split(/\s+/);
      const text = qrKind === 'website' && data.website.trim()
        ? urlPayload(data.website.trim())
        : contactPayload({ first: first ?? '', last: rest.join(' '), org: data.company, title: data.title, phone: data.phone, email: data.email, website: data.website, address: data.address, note: '' });
      return encodeQr(text, 'M');
    } catch { return null; }
  }, [useQr, qrKind, data]);
  const deferredQr = useDeferredValue(qr);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    drawCard(ctx, spec, deferredData, deferredAccent, deferredQr);
  }, [spec, deferredData, deferredAccent, deferredQr]);

  const setField = (key: keyof CardData) => (event: React.ChangeEvent<HTMLInputElement>) => setData((current) => ({ ...current, [key]: event.target.value }));

  const pick = (id: string) => {
    setTemplate(id);
    setAccent(getCardTemplate(id).accent);
  };

  const render = useCallback((): Promise<Blob | null> => new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) { resolve(null); return; }
    drawCard(ctx, spec, data, accent, qr);
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  }), [spec, data, accent, qr]);

  const fileBase = data.name.trim() || 'card';

  const downloadPng = async () => {
    setMessage('');
    const blob = await render();
    if (!blob) { setMessage('The picture could not be created.'); return; }
    save(blob, generateFileName('visiting-card', 'png', { base: fileBase, details: template }));
  };

  const downloadPdf = async (mode: CardPdfMode) => {
    setMessage('');
    setBusy(true);
    try {
      const blob = await render();
      if (!blob) throw new Error('render');
      const bytes = await buildCardPdf(new Uint8Array(await blob.arrayBuffer()), mode);
      save(new Blob([bytes as BlobPart], { type: 'application/pdf' }), generateFileName(mode === 'sheet' ? 'visiting-cards-a4' : 'visiting-card', 'pdf', { base: fileBase, details: template }));
    } catch {
      setMessage('The PDF could not be created. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const button = 'inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <div className="space-y-4">
      <Note>Everything is filled in with an example. Type your own details, pick a design and download. Your details stay on your device.</Note>

      <div className={card}>
        <h3 className={heading}>1. Your details</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <label key={field.key} className="block text-xs font-semibold text-slate-700">
              {field.label}
              <input className={fieldClass} value={data[field.key]} maxLength={field.max} inputMode={field.mode} onChange={setField(field.key)} />
            </label>
          ))}
          <label className="block text-xs font-semibold text-slate-700 sm:col-span-2">
            Address
            <input className={fieldClass} value={data.address} maxLength={90} onChange={setField('address')} />
          </label>
        </div>
        <div className="mt-3 space-y-2">
          <Toggle label="Add a QR code" hint="Scanning it saves your contact or opens your website." checked={useQr} onChange={setUseQr} />
          {useQr && (
            <label className="block text-xs font-semibold text-slate-700">
              The QR code
              <select className={fieldClass} value={qrKind} onChange={(event) => setQrKind(event.target.value === 'website' ? 'website' : 'contact')}>
                <option value="contact">Saves my contact details</option>
                <option value="website">Opens my website</option>
              </select>
            </label>
          )}
        </div>
      </div>

      <div className={card}>
        <h3 className={heading}>2. Design</h3>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CARD_TEMPLATES.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => pick(item.id)} aria-pressed={item.id === template}
                className={`w-full rounded-lg border-2 p-1.5 text-left ${item.id === template ? 'border-orange-600 bg-orange-50' : 'border-transparent hover:border-slate-200'}`}>
                <CardThumb spec={item} data={deferredData} accent={item.id === template ? deferredAccent : item.accent} />
                <span className="mt-1 block text-xs font-bold text-slate-900">{item.name}</span>
                <span className="block text-[11px] leading-tight text-slate-500">{item.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
        {spec.colour && (
          <label className="mt-3 flex items-center gap-3 text-xs font-semibold text-slate-700">
            Colour
            <input type="color" value={accent} onChange={(event) => setAccent(event.target.value)} className="h-10 w-14 cursor-pointer rounded border border-slate-200 bg-white" aria-label="Card colour" />
            <button type="button" onClick={() => setAccent(spec.accent)} className="text-xs font-semibold text-orange-700 underline">Reset</button>
          </label>
        )}
      </div>

      <div className={card}>
        <h3 className={heading}>Preview</h3>
        <div className="mt-3 flex justify-center">
          <canvas ref={canvasRef} role="img" aria-label="Visiting card preview" className="h-auto w-full rounded shadow-lg" style={{ maxWidth: 525, aspectRatio: `${CARD_W} / ${CARD_H}` }} />
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={downloadPng} className={`${button} bg-orange-700 text-white hover:bg-orange-800`}><Download className="h-4 w-4" aria-hidden="true" />PNG picture</button>
          <button type="button" disabled={busy} onClick={() => downloadPdf('single')} className={`${button} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`}><FileText className="h-4 w-4" aria-hidden="true" />PDF, one card</button>
          <button type="button" disabled={busy} onClick={() => downloadPdf('sheet')} className={`${button} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`}><LayoutGrid className="h-4 w-4" aria-hidden="true" />A4 sheet of 10</button>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Size 3.5 × 2 inches (89 × 51 mm), 300 dpi. The A4 sheet has cutting marks; print it at 100% (actual size).</p>
        {message && <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{message}</p>}
      </div>
    </div>
  );
};

export default VisitingCardMaker;
