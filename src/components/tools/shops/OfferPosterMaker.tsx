import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Download, ImagePlus } from 'lucide-react';
import { Note } from '../../finance/ui';
import { Toggle, Slider, card, heading } from '../paper/controls';
import { fieldClass } from '../utilities/common';
import { POSTER_THEMES, findPosterTheme } from '../../../config/posterThemes';
import { loadSamplePhotos } from '../../../lib/poster/samples';
import { POSTER_COUNTS, POSTER_SAMPLE_PRODUCTS, POSTER_SAMPLE_SHOP, POSTER_SHOP_STORAGE_KEY } from '../../../config/posterSamples';
import { POSTER_FORMATS, type FormatId } from '../../../lib/poster/layout';
import { discountPercent, bestDiscount } from '../../../lib/poster/discount';
import { renderPoster, type Emphasis, type PosterProduct, type PosterShop } from '../../../lib/poster/render';
import { loadPhoto, type LoadedImage } from '../../../lib/poster/images';
import { PosterThumb } from './PosterThumb';
import { loadPosterFonts } from '../../../lib/poster/fonts';
import './posterFonts.css';
import { generateFileName } from '../../../lib/pdf/naming';

interface Row { id: number; name: string; original: string; price: string; image: LoadedImage | null; zoom: number; offsetX: number; offsetY: number; fit: 'cover' | 'contain'; badge: string; badgeEdited: boolean }

const FORMAT_ORDER: FormatId[] = ['post', 'portrait', 'story', 'a4'];
const FORMAT_HINT: Record<FormatId, string> = { post: '1080 × 1080', portrait: '1080 × 1350', story: '1080 × 1920', a4: 'A4 print' };
const small = 'inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

function readShop(): PosterShop {
  try {
    const raw = localStorage.getItem(POSTER_SHOP_STORAGE_KEY);
    if (raw) return { ...POSTER_SAMPLE_SHOP, ...(JSON.parse(raw) as Partial<PosterShop>) };
  } catch { /* storage unavailable */ }
  return POSTER_SAMPLE_SHOP;
}

/** Badge text worked out from the two prices, until the owner types their own. */
const autoBadge = (original: string, price: string) => { const pct = discountPercent(original, price); return pct > 0 ? `${pct}% OFF` : ''; };
const autoOffer = (products: { original: string; price: string }[]) => { const top = bestDiscount(products); return top > 0 ? `UP TO ${top}% OFF` : ''; };

const EMPHASIS: { value: Emphasis; label: string }[] = [{ value: 'photos', label: 'Bigger photos' }, { value: 'balanced', label: 'Balanced' }, { value: 'text', label: 'Bigger text' }];

const toProduct = (row: Row): PosterProduct => ({
  name: row.name, original: row.original, price: row.price, image: row.image?.source ?? null, iw: row.image?.width ?? 0, ih: row.image?.height ?? 0,
  zoom: row.zoom, offsetX: row.offsetX, offsetY: row.offsetY, fit: row.fit, badge: row.badge,
});

export const OfferPosterMaker: React.FC = () => {
  const [format, setFormat] = useState<FormatId>('post');
  const [themeId, setThemeId] = useState(POSTER_THEMES[0].id);
  const [shop, setShop] = useState<PosterShop>(readShop);
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(6);
  const [qr, setQr] = useState(false);
  const [emphasis, setEmphasis] = useState<Emphasis>('photos');
  const [offerText, setOfferText] = useState<string | null>(null);
  const [fonts, setFonts] = useState<'loading' | 'ready'>('loading');
  const [message, setMessage] = useState('');
  const nextId = useRef(1);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const pickFor = useRef<number | null>(null);

  // Wait for the bundled fonts, then draw again.
  useEffect(() => {
    let alive = true;
    loadPosterFonts().then(() => { if (alive) setFonts('ready'); });
    return () => { alive = false; };
  }, []);

  // Starter products with their sample photos.
  useEffect(() => {
    let alive = true;
    loadSamplePhotos().then((photos) => {
      const list = POSTER_SAMPLE_PRODUCTS.map((sample, i) => ({ id: nextId.current++, name: sample.name, original: sample.original, price: sample.price, image: photos[i] ?? null, zoom: 1, offsetX: 0, offsetY: 0, fit: 'cover' as const, badge: autoBadge(sample.original, sample.price), badgeEdited: false }));
      if (alive) setRows((current) => (current.length ? current : list));
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(POSTER_SHOP_STORAGE_KEY, JSON.stringify(shop)); } catch { /* storage unavailable */ }
  }, [shop]);

  const shown = useMemo(() => rows.slice(0, count), [rows, count]);
  const offerBadge = offerText ?? autoOffer(shown);
  const input = useMemo(() => ({ shop, products: shown.map(toProduct), emphasis, offerBadge, qr }), [shop, shown, emphasis, offerBadge, qr]);
  const deferred = useDeferredValue(input);
  // Previews draw at most six products, which is enough to judge a design and keeps sixteen drawings quick.
  const thumbInput = useMemo(() => ({ ...deferred, products: deferred.products.slice(0, 6) }), [deferred]);
  const theme = findPosterTheme(themeId);
  const fmt = POSTER_FORMATS[format];

  useEffect(() => {
    const canvas = previewRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = fmt.w;
    canvas.height = fmt.h;
    renderPoster(ctx, theme, fmt, deferred, deferred.products.length);
  }, [deferred, theme, fmt, fonts]);

  const update = (id: number, patch: Partial<Row>) => setRows((list) => list.map((row) => {
    if (row.id !== id) return row;
    const next = { ...row, ...patch };
    if (!next.badgeEdited && ('original' in patch || 'price' in patch)) next.badge = autoBadge(next.original, next.price);
    return next;
  }));
  const setField = (key: keyof PosterShop) => (event: React.ChangeEvent<HTMLInputElement>) => setShop((current) => ({ ...current, [key]: event.target.value }));

  const choosePhoto = (id: number) => { pickFor.current = id; picker.current?.click(); };
  const onPicked = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const id = pickFor.current;
    event.target.value = '';
    if (!file || id === null) return;
    try {
      const image = await loadPhoto(file);
      setMessage('');
      update(id, { image, zoom: 1, offsetX: 0, offsetY: 0 });
    } catch {
      setMessage('That file could not be read as an image. Try a JPG, PNG or WebP photo.');
    }
  }, []);

  const download = () => {
    const canvas = document.createElement('canvas');
    canvas.width = fmt.w;
    canvas.height = fmt.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderPoster(ctx, theme, fmt, input, input.products.length);
    canvas.toBlob((blob) => {
      if (!blob) { setMessage('The picture could not be created. Try fewer or smaller photos.'); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generateFileName('offer-poster', 'png', { base: shop.name || 'offer', details: `${theme.id}-${format}` });
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    }, 'image/png');
  };

  return (
    <div className="space-y-4">
      <Note>Fill in your shop details and prices, pick a design, and download a PNG for Instagram, WhatsApp or print. Photos and prices stay on your device.</Note>

      <div className={card}>
        <h3 className={heading}>1. Size</h3>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FORMAT_ORDER.map((id) => (
            <button key={id} type="button" onClick={() => setFormat(id)} aria-pressed={format === id}
              className={`min-h-12 rounded-lg border px-2 py-2 text-left text-xs ${format === id ? 'border-orange-700 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700'}`}>
              <span className="block font-bold">{POSTER_FORMATS[id].label}</span>
              <span className="block text-[11px] opacity-80">{FORMAT_HINT[id]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={card}>
        <h3 className={heading}>2. Design</h3>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {POSTER_THEMES.map((item) => (
            <button key={item.id} type="button" onClick={() => setThemeId(item.id)} aria-pressed={themeId === item.id} aria-label={`${item.name} design`}
              className={`rounded-lg border-2 p-1.5 text-left ${themeId === item.id ? 'border-orange-700' : 'border-transparent hover:border-slate-300'}`}>
              <PosterThumb themeId={item.id} format={format} input={thumbInput} ready={fonts} />
              <span className="mt-1 block text-xs font-bold text-slate-900">{item.name}</span>
              <span className="block text-[11px] text-slate-500">{item.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={card}>
        <h3 className={heading}>3. Top of the poster</h3>
        <p className="mt-1 text-[11px] text-slate-500">Everything is optional. Leave a box empty and that part is left out.</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">Shop name<input className={fieldClass} value={shop.name} maxLength={50} onChange={setField('name')} /></label>
          <label className="block text-xs font-semibold text-slate-700">Big heading<input className={fieldClass} value={shop.headline} maxLength={24} onChange={setField('headline')} placeholder="DIWALI SALE" /></label>
          <label className="block text-xs font-semibold text-slate-700 sm:col-span-2">Small line<input className={fieldClass} value={shop.tagline} maxLength={90} onChange={setField('tagline')} placeholder="Best prices this week · New stock in" /></label>
          <label className="block text-xs font-semibold text-slate-700 sm:col-span-2">Badge in the corner
            <input className={fieldClass} value={offerBadge} maxLength={28} onChange={(e) => setOfferText(e.target.value)} placeholder="UP TO 30% OFF, FLAT 200 OFF, NEW" />
            <span className="mt-1 block text-[11px] font-normal text-slate-500">
              Type anything: a percentage, an amount or words. It follows your biggest discount until you change it.
              {offerText !== null && <button type="button" onClick={() => setOfferText(null)} className="ml-1 font-semibold text-orange-700 underline">Use automatic</button>}
            </span>
          </label>
        </div>
      </div>

      <div className={card}>
        <h3 className={heading}>4. Bottom of the poster</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <label className="block text-xs font-semibold text-slate-700">WhatsApp number<input className={fieldClass} value={shop.whatsapp} inputMode="tel" maxLength={20} onChange={setField('whatsapp')} /></label>
          <label className="block text-xs font-semibold text-slate-700">Facebook page name<input className={fieldClass} value={shop.facebook} maxLength={60} onChange={setField('facebook')} /></label>
          <label className="block text-xs font-semibold text-slate-700">Instagram ID<input className={fieldClass} value={shop.instagram} maxLength={40} onChange={setField('instagram')} /></label>
        </div>
        <div className="mt-3">
          <Toggle label="Show QR codes" checked={qr} onChange={setQr} hint="A code above each contact that opens WhatsApp, your Facebook page or your Instagram profile when scanned." />
          {qr && (
            <label className="mt-2 block max-w-[14rem] text-xs font-semibold text-slate-700">Country code for the WhatsApp link
              <input className={fieldClass} value={shop.countryCode ?? ''} inputMode="numeric" maxLength={4} placeholder="91" onChange={setField('countryCode')} />
              <span className="mt-1 block text-[11px] font-normal text-slate-500">Added before your number. Leave empty if the number already starts with +.</span>
            </label>
          )}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          A picture cannot hold a clickable link, so people see your name or ID. Turn on QR codes to let them scan to open it, and put the full link in your post caption. Empty boxes are left out. Your details are remembered in this browser.
        </p>
      </div>

      <div className={card}>
        <h3 className={heading}>5. Products</h3>
        <p className="mt-1 text-[11px] text-slate-500">Fewer products means bigger photos. Name, prices and badge are all optional; empty ones are left out.</p>
        <div className="mt-2 grid grid-cols-6 gap-1.5" role="group" aria-label="Number of products">
          {POSTER_COUNTS.map((n) => (
            <button key={n} type="button" onClick={() => setCount(n)} aria-pressed={count === n}
              className={`min-h-11 rounded-lg border text-sm font-bold ${count === n ? 'border-orange-700 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700'}`}>{n}</button>
          ))}
        </div>
        <div className="mt-3">
          <span className="text-xs font-semibold text-slate-700">What gets more room</span>
          <div className="mt-1 grid grid-cols-3 gap-1.5">
            {EMPHASIS.map((item) => (
              <button key={item.value} type="button" onClick={() => setEmphasis(item.value)} aria-pressed={emphasis === item.value}
                className={`min-h-10 rounded-lg border px-1 text-xs font-semibold ${emphasis === item.value ? 'border-orange-700 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700'}`}>{item.label}</button>
            ))}
          </div>
        </div>
        <input ref={picker} type="file" accept="image/*" className="hidden" onChange={onPicked} />
        <div className="mt-3 space-y-3">
          {shown.map((row, index) => (
            <div key={row.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-start gap-3">
                <button type="button" onClick={() => choosePhoto(row.id)} aria-label={`Change photo for product ${index + 1}`}
                  className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                  <PhotoThumb image={row.image} />
                </button>
                <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
                  <label className="col-span-2 block text-[11px] font-semibold text-slate-600">Name<input className={fieldClass} value={row.name} maxLength={60} onChange={(e) => update(row.id, { name: e.target.value })} /></label>
                  <label className="block text-[11px] font-semibold text-slate-600">Old price<input className={fieldClass} value={row.original} maxLength={14} onChange={(e) => update(row.id, { original: e.target.value })} /></label>
                  <label className="block text-[11px] font-semibold text-slate-600">New price<input className={fieldClass} value={row.price} maxLength={14} onChange={(e) => update(row.id, { price: e.target.value })} /></label>
                  <label className="col-span-2 block text-[11px] font-semibold text-slate-600">Badge on photo
                    <input className={fieldClass} value={row.badge} maxLength={16} placeholder="29% OFF, 200 OFF, NEW" onChange={(e) => update(row.id, { badge: e.target.value, badgeEdited: true })} />
                  </label>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => choosePhoto(row.id)} className={small}><ImagePlus size={14} /> {row.image ? 'Change photo' : 'Add photo'}</button>
                {row.badgeEdited && <button type="button" onClick={() => update(row.id, { badgeEdited: false, badge: autoBadge(row.original, row.price) })} className={small}>Automatic badge</button>}
              </div>
              {row.image && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-600">Adjust photo</summary>
                  <div className="mt-2 space-y-2">
                    <Toggle label="Show the whole photo" checked={row.fit === 'contain'} onChange={(on) => update(row.id, { fit: on ? 'contain' : 'cover' })} />
                    {row.fit === 'cover' && (
                      <>
                        <Slider label="Zoom" value={row.zoom} min={1} max={3} step={0.05} unit="x" onChange={(v) => update(row.id, { zoom: v })} />
                        <Slider label="Left / right" value={row.offsetX} min={-1} max={1} step={0.05} unit="" onChange={(v) => update(row.id, { offsetX: v })} />
                        <Slider label="Up / down" value={row.offsetY} min={-1} max={1} step={0.05} unit="" onChange={(v) => update(row.id, { offsetY: v })} />
                      </>
                    )}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
        {message && <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{message}</p>}
      </div>

      <div className={card}>
        <h3 className={heading}>Preview</h3>
        <div className="mt-2 flex justify-center rounded-lg bg-slate-100 p-3">
          <canvas ref={previewRef} role="img" aria-label="Poster preview" className="h-auto w-full rounded shadow-lg" style={{ maxWidth: format === 'story' ? 340 : format === 'a4' ? 440 : 520 }} />
        </div>
        <button type="button" onClick={download} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-4 py-3 text-sm font-bold text-white hover:bg-orange-800">
          <Download size={16} /> Download PNG ({fmt.w} × {fmt.h})
        </button>
        <p className="mt-2 text-[11px] text-slate-500">
          Story size keeps your text clear of the areas Instagram covers with its own buttons.
        </p>
      </div>
    </div>
  );
};

const PhotoThumb: React.FC<{ image: LoadedImage | null }> = ({ image }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !image) return;
    canvas.width = 64;
    canvas.height = 64;
    const k = Math.max(64 / image.width, 64 / image.height);
    ctx.drawImage(image.source, (64 - image.width * k) / 2, (64 - image.height * k) / 2, image.width * k, image.height * k);
  }, [image]);
  return image ? <canvas ref={ref} className="h-full w-full" /> : <ImagePlus size={20} />;
};

export default OfferPosterMaker;
