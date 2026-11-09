import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Download, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { Note } from '../../finance/ui';
import { Toggle, Slider, card, heading } from '../paper/controls';
import { fieldClass } from '../utilities/common';
import { POSTER_THEMES, findPosterTheme } from '../../../config/posterThemes';
import { POSTER_MAX_PRODUCTS, POSTER_SAMPLE_PRODUCTS, POSTER_SAMPLE_SHOP, POSTER_SHOP_STORAGE_KEY } from '../../../config/posterSamples';
import { POSTER_FORMATS, type FormatId } from '../../../lib/poster/layout';
import { renderPoster, type PosterProduct, type PosterShop } from '../../../lib/poster/render';
import { loadPhoto, loadPhotoFromUrl, type LoadedImage } from '../../../lib/poster/images';
import { loadPosterFonts } from '../../../lib/poster/fonts';
import { slugify } from '../../../lib/utilities/text';

interface Row { id: number; name: string; original: string; price: string; image: LoadedImage | null; zoom: number; offsetX: number; offsetY: number; fit: 'cover' | 'contain' }

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

const toProduct = (row: Row): PosterProduct => ({
  name: row.name, original: row.original, price: row.price, image: row.image?.source ?? null, iw: row.image?.width ?? 0, ih: row.image?.height ?? 0,
  zoom: row.zoom, offsetX: row.offsetX, offsetY: row.offsetY, fit: row.fit,
});

export const OfferPosterMaker: React.FC = () => {
  const [format, setFormat] = useState<FormatId>('post');
  const [themeId, setThemeId] = useState(POSTER_THEMES[0].id);
  const [shop, setShop] = useState<PosterShop>(readShop);
  const [rows, setRows] = useState<Row[]>([]);
  const [showBadges, setShowBadges] = useState(true);
  const [showOfferBadge, setShowOfferBadge] = useState(true);
  const [fonts, setFonts] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [message, setMessage] = useState('');
  const nextId = useRef(1);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const pickFor = useRef<number | null>(null);

  // Fonts come from Google Fonts, only on this page. Designs fall back to system fonts if they cannot load.
  useEffect(() => {
    let alive = true;
    loadPosterFonts().then((ok) => { if (alive) setFonts(ok ? 'ready' : 'failed'); });
    return () => { alive = false; };
  }, []);

  // Starter products with their sample photos.
  useEffect(() => {
    let alive = true;
    Promise.all(POSTER_SAMPLE_PRODUCTS.map(async (sample) => {
      let image: LoadedImage | null = null;
      try { image = await loadPhotoFromUrl(sample.image); } catch { /* shown as an empty photo box */ }
      return { id: nextId.current++, name: sample.name, original: sample.original, price: sample.price, image, zoom: 1, offsetX: 0, offsetY: 0, fit: 'cover' as const };
    })).then((list) => { if (alive) setRows((current) => (current.length ? current : list)); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(POSTER_SHOP_STORAGE_KEY, JSON.stringify(shop)); } catch { /* storage unavailable */ }
  }, [shop]);

  const input = useMemo(() => ({ shop, products: rows.map(toProduct), showBadges, showOfferBadge }), [shop, rows, showBadges, showOfferBadge]);
  const deferred = useDeferredValue(input);
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

  const update = (id: number, patch: Partial<Row>) => setRows((list) => list.map((row) => (row.id === id ? { ...row, ...patch } : row)));
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

  const addRow = () => setRows((list) => (list.length >= POSTER_MAX_PRODUCTS ? list : [...list, { id: nextId.current++, name: '', original: '', price: '', image: null, zoom: 1, offsetX: 0, offsetY: 0, fit: 'cover' }]));
  const removeRow = (id: number) => setRows((list) => list.filter((row) => row.id !== id));

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
      link.download = `${slugify(shop.name) || 'offer'}-${theme.id}-${format}.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    }, 'image/png');
  };

  return (
    <div className="space-y-4">
      <Note>
        Fill in your shop details and prices, pick a design, and download a PNG for Instagram, WhatsApp or print. Photos and prices stay on your device.
        Only the design fonts are downloaded from Google Fonts, so Google&rsquo;s servers are contacted for that and for nothing else on this page.
        {fonts === 'failed' && ' The fonts could not be loaded just now, so a plainer set of fonts is used in the preview.'}
      </Note>

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
              <ThemeThumb themeId={item.id} format={format} input={deferred} fonts={fonts} />
              <span className="mt-1 block text-xs font-bold text-slate-900">{item.name}</span>
              <span className="block text-[11px] text-slate-500">{item.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={card}>
        <h3 className={heading}>3. Shop details</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">Shop name<input className={fieldClass} value={shop.name} maxLength={50} onChange={setField('name')} /></label>
          <label className="block text-xs font-semibold text-slate-700">Big heading<input className={fieldClass} value={shop.headline} maxLength={24} onChange={setField('headline')} placeholder="BIG SALE" /></label>
          <label className="block text-xs font-semibold text-slate-700 sm:col-span-2">Line under the name<input className={fieldClass} value={shop.tagline} maxLength={90} onChange={setField('tagline')} placeholder="Offers valid till Sunday" /></label>
          <label className="block text-xs font-semibold text-slate-700">WhatsApp number<input className={fieldClass} value={shop.whatsapp} inputMode="tel" maxLength={20} onChange={setField('whatsapp')} /></label>
          <label className="block text-xs font-semibold text-slate-700">Facebook page or ID<input className={fieldClass} value={shop.facebook} maxLength={60} onChange={setField('facebook')} /></label>
          <label className="block text-xs font-semibold text-slate-700">Instagram ID<input className={fieldClass} value={shop.instagram} maxLength={40} onChange={setField('instagram')} placeholder="yourshop" /></label>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Your shop details are remembered in this browser for next time. Leave a contact empty to hide it.</p>
      </div>

      <div className={card}>
        <h3 className={heading}>4. Products ({rows.length} of {POSTER_MAX_PRODUCTS})</h3>
        <input ref={picker} type="file" accept="image/*" className="hidden" onChange={onPicked} />
        <div className="mt-2 space-y-3">
          {rows.map((row, index) => (
            <div key={row.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-start gap-3">
                <button type="button" onClick={() => choosePhoto(row.id)} aria-label={`Change photo for product ${index + 1}`}
                  className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                  <PhotoThumb image={row.image} />
                </button>
                <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
                  <label className="col-span-2 block text-[11px] font-semibold text-slate-600">Product name<input className={fieldClass} value={row.name} maxLength={60} onChange={(e) => update(row.id, { name: e.target.value })} /></label>
                  <label className="block text-[11px] font-semibold text-slate-600">Old price<input className={fieldClass} value={row.original} inputMode="decimal" maxLength={12} onChange={(e) => update(row.id, { original: e.target.value })} /></label>
                  <label className="block text-[11px] font-semibold text-slate-600">New price<input className={fieldClass} value={row.price} inputMode="decimal" maxLength={12} onChange={(e) => update(row.id, { price: e.target.value })} /></label>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => choosePhoto(row.id)} className={small}><ImagePlus size={14} /> {row.image ? 'Change photo' : 'Add photo'}</button>
                <button type="button" onClick={() => removeRow(row.id)} className={small}><Trash2 size={14} /> Remove</button>
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
        <button type="button" onClick={addRow} disabled={rows.length >= POSTER_MAX_PRODUCTS} className={`${small} mt-3`}><Plus size={14} /> Add product</button>
        <div className="mt-3 space-y-2">
          <Toggle label="Show the discount on each photo" checked={showBadges} onChange={setShowBadges} hint="Worked out from the old and new price." />
          <Toggle label="Show the big “up to % off” badge" checked={showOfferBadge} onChange={setShowOfferBadge} hint="Uses the largest discount among your products." />
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
          Story size keeps your text clear of the areas Instagram covers with its own buttons. Check the preview once more after fonts finish loading.
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

/** Small preview of one design with the visitor's own details. */
const ThemeThumb: React.FC<{ themeId: string; format: FormatId; input: Parameters<typeof renderPoster>[3]; fonts: string }> = ({ themeId, format, input, fonts }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const f = POSTER_FORMATS[format];
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const width = 180;
    const scale = width / f.w;
    canvas.width = width;
    canvas.height = Math.round(f.h * scale);
    ctx.save();
    ctx.scale(scale, scale);
    renderPoster(ctx, findPosterTheme(themeId), f, input, input.products.length);
    ctx.restore();
  }, [themeId, f, input, fonts]);
  return <canvas ref={ref} className="h-auto w-full rounded" />;
};

export default OfferPosterMaker;
