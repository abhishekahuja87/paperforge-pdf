import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Pencil, ZoomIn } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageMetadata } from '../components/common/PageMetadata';
import { downloadBlob } from '../lib/browserTools';
import { findPosterTheme } from '../config/posterThemes';
import { POSTER_COUNTS } from '../config/posterSamples';
import { POSTER_FORMATS, type FormatId } from '../lib/poster/layout';
import { renderPoster, type Hit, type PosterInput, type PosterProduct, type PosterShop } from '../lib/poster/render';
import { loadPhoto, type LoadedImage } from '../lib/poster/images';
import { loadPosterFonts } from '../lib/poster/fonts';
import { loadSamplePhotos } from '../lib/poster/samples';
import { AC1_PRODUCTS, AC1_SHOP } from './ac1Defaults';
import '../components/tools/shops/posterFonts.css';
import './ac1-poster.css';

type Row = { name: string; original: string; price: string; image: LoadedImage | null; zoom: number; offsetY: number; fit: 'cover' | 'contain' };

const FORMATS: FormatId[] = ['a4', 'post', 'portrait', 'story'];
const LIMITS = { name: 60, tagline: 100, whatsapp: 50, facebook: 80, instagram: 80, productName: 32, price: 12 };

const toProduct = (row: Row): PosterProduct => ({ name: row.name, original: row.original, price: row.price, image: row.image?.source ?? null, iw: row.image?.width ?? 0, ih: row.image?.height ?? 0, zoom: row.zoom, offsetX: 0, offsetY: row.offsetY, fit: row.fit, badge: '' });

/** What each pencil edits: a label for the editor and the field it changes. */
function describe(id: string): { label: string; max: number } {
  if (id === 'shop.name') return { label: 'Shop name', max: LIMITS.name };
  if (id === 'shop.tagline') return { label: 'Subheading', max: LIMITS.tagline };
  if (id === 'footer.whatsapp') return { label: 'WhatsApp number', max: LIMITS.whatsapp };
  if (id === 'footer.facebook') return { label: 'Facebook link', max: LIMITS.facebook };
  if (id === 'footer.instagram') return { label: 'Instagram link', max: LIMITS.instagram };
  const [product, field] = id.split('.');
  const n = Number(product.slice(1)) + 1;
  if (field === 'name') return { label: `Product ${n} name`, max: LIMITS.productName };
  return { label: `Product ${n} price`, max: LIMITS.price };
}

export function Ac1PosterPage() {
  const [params] = useSearchParams();
  const theme = findPosterTheme(params.get('design') ?? '');
  const initialCount = Number(params.get('count'));
  const initialFormat = params.get('format');
  const [count, setCount] = useState(POSTER_COUNTS.includes(initialCount) ? initialCount : 6);
  const [format, setFormat] = useState<FormatId>(FORMATS.includes(initialFormat as FormatId) ? (initialFormat as FormatId) : 'a4');
  const [shop, setShop] = useState<PosterShop>({ ...AC1_SHOP, headline: '' });
  const [rows, setRows] = useState<Row[]>([]);
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const fmt = POSTER_FORMATS[format];

  useEffect(() => {
    let alive = true;
    Promise.all([loadPosterFonts(), loadSamplePhotos()]).then(([, photos]) => {
      if (!alive) return;
      setRows(AC1_PRODUCTS.map((product, i) => ({ name: product.name, original: product.original, price: product.price, image: photos[i] ?? null, zoom: 1, offsetY: 0, fit: 'cover' })));
      setReady(true);
    });
    return () => { alive = false; };
  }, []);

  const shown = useMemo(() => rows.slice(0, count), [rows, count]);
  const input = useMemo<PosterInput>(() => ({ shop, products: shown.map(toProduct), emphasis: 'photos', offerBadge: '' }), [shop, shown]);

  // Draw the editable view, and note where each element sits so the pencil buttons can be placed over it.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !ready) return;
    canvas.width = fmt.w;
    canvas.height = fmt.h;
    const collected: Hit[] = [];
    renderPoster(ctx, theme, fmt, { ...input, edit: { hits: collected } }, input.products.length);
    setHits(collected);
  }, [input, theme, fmt, ready]);

  const updateRow = (index: number, patch: Partial<Row>) => setRows((list) => list.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const valueOf = (id: string): string => {
    if (id === 'shop.name') return shop.name;
    if (id === 'shop.tagline') return shop.tagline;
    if (id.startsWith('footer.')) return shop[id.slice(7) as 'whatsapp' | 'facebook' | 'instagram'];
    return '';
  };
  const setValue = (id: string, value: string) => {
    if (id === 'shop.name') setShop((s) => ({ ...s, name: value }));
    else if (id === 'shop.tagline') setShop((s) => ({ ...s, tagline: value }));
    else if (id.startsWith('footer.')) setShop((s) => ({ ...s, [id.slice(7)]: value }));
    else {
      const [product, field] = id.split('.');
      updateRow(Number(product.slice(1)), field === 'name' ? { name: value } : {});
    }
  };

  const changePhoto = async (index: number, file: File | undefined) => {
    if (!file) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { setError('Choose a JPG, PNG or WebP image smaller than 10 MB.'); return; }
    try { updateRow(index, { image: await loadPhoto(file), zoom: 1, offsetY: 0, fit: 'contain' }); } catch { setError('Could not load that image. Please choose another file.'); }
  };

  const download = () => {
    setBusy(true);
    setError('');
    const canvas = document.createElement('canvas');
    canvas.width = fmt.w;
    canvas.height = fmt.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setBusy(false); return; }
    renderPoster(ctx, theme, fmt, input, input.products.length);
    canvas.toBlob((blob) => {
      setBusy(false);
      if (!blob) { setError('The browser could not create the PNG.'); return; }
      downloadBlob(blob, `catalog-${theme.id}-${format}.png`);
    }, 'image/png');
  };

  const activeHit = hits.find((hit) => hit.id === active);
  const activeProduct = active?.startsWith('p') ? Number(active.slice(1).split('.')[0]) : -1;
  const pct = (value: number, total: number) => `${(value / total) * 100}%`;
  const place = (rect: Hit['rect']) => ({ left: pct(rect.x, fmt.w), top: pct(rect.y, fmt.h), width: pct(rect.w, fmt.w), height: pct(rect.h, fmt.h) });

  const textId = active && !active.endsWith('.photo') && !active.endsWith('.price') ? active : null;
  const priceIndex = active?.endsWith('.price') ? activeProduct : -1;

  return (
    <div className="ac1p-stage" lang="en">
      <PageMetadata title="Pamphlet Editor" description="Edit a pamphlet design." noindex />
      <div className="ac1p-top">
        <Link to="/ac1">← All templates</Link>
        <p>{theme.name}. Use the pencil icons to edit text and the photo buttons to replace, zoom or move images. Changes are not saved after you leave this page.</p>
        <div className="ac1p-options">
          <label>Products
            <select value={count} onChange={(event) => { setCount(Number(event.target.value)); setActive(null); }}>{POSTER_COUNTS.map((n) => <option key={n} value={n}>{n}</option>)}</select>
          </label>
          <label>Image size
            <select value={format} onChange={(event) => { setFormat(event.target.value as FormatId); setActive(null); }} disabled={busy}>
              {FORMATS.map((id) => <option key={id} value={id}>{POSTER_FORMATS[id].label} ({POSTER_FORMATS[id].w} × {POSTER_FORMATS[id].h})</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="ac1p-canvas-wrap" style={{ maxWidth: format === 'story' ? 380 : format === 'a4' ? 620 : 560 }}>
        <canvas ref={canvasRef} className="ac1p-canvas" role="img" aria-label="Pamphlet" />
        {hits.map((hit) => {
          const label = describe(hit.id).label;
          if (hit.id.endsWith('.photo')) {
            const index = Number(hit.id.slice(1).split('.')[0]);
            return (
              <div key={hit.id} className={`ac1p-hit ac1p-photo${active === hit.id ? ' is-active' : ''}`} style={place(hit.rect)}>
                <div className="ac1p-photo-buttons">
                  <button type="button" aria-label={`Adjust photo for product ${index + 1}`} onClick={() => setActive(active === hit.id ? null : hit.id)}><ZoomIn size={15} aria-hidden="true" /></button>
                  <button type="button" aria-label={`Change photo for product ${index + 1}`} onClick={() => { setActive(hit.id); photoInput.current?.click(); }}><ImagePlus size={15} aria-hidden="true" /></button>
                </div>
              </div>
            );
          }
          return (
            <button key={hit.id} type="button" className={`ac1p-hit${active === hit.id ? ' is-active' : ''}`} style={place(hit.rect)} aria-label={`Edit ${label}`} onClick={() => setActive(active === hit.id ? null : hit.id)}>
              <span className="ac1p-pencil" aria-hidden="true"><Pencil size={13} /></span>
            </button>
          );
        })}
        <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (activeProduct >= 0) void changePhoto(activeProduct, file); }} />
      </div>

      {activeHit && (
        <div className="ac1p-editor" role="group" aria-label="Edit">
          {active?.endsWith('.photo') && rows[activeProduct] && (
            <>
              <strong>Product {activeProduct + 1} photo</strong>
              <label>Zoom {Math.round(rows[activeProduct].zoom * 100)}%
                <input type="range" min="1" max="3" step="0.1" value={rows[activeProduct].zoom} onChange={(event) => updateRow(activeProduct, { zoom: Number(event.target.value), fit: 'cover' })} />
              </label>
              <label>Up / down
                <input type="range" min="-1" max="1" step="0.05" value={rows[activeProduct].offsetY} onChange={(event) => updateRow(activeProduct, { offsetY: Number(event.target.value), fit: 'cover' })} />
              </label>
              <div className="ac1p-editor-row">
                <button type="button" onClick={() => photoInput.current?.click()}>Change photo</button>
                <button type="button" onClick={() => updateRow(activeProduct, { fit: rows[activeProduct].fit === 'contain' ? 'cover' : 'contain' })}>{rows[activeProduct].fit === 'contain' ? 'Fill the frame' : 'Show whole photo'}</button>
                <button type="button" onClick={() => setActive(null)}>Done</button>
              </div>
            </>
          )}
          {textId && (
            <>
              <label><strong>{describe(textId).label}</strong>
                <input autoFocus value={textId.startsWith('p') ? rows[activeProduct]?.name ?? '' : valueOf(textId)} maxLength={describe(textId).max}
                  onChange={(event) => setValue(textId, event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === 'Escape') setActive(null); }} />
              </label>
              <div className="ac1p-editor-row"><button type="button" onClick={() => setActive(null)}>Done</button></div>
            </>
          )}
          {priceIndex >= 0 && rows[priceIndex] && (
            <>
              <strong>Product {priceIndex + 1} price</strong>
              <div className="ac1p-price-fields">
                <label>Original price<input autoFocus value={rows[priceIndex].original} maxLength={LIMITS.price} onChange={(event) => updateRow(priceIndex, { original: event.target.value })} /></label>
                <label>Sale price<input value={rows[priceIndex].price} maxLength={LIMITS.price} onChange={(event) => updateRow(priceIndex, { price: event.target.value })} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === 'Escape') setActive(null); }} /></label>
              </div>
              <div className="ac1p-editor-row"><button type="button" onClick={() => setActive(null)}>Done</button></div>
            </>
          )}
        </div>
      )}

      <div className="ac1p-download">
        <button type="button" onClick={download} disabled={busy || !ready}>{busy ? 'Preparing image…' : 'Download PNG'}</button>
        {error && <p role="alert">{error}</p>}
      </div>
    </div>
  );
}
