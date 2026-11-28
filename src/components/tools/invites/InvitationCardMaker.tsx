import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Download, ImagePlus } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { fieldClass } from '../../common/FieldKit';
import { Slider, Toggle, card, heading } from '../../common/PanelKit';
import { generateFileName } from '../../../lib/pdf/naming';
import { pdfBlob } from '../../../lib/pdf/toBlob';
import { loadPosterFonts } from '../../../lib/poster/fonts';
import { loadPhoto, type LoadedImage } from '../../../lib/poster/images';
import { BODY_FONTS, DESIGNS, HEAD_FONTS, PALETTES, SIZES, designOf, palOf, type SizeId } from '../../../lib/invites/data';
import { renderInvite, type InviteContent } from '../../../lib/invites/render';
import { isoFrom, longDate } from '../../../lib/docs/kit';
import T from '../../../locales/packs/invites.text.en.json';
import { ConfirmButton } from '../shared/ConfirmButton';
import { useRegion } from '../workbooks/shared';
import { InviteThumb } from './InviteThumb';
import '../shops/posterFonts.css';

const c = T.common;
type Occasion = (typeof T.occasions)[number];
type Shape = 'circle' | 'arch' | 'round';
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pick = 'min-h-11 rounded-lg border px-3 py-2 text-xs font-semibold';
const on = 'border-orange-700 bg-orange-50 text-orange-900', off = 'border-slate-200 bg-white text-slate-700 hover:border-slate-300';

interface State {
  occasion: string; design: string; size: SizeId; heading: string; line: string; names: string; tagline: string; message: string; date: string; time: string; venue: string; address: string; footer: string;
  palette: string; headFont: string; bodyFont: string; scale: number; decorations: boolean; border: boolean; shape: Shape | ''; zoom: number; x: number; y: number;
}
const occasionOf = (id: string): Occasion => T.occasions.find((o) => o.id === id) ?? T.occasions[0]!;
const suggested = (occasion: string) => DESIGNS.filter((d) => d.occasions.includes(occasion));
const fromOccasion = (id: string, keep?: Partial<State>): State => {
  const o = occasionOf(id), first = suggested(id)[0] ?? DESIGNS[0]!;
  return { occasion: id, design: first.id, size: 'portrait', heading: o.heading, line: o.line, names: o.names, tagline: o.tagline, message: o.message, date: isoFrom(new Date(), 30), time: o.time, venue: o.venue, address: o.address, footer: o.footer, palette: '', headFont: '', bodyFont: '', scale: 1.1, decorations: true, border: true, shape: '', zoom: 1, x: 0, y: 0, ...keep };
};

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; rows?: number; max?: number; type?: string }> = ({ label, value, onChange, rows, max = 120, type = 'text' }) => (
  <label className="block text-xs font-semibold text-slate-700">{label}
    {rows ? <textarea value={value} rows={rows} maxLength={max} onChange={(e) => onChange(e.target.value)} className={`${fieldClass} py-2`} /> : <input type={type} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} className={fieldClass} />}
  </label>
);

/** Invitation card maker: choose an occasion and a design, type your words, add a photo, and download a picture or PDF. */
export const InvitationCardMaker: React.FC = () => {
  const [s, setS] = useState<State>(() => fromOccasion('wedding'));
  const [photo, setPhoto] = useState<LoadedImage | null>(null);
  const [fonts, setFonts] = useState('loading');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState(false);
  const [region] = useRegion();
  const picker = useRef<HTMLInputElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const set = <K extends keyof State>(k: K, v: State[K]) => { setS((x) => ({ ...x, [k]: v })); setNotice(false); };

  useEffect(() => { let alive = true; void loadPosterFonts().then(() => { if (alive) setFonts('ready'); }); return () => { alive = false; }; }, []);

  const design = designOf(s.design), size = SIZES[s.size];
  const pal = useMemo(() => (s.palette ? palOf(s.palette) : null), [s.palette]);
  const dateText = useMemo(() => {
    const iso = s.date, m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return '';
    const day = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getDay(), long = longDate(iso, region);
    return long ? `${WEEKDAYS[day]}, ${long}` : '';
  }, [s.date, region]);
  const content: InviteContent = useMemo(() => ({ heading: s.heading, line: s.line, names: s.names, tagline: s.tagline, message: s.message, date: dateText, time: s.time, venue: s.venue, address: s.address, footer: s.footer }), [s, dateText]);
  const shape: Shape = (s.shape || design.photo) as Shape;
  const photoArg = useMemo(() => (photo ? { source: photo.source, width: photo.width, height: photo.height, zoom: s.zoom, x: s.x, y: s.y } : null), [photo, s.zoom, s.x, s.y]);
  const deferred = useDeferredValue(content);
  const thumbPhoto = useMemo(() => (photoArg ? { ...photoArg } : null), [photoArg]);

  const options = useMemo(() => ({ design, pal: pal ?? palOf(design.pal), headFont: s.headFont || design.headFont, bodyFont: s.bodyFont || design.bodyFont, scale: s.scale, decorations: s.decorations, border: s.border, photo: photoArg, photoShape: shape }), [design, pal, s.headFont, s.bodyFont, s.scale, s.decorations, s.border, photoArg, shape]);
  useEffect(() => {
    const canvas = preview.current, ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = size.w; canvas.height = size.h;
    renderInvite(ctx, size.w, size.h, deferred, options);
  }, [deferred, options, size, fonts]);

  const ordered = useMemo(() => { const good = suggested(s.occasion).map((d) => d.id); return [...DESIGNS].sort((a, b) => Number(good.includes(b.id)) - Number(good.includes(a.id))); }, [s.occasion]);
  const good = useMemo(() => new Set(suggested(s.occasion).map((d) => d.id)), [s.occasion]);

  const onPicked = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    try { setPhoto(await loadPhoto(file)); setMessage(''); setS((x) => ({ ...x, zoom: 1, x: 0, y: 0 })); } catch { setMessage(c.readFail); }
  }, []);

  const make = async (kind: 'png' | 'jpg' | 'pdf') => {
    setBusy(kind); setMessage('');
    try {
      await new Promise((r) => setTimeout(r, 20));
      const canvas = document.createElement('canvas'); canvas.width = size.w; canvas.height = size.h;
      const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('canvas');
      renderInvite(ctx, size.w, size.h, content, options);
      const mime = kind === 'jpg' ? 'image/jpeg' : 'image/png';
      const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, mime, 0.92));
      if (!blob) throw new Error('blob');
      let out = blob;
      if (kind === 'pdf') {
        const { PDFDocument } = await import('pdf-lib');
        const doc = await PDFDocument.create(), img = await doc.embedPng(new Uint8Array(await blob.arrayBuffer()));
        const page = doc.addPage([(size.w * 72) / 150, (size.h * 72) / 150]); page.drawImage(img, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
        out = pdfBlob(await doc.save());
      }
      const url = URL.createObjectURL(out), a = document.createElement('a');
      a.href = url; a.download = generateFileName('invitation', kind, { base: s.names || 'card', details: `${design.id}-${s.size}` }); a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch { setMessage(c.failed); }
    setBusy('');
  };

  const startAgain = () => { setS(fromOccasion('wedding')); setPhoto(null); setMessage(''); setNotice(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const chooseOccasion = (id: string) => { setS((x) => fromOccasion(id, { size: x.size, scale: x.scale })); setNotice(false); };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Note>{c.note}</Note>

      <section className={`${card} space-y-2`}>
        <h2 className={heading}>{c.occasion}</h2>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={c.occasion}>
          {T.occasions.map((o) => <button key={o.id} type="button" role="radio" aria-checked={s.occasion === o.id} onClick={() => chooseOccasion(o.id)} className={`${pick} ${s.occasion === o.id ? on : off}`}>{o.label}</button>)}
        </div>
        <p className="text-[11px] text-slate-500">{c.sampleNote}</p>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{c.size}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={c.size}>
          {(Object.keys(SIZES) as SizeId[]).map((id) => (
            <button key={id} type="button" role="radio" aria-checked={s.size === id} onClick={() => set('size', id)} className={`${pick} text-left ${s.size === id ? on : off}`}>
              <span className="block">{c.sizes[id][0]}</span><span className="block text-[11px] font-normal opacity-80">{c.sizes[id][1]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{c.design}</h2>
        <p className="text-[11px] text-slate-500">{c.designHint}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" role="radiogroup" aria-label={c.design}>
          {ordered.map((d) => (
            <button key={d.id} type="button" role="radio" aria-checked={s.design === d.id} onClick={() => set('design', d.id)} className={`rounded-xl border-2 p-1.5 text-left ${s.design === d.id ? 'border-orange-700 bg-orange-50' : 'border-transparent hover:border-slate-300'}`}>
              <InviteThumb design={d} size={size} content={deferred} pal={pal} photo={thumbPhoto} ready={fonts} />
              <span className="mt-1 block text-xs font-bold text-slate-900">{d.name}{good.has(d.id) && <span className="ml-1 rounded bg-green-100 px-1 py-0.5 text-[10px] font-bold text-green-800">{c.suggested}</span>}</span>
              <span className="block text-[11px] text-slate-500">{d.blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{c.details}</h2>
        <p className="text-[11px] text-slate-500">{c.detailsHint}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={c.heading} value={s.heading} max={40} onChange={(v) => set('heading', v)} />
          <Field label={c.line} value={s.line} max={70} onChange={(v) => set('line', v)} />
          <Field label={occasionOf(s.occasion).namesLabel} value={s.names} max={60} onChange={(v) => set('names', v)} />
          <Field label={c.tagline} value={s.tagline} max={70} onChange={(v) => set('tagline', v)} />
          <div className="sm:col-span-2"><Field label={c.message} value={s.message} rows={3} max={260} onChange={(v) => set('message', v)} /></div>
          <Field label={c.date} value={s.date} type="date" onChange={(v) => set('date', v)} />
          <Field label={c.time} value={s.time} max={40} onChange={(v) => set('time', v)} />
          <Field label={c.venue} value={s.venue} max={60} onChange={(v) => set('venue', v)} />
          <Field label={c.address} value={s.address} max={90} onChange={(v) => set('address', v)} />
          <div className="sm:col-span-2"><Field label={c.footer} value={s.footer} max={90} onChange={(v) => set('footer', v)} /></div>
        </div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{c.look}</h2>
        <div>
          <p className="mb-1 text-xs font-semibold text-slate-700">{c.palette}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={c.palette}>
            <button type="button" role="radio" aria-checked={s.palette === ''} onClick={() => set('palette', '')} className={`${pick} ${s.palette === '' ? on : off}`}>{c.paletteDefault}</button>
            {PALETTES.map((p) => (
              <button key={p.id} type="button" role="radio" aria-checked={s.palette === p.id} aria-label={p.id.replace('-', ' ')} onClick={() => set('palette', p.id)} className={`flex h-11 w-16 overflow-hidden rounded-lg border-2 ${s.palette === p.id ? 'border-orange-700' : 'border-slate-200'}`}>
                <span className="w-1/2" style={{ background: `#${p.bg}` }} /><span className="w-1/4" style={{ background: `#${p.accent}` }} /><span className="w-1/4" style={{ background: `#${p.accent2}` }} />
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">{c.headFont}
            <select value={s.headFont || design.headFont} onChange={(e) => set('headFont', e.target.value)} className={fieldClass}>{HEAD_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}</select>
          </label>
          <label className="block text-xs font-semibold text-slate-700">{c.bodyFont}
            <select value={s.bodyFont || design.bodyFont} onChange={(e) => set('bodyFont', e.target.value)} className={fieldClass}>{BODY_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}</select>
          </label>
        </div>
        <Slider label={c.textSize} value={s.scale} min={0.7} max={1.4} step={0.05} unit="x" onChange={(v) => set('scale', v)} />
        <p className="text-[11px] text-slate-500">{c.textSizeHint}</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Toggle label={c.decorations} checked={s.decorations} onChange={(v) => set('decorations', v)} />
          <Toggle label={c.border} checked={s.border} onChange={(v) => set('border', v)} />
        </div>
        {(s.headFont || s.bodyFont || s.palette) && <button type="button" onClick={() => setS((x) => ({ ...x, headFont: '', bodyFont: '', palette: '' }))} className="text-xs font-semibold text-orange-700 underline">{c.paletteDefault}</button>}
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{c.photo}</h2>
        <p className="text-[11px] text-slate-500">{c.photoHint}</p>
        <input ref={picker} type="file" accept="image/*" className="hidden" onChange={(e) => void onPicked(e)} />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => picker.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><ImagePlus className="h-4 w-4" aria-hidden="true" />{photo ? c.changePhoto : c.addPhoto}</button>
          {photo && <button type="button" onClick={() => setPhoto(null)} className="min-h-11 rounded-lg px-3 text-xs font-semibold text-red-700 underline">{c.removePhoto}</button>}
        </div>
        {photo && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={c.photoShape}>
              {(['circle', 'arch', 'round'] as const).map((sh) => <button key={sh} type="button" role="radio" aria-checked={shape === sh} onClick={() => set('shape', sh)} className={`${pick} ${shape === sh ? on : off}`}>{c.shapes[sh]}</button>)}
            </div>
            <Slider label={c.zoom} value={s.zoom} min={1} max={3} step={0.05} unit="x" onChange={(v) => set('zoom', v)} />
            <Slider label={c.left} value={s.x} min={-1} max={1} step={0.05} unit="" onChange={(v) => set('x', v)} />
            <Slider label={c.up} value={s.y} min={-1} max={1} step={0.05} unit="" onChange={(v) => set('y', v)} />
          </div>
        )}
        {message && <p role="alert" className="text-xs font-semibold text-red-700">{message}</p>}
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{c.preview}</h2>
        <div className="flex justify-center rounded-lg bg-slate-100 p-3">
          <canvas ref={preview} role="img" aria-label={c.preview} className="h-auto w-full rounded shadow-lg" style={{ maxWidth: size.maxPreview }} />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button type="button" disabled={busy !== ''} onClick={() => void make('png')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-700 px-4 py-3 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-60"><Download className="h-4 w-4" aria-hidden="true" />{busy === 'png' ? c.working : c.download}</button>
          <button type="button" disabled={busy !== ''} onClick={() => void make('jpg')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-orange-700 bg-white px-4 py-3 text-sm font-bold text-orange-800 hover:bg-orange-50 disabled:opacity-60"><Download className="h-4 w-4" aria-hidden="true" />{busy === 'jpg' ? c.working : c.downloadJpg}</button>
          <button type="button" disabled={busy !== ''} onClick={() => void make('pdf')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-orange-700 bg-white px-4 py-3 text-sm font-bold text-orange-800 hover:bg-orange-50 disabled:opacity-60"><Download className="h-4 w-4" aria-hidden="true" />{busy === 'pdf' ? c.working : c.downloadPdf}</button>
        </div>
        <div><ConfirmButton label={c.startAgain} confirmLabel={c.startAgainConfirm} onConfirm={startAgain} disabled={busy !== ''} /></div>
        {notice && <p role="status" className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">{c.startedAgain}</p>}
        <p className="text-[11px] text-slate-500">{c.printNote}</p>
        <ul className="list-disc space-y-1 pl-5 text-[11px] text-slate-500">{c.notes.map((n) => <li key={n}>{n}</li>)}</ul>
      </section>
    </div>
  );
};

export default InvitationCardMaker;
