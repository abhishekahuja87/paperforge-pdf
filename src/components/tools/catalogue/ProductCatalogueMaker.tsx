import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Copy, Download, ImagePlus, Trash2 } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { fieldClass } from '../../common/FieldKit';
import { Toggle, card, heading } from '../../common/PanelKit';
import { generateFileName } from '../../../lib/pdf/naming';
import { loadPosterFonts } from '../../../lib/poster/fonts';
import { loadPhoto } from '../../../lib/poster/images';
import { loadSamplePhotos } from '../../../lib/poster/samples';
import { POSTER_SAMPLE_PRODUCTS } from '../../../config/posterSamples';
import { BODY_FONTS, HEAD_FONTS, PALETTES, palOf } from '../../../lib/invites/data';
import { CATALOGUE_DESIGNS, CURRENCIES, LAYOUTS, MAX_PRODUCTS, PAGE_SIZES, catalogueDesignOf, type LayoutId, type PageSizeId } from '../../../lib/catalogue/data';
import { buildPages, renderCatalogue, type CatBusiness, type CatImage, type CatOptions, type CatProduct } from '../../../lib/catalogue/render';
import T from '../../../locales/packs/catalogue.text.en.json';
import { ConfirmButton } from '../shared/ConfirmButton';
import { CatalogueThumb } from './CatalogueThumb';
import '../shops/posterFonts.css';

const c = T.common;
const STORE_KEY = 'mdu.catalogue.business.v1';
const pick = 'min-h-11 rounded-lg border px-3 py-2 text-xs font-semibold';
const on = 'border-orange-700 bg-orange-50 text-orange-900', off = 'border-slate-200 bg-white text-slate-700 hover:border-slate-300';
const ghost = 'inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40';

interface Row extends Omit<CatProduct, 'image'> { id: number; image: CatImage | null }
const blankBusiness = (): CatBusiness => ({ title: c.sample.title, subtitle: c.sample.subtitle, name: c.sample.name, tagline: c.sample.tagline, phone: '', whatsapp: '98765 43210', email: '', address: '', web: '', note: c.sample.note, countryCode: '91' });
const loadBusiness = (): CatBusiness => {
  try { const raw = window.localStorage.getItem(STORE_KEY); if (raw) return { ...blankBusiness(), ...(JSON.parse(raw) as Partial<CatBusiness>) }; } catch { /* storage unavailable */ }
  return blankBusiness();
};

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; max?: number; rows?: number }> = ({ label, value, onChange, max = 80, rows }) => (
  <label className="block text-xs font-semibold text-slate-700">{label}
    {rows ? <textarea value={value} rows={rows} maxLength={max} onChange={(e) => onChange(e.target.value)} className={`${fieldClass} py-2`} /> : <input value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} className={fieldClass} />}
  </label>
);

/** Product catalogue maker: add products with photos and prices, pick a design, and download a catalogue as a PDF or as page pictures. */
export const ProductCatalogueMaker: React.FC = () => {
  const [b, setB] = useState<CatBusiness>(loadBusiness);
  const [rows, setRows] = useState<Row[]>([]);
  const [logo, setLogo] = useState<CatImage | null>(null);
  const [design, setDesign] = useState('clean-store');
  const [layout, setLayout] = useState<LayoutId>('four');
  const [sizeId, setSizeId] = useState<PageSizeId>('a4');
  const [palette, setPalette] = useState('');
  const [headFont, setHeadFont] = useState('');
  const [bodyFont, setBodyFont] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [showPrice, setShowPrice] = useState(true), [showDesc, setShowDesc] = useState(true), [showCode, setShowCode] = useState(true), [qr, setQr] = useState(true);
  const [fit, setFit] = useState<'cover' | 'contain'>('cover');
  const [page, setPage] = useState(0);
  const [fonts, setFonts] = useState('loading');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState(false);
  const [sample, setSample] = useState(true);
  const nextId = useRef(1);
  const photoPicker = useRef<HTMLInputElement>(null), logoPicker = useRef<HTMLInputElement>(null), rowPicker = useRef<HTMLInputElement>(null), rowTarget = useRef(0);
  const preview = useRef<HTMLCanvasElement>(null);

  const newRow = useCallback((over: Partial<Row> = {}): Row => ({ id: nextId.current++, name: '', price: '', old: '', desc: '', code: '', badge: '', section: '', image: null, ...over }), []);
  const loadSamples = useCallback(async () => {
    const photos = await loadSamplePhotos();
    setRows(POSTER_SAMPLE_PRODUCTS.slice(0, 8).map((p, i) => newRow({ name: p.name, price: p.price, old: p.original, desc: 'A short line about this product', code: `Code ${100 + i}`, badge: i === 0 ? 'New' : '', section: i === 0 ? c.sample.section : '', image: photos[i] ?? null })));
    setSample(true);
  }, [newRow]);

  useEffect(() => { let alive = true; void loadPosterFonts().then(() => { if (alive) setFonts('ready'); }); void loadSamples(); return () => { alive = false; }; }, [loadSamples]);
  useEffect(() => { try { window.localStorage.setItem(STORE_KEY, JSON.stringify(b)); } catch { /* storage unavailable */ } }, [b]);

  const d = catalogueDesignOf(design), size = PAGE_SIZES[sizeId];
  const products: CatProduct[] = useMemo(() => rows.map(({ id: _id, ...p }) => p), [rows]);
  const options: CatOptions = useMemo(() => ({ design: d, pal: palOf(palette || d.pal), headFont: headFont || d.headFont, bodyFont: bodyFont || d.bodyFont, layout, size, currency, showPrice, showDesc, showCode, fit, logo, qr, labels: c.labels }), [d, palette, headFont, bodyFont, layout, size, currency, showPrice, showDesc, showCode, fit, logo, qr]);
  const pages = useMemo(() => buildPages(products, layout), [products, layout]);
  const last = Math.min(page, pages.length - 1);
  const dBusiness = useDeferredValue(b), dProducts = useDeferredValue(products), dOptions = useDeferredValue(options);
  const dPages = useMemo(() => buildPages(dProducts, dOptions.layout), [dProducts, dOptions.layout]);

  useEffect(() => {
    const canvas = preview.current, ctx = canvas?.getContext('2d'), spec = dPages[Math.min(last, dPages.length - 1)];
    if (!canvas || !ctx || !spec) return;
    canvas.width = dOptions.size.w; canvas.height = dOptions.size.h;
    renderCatalogue(ctx, dOptions.size.w, dOptions.size.h, spec, dBusiness, dProducts, dOptions, dPages.length);
  }, [dPages, last, dBusiness, dProducts, dOptions, fonts]);

  const touch = (): void => { setNotice(false); setSample(false); };
  const setField = (k: keyof CatBusiness, v: string): void => { setB((x) => ({ ...x, [k]: v })); setNotice(false); };
  const upd = (id: number, patch: Partial<Row>): void => { setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x))); touch(); };
  const move = (i: number, by: number): void => { setRows((r) => { const j = i + by; if (j < 0 || j >= r.length) return r; const n = r.slice(); [n[i], n[j]] = [n[j]!, n[i]!]; return n; }); touch(); };
  const del = (id: number): void => { setRows((r) => r.filter((x) => x.id !== id)); touch(); };
  const dup = (i: number): void => { setRows((r) => (r.length >= MAX_PRODUCTS ? r : [...r.slice(0, i + 1), { ...r[i]!, id: nextId.current++, section: '' }, ...r.slice(i + 1)])); touch(); };

  const onPhotos = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = Array.from(e.target.files ?? []); e.target.value = '';
    if (!files.length) return;
    setMessage(''); setBusy('photos');
    const made: Row[] = []; let failed = false;
    for (const f of files) {
      try { const image = await loadPhoto(f, 900); made.push(newRow({ name: f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 60), image })); } catch { failed = true; }
    }
    setRows((r) => { const base = sample ? [] : r; return [...base, ...made].slice(0, MAX_PRODUCTS); });
    setSample(false); setNotice(false); setBusy(''); if (failed) setMessage(c.readFail);
  };
  const onRowPhoto = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    try { const image = await loadPhoto(file, 900); upd(rowTarget.current, { image }); setMessage(''); } catch { setMessage(c.readFail); }
  };
  const onLogo = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    try { setLogo(await loadPhoto(file, 500)); setMessage(''); } catch { setMessage(c.readFail); }
  };

  const make = async (kind: 'pdf' | 'zip'): Promise<void> => {
    setBusy(kind); setMessage('');
    try {
      const canvas = document.createElement('canvas'); canvas.width = size.w; canvas.height = size.h;
      const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('canvas');
      const toBlob = (mime: string): Promise<Blob> => new Promise((res, rej) => canvas.toBlob((x) => (x ? res(x) : rej(new Error('blob'))), mime, 0.88));
      const list = buildPages(products, layout), name = generateFileName('catalogue', kind, { base: b.name || 'catalogue', details: `${d.id}-${sizeId}` });
      let out: Blob;
      if (kind === 'pdf') {
        const { PDFDocument } = await import('pdf-lib'), doc = await PDFDocument.create();
        for (const spec of list) {
          await new Promise((r) => setTimeout(r, 0));
          renderCatalogue(ctx, size.w, size.h, spec, b, products, options, list.length);
          const img = await doc.embedJpg(new Uint8Array(await (await toBlob('image/jpeg')).arrayBuffer()));
          const pg = doc.addPage([size.ptW, size.ptH]); pg.drawImage(img, { x: 0, y: 0, width: size.ptW, height: size.ptH });
        }
        out = new Blob([(await doc.save()) as BlobPart], { type: 'application/pdf' });
      } else {
        const JSZip = (await import('jszip')).default, zip = new JSZip();
        for (let i = 0; i < list.length; i += 1) {
          await new Promise((r) => setTimeout(r, 0));
          renderCatalogue(ctx, size.w, size.h, list[i]!, b, products, options, list.length);
          zip.file(`page-${String(i + 1).padStart(2, '0')}.png`, await toBlob('image/png'));
        }
        out = await zip.generateAsync({ type: 'blob' });
      }
      const url = URL.createObjectURL(out), a = document.createElement('a');
      a.href = url; a.download = name; a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch { setMessage(c.failed); }
    setBusy('');
  };

  const startAgain = (): void => {
    setB(blankBusiness()); setLogo(null); setDesign('clean-store'); setLayout('four'); setSizeId('a4'); setPalette(''); setHeadFont(''); setBodyFont(''); setCurrency('₹');
    setShowPrice(true); setShowDesc(true); setShowCode(true); setQr(true); setFit('cover'); setPage(0); setMessage('');
    try { window.localStorage.removeItem(STORE_KEY); } catch { /* storage unavailable */ }
    void loadSamples(); setNotice(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Note>{c.note}</Note>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{c.business}</h2>
        <p className="text-[11px] text-slate-500">{c.businessHint}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={c.title} value={b.title} max={40} onChange={(v) => setField('title', v)} />
          <Field label={c.subtitle} value={b.subtitle} max={50} onChange={(v) => setField('subtitle', v)} />
          <Field label={c.name} value={b.name} max={50} onChange={(v) => setField('name', v)} />
          <Field label={c.tagline} value={b.tagline} max={80} onChange={(v) => setField('tagline', v)} />
          <Field label={c.whatsapp} value={b.whatsapp} max={20} onChange={(v) => setField('whatsapp', v)} />
          <Field label={c.phone} value={b.phone} max={20} onChange={(v) => setField('phone', v)} />
          <Field label={c.email} value={b.email} max={60} onChange={(v) => setField('email', v)} />
          <Field label={c.web} value={b.web} max={60} onChange={(v) => setField('web', v)} />
          <div className="sm:col-span-2"><Field label={c.address} value={b.address} max={110} onChange={(v) => setField('address', v)} /></div>
          <div className="sm:col-span-2"><Field label={c.note2} value={b.note} rows={2} max={160} onChange={(v) => setField('note', v)} /></div>
        </div>
        <input ref={logoPicker} type="file" accept="image/*" className="hidden" onChange={(e) => void onLogo(e)} />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => logoPicker.current?.click()} className={ghost}><ImagePlus className="h-4 w-4" aria-hidden="true" />{logo ? c.changeLogo : c.addLogo}</button>
          {logo && <button type="button" onClick={() => setLogo(null)} className="min-h-11 rounded-lg px-3 text-xs font-semibold text-red-700 underline">{c.removeLogo}</button>}
        </div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{c.products} ({rows.length}/{MAX_PRODUCTS})</h2>
        <p className="text-[11px] text-slate-500">{sample ? c.samples : c.productsHint}</p>
        <input ref={photoPicker} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void onPhotos(e)} />
        <input ref={rowPicker} type="file" accept="image/*" className="hidden" onChange={(e) => void onRowPhoto(e)} />
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy !== '' || rows.length >= MAX_PRODUCTS} onClick={() => photoPicker.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-orange-700 px-3 py-2 text-xs font-bold text-white hover:bg-orange-800 disabled:opacity-60"><ImagePlus className="h-4 w-4" aria-hidden="true" />{busy === 'photos' ? c.working : c.addPhotos}</button>
          <button type="button" disabled={rows.length >= MAX_PRODUCTS} onClick={() => { setRows((r) => [...(sample ? [] : r), newRow()]); touch(); }} className={ghost}>{c.addEmpty}</button>
        </div>
        {rows.length >= MAX_PRODUCTS && <p className="text-xs font-semibold text-slate-700">{c.full}</p>}
        <ul className="space-y-3">
          {rows.map((r, i) => (
            <li key={r.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-start gap-3">
                <button type="button" aria-label={r.image ? c.changePhoto : c.photo} onClick={() => { rowTarget.current = r.id; rowPicker.current?.click(); }} className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400">
                  {r.image ? <RowThumb image={r.image} /> : <ImagePlus className="h-6 w-6" aria-hidden="true" />}
                </button>
                <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
                  <div className="col-span-2"><Field label={`${c.productN} ${i + 1}: ${c.pname}`} value={r.name} max={70} onChange={(v) => upd(r.id, { name: v })} /></div>
                  <Field label={c.price} value={r.price} max={20} onChange={(v) => upd(r.id, { price: v })} />
                  <Field label={c.oldPrice} value={r.old} max={20} onChange={(v) => upd(r.id, { old: v })} />
                </div>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="sm:col-span-2"><Field label={c.desc} value={r.desc} max={120} onChange={(v) => upd(r.id, { desc: v })} /></div>
                <Field label={c.code} value={r.code} max={30} onChange={(v) => upd(r.id, { code: v })} />
                <Field label={c.badge} value={r.badge} max={14} onChange={(v) => upd(r.id, { badge: v })} />
                <div className="sm:col-span-2"><Field label={c.section} value={r.section} max={40} onChange={(v) => upd(r.id, { section: v })} /></div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" aria-label={c.up} disabled={i === 0} onClick={() => move(i, -1)} className={ghost}><ChevronUp className="h-4 w-4" aria-hidden="true" /></button>
                <button type="button" aria-label={c.down} disabled={i === rows.length - 1} onClick={() => move(i, 1)} className={ghost}><ChevronDown className="h-4 w-4" aria-hidden="true" /></button>
                <button type="button" disabled={rows.length >= MAX_PRODUCTS} onClick={() => dup(i)} className={ghost}><Copy className="h-4 w-4" aria-hidden="true" />{c.duplicate}</button>
                {r.image && <button type="button" onClick={() => upd(r.id, { image: null })} className="min-h-11 rounded-lg px-3 text-xs font-semibold text-slate-700 underline">{c.removePhoto}</button>}
                <button type="button" onClick={() => del(r.id)} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" aria-hidden="true" />{c.remove}</button>
              </div>
            </li>
          ))}
        </ul>
        {message && <p role="alert" className="text-xs font-semibold text-red-700">{message}</p>}
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{c.layout}</h2>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={c.layout}>
          {(Object.keys(LAYOUTS) as LayoutId[]).map((id) => <button key={id} type="button" role="radio" aria-checked={layout === id} onClick={() => { setLayout(id); setPage(0); }} className={`${pick} ${layout === id ? on : off}`}>{c.layouts[id]}</button>)}
        </div>
        <h2 className={heading}>{c.pageSize}</h2>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={c.pageSize}>
          {(Object.keys(PAGE_SIZES) as PageSizeId[]).map((id) => (
            <button key={id} type="button" role="radio" aria-checked={sizeId === id} onClick={() => setSizeId(id)} className={`${pick} text-left ${sizeId === id ? on : off}`}><span className="block">{c.sizes[id][0]}</span><span className="block text-[11px] font-normal opacity-80">{c.sizes[id][1]}</span></button>
          ))}
        </div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{c.design}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" role="radiogroup" aria-label={c.design}>
          {CATALOGUE_DESIGNS.map((x) => (
            <button key={x.id} type="button" role="radio" aria-checked={design === x.id} onClick={() => setDesign(x.id)} className={`rounded-xl border-2 p-1.5 text-left ${design === x.id ? 'border-orange-700 bg-orange-50' : 'border-transparent hover:border-slate-300'}`}>
              <CatalogueThumb spec={{ kind: 'cover' }} business={dBusiness} products={dProducts} options={{ ...dOptions, design: x, pal: palOf(palette || x.pal), headFont: headFont || x.headFont, bodyFont: bodyFont || x.bodyFont }} ready={fonts} />
              <span className="mt-1 block text-xs font-bold text-slate-900">{x.name}</span>
              <span className="block text-[11px] text-slate-500">{x.blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{c.look}</h2>
        <div>
          <p className="mb-1 text-xs font-semibold text-slate-700">{c.palette}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={c.palette}>
            <button type="button" role="radio" aria-checked={palette === ''} onClick={() => setPalette('')} className={`${pick} ${palette === '' ? on : off}`}>{c.paletteDefault}</button>
            {PALETTES.map((p) => (
              <button key={p.id} type="button" role="radio" aria-checked={palette === p.id} aria-label={p.id.replace('-', ' ')} onClick={() => setPalette(p.id)} className={`flex h-11 w-16 overflow-hidden rounded-lg border-2 ${palette === p.id ? 'border-orange-700' : 'border-slate-200'}`}>
                <span className="w-1/2" style={{ background: `#${p.bg}` }} /><span className="w-1/4" style={{ background: `#${p.accent}` }} /><span className="w-1/4" style={{ background: `#${p.accent2}` }} />
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block text-xs font-semibold text-slate-700">{c.headFont}
            <select value={headFont || d.headFont} onChange={(e) => setHeadFont(e.target.value)} className={fieldClass}>{HEAD_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}</select>
          </label>
          <label className="block text-xs font-semibold text-slate-700">{c.bodyFont}
            <select value={bodyFont || d.bodyFont} onChange={(e) => setBodyFont(e.target.value)} className={fieldClass}>{BODY_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}</select>
          </label>
          <label className="block text-xs font-semibold text-slate-700">{c.currency}
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={fieldClass}>{CURRENCIES.map((x) => <option key={x} value={x}>{x || c.noCurrency}</option>)}</select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={c.fit}>
          <button type="button" role="radio" aria-checked={fit === 'cover'} onClick={() => setFit('cover')} className={`${pick} ${fit === 'cover' ? on : off}`}>{c.fitCover}</button>
          <button type="button" role="radio" aria-checked={fit === 'contain'} onClick={() => setFit('contain')} className={`${pick} ${fit === 'contain' ? on : off}`}>{c.fitContain}</button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Toggle label={c.showPrice} checked={showPrice} onChange={setShowPrice} />
          <Toggle label={c.showDesc} checked={showDesc} onChange={setShowDesc} />
          <Toggle label={c.showCode} checked={showCode} onChange={setShowCode} />
          <Toggle label={c.qr} checked={qr} onChange={setQr} />
        </div>
        {(headFont || bodyFont || palette) && <button type="button" onClick={() => { setHeadFont(''); setBodyFont(''); setPalette(''); }} className="text-xs font-semibold text-orange-700 underline">{c.paletteDefault}</button>}
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{c.preview}</h2>
        <div className="flex items-center justify-between gap-2">
          <button type="button" disabled={last === 0} onClick={() => setPage(last - 1)} className={ghost}><ChevronLeft className="h-4 w-4" aria-hidden="true" />{c.prev}</button>
          <span className="text-xs font-bold text-slate-800" aria-live="polite">{c.pageOf} {last + 1} {c.of} {pages.length}</span>
          <button type="button" disabled={last >= pages.length - 1} onClick={() => setPage(last + 1)} className={ghost}>{c.next}<ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
        </div>
        <div className="flex justify-center rounded-lg bg-slate-100 p-3">
          <canvas ref={preview} role="img" aria-label={c.preview} className="h-auto w-full rounded shadow-lg" style={{ maxWidth: sizeId === 'phone' ? 360 : 520 }} />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button type="button" disabled={busy !== ''} onClick={() => void make('pdf')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-700 px-4 py-3 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-60"><Download className="h-4 w-4" aria-hidden="true" />{busy === 'pdf' ? c.working : c.downloadPdf}</button>
          <button type="button" disabled={busy !== ''} onClick={() => void make('zip')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-orange-700 bg-white px-4 py-3 text-sm font-bold text-orange-800 hover:bg-orange-50 disabled:opacity-60"><Download className="h-4 w-4" aria-hidden="true" />{busy === 'zip' ? c.working : c.downloadZip}</button>
        </div>
        <div><ConfirmButton label={c.startAgain} confirmLabel={c.startAgainConfirm} onConfirm={startAgain} disabled={busy !== ''} /></div>
        {notice && <p role="status" className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">{c.startedAgain}</p>}
        <ul className="list-disc space-y-1 pl-5 text-[11px] text-slate-500">{c.notes.map((n) => <li key={n}>{n}</li>)}</ul>
      </section>
    </div>
  );
};

const RowThumb: React.FC<{ image: CatImage }> = ({ image }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current, ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    cv.width = 80; cv.height = 80;
    const k = Math.max(80 / image.width, 80 / image.height);
    ctx.drawImage(image.source, (80 - image.width * k) / 2, (80 - image.height * k) / 2, image.width * k, image.height * k);
  }, [image]);
  return <canvas ref={ref} className="h-full w-full" aria-hidden="true" />;
};

export default ProductCatalogueMaker;
