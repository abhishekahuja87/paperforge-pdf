import { useRef, useState } from 'react';
import { ImagePlus, MessageCircle, Pencil, ZoomIn } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageMetadata } from '../components/common/PageMetadata';
import { downloadBlob } from '../lib/browserTools';
import { catalogDesigns, type CatalogDesign } from './catalogDesigns';
// Sample stock photos are from Pexels; filenames are their photo IDs.
import bodyCare from '../assets/ac1/14438270.jpg';
import freshCare from '../assets/ac1/6767794.jpg';
import cleansingOil from '../assets/ac1/16378442.jpg';
import dailyCleanser from '../assets/ac1/15569178.jpg';
import facialCare from '../assets/ac1/34939732.jpg';
import skinCare from '../assets/ac1/34159010.jpg';
import beautySet from '../assets/ac1/24602075.jpg';
import essentialSet from '../assets/ac1/6167442.jpg';
import glowDrops from '../assets/ac1/31251033.jpg';
import './ac1.css';
import './catalog-designs.css';

const initialShop = {
  name: 'Ahuja Collection Superstore, Balod',
  subtitle: 'Diwali Offers on huge variety of products',
  whatsapp: '78049-91800',
  facebook: 'https://www.facebook.com/ahujacollectionbalod/',
  instagram: 'https://www.instagram.com/ahujacollectionbalod/',
};

type Product = { name: string; original: string; price: string; image: string; zoom: number; offsetY: number; fit: 'cover' | 'contain' };

const initialProducts: Product[] = [
  { name: 'Body Care Duo', original: '₹699', price: '₹499', image: bodyCare },
  { name: 'Fresh Start Set', original: '₹599', price: '₹449', image: freshCare },
  { name: 'Cleansing Oil', original: '₹549', price: '₹399', image: cleansingOil },
  { name: 'Daily Cleanser', original: '₹499', price: '₹349', image: dailyCleanser },
  { name: 'Facial Care Set', original: '₹899', price: '₹699', image: facialCare },
  { name: 'Skin Care Trio', original: '₹799', price: '₹599', image: skinCare },
  { name: 'Beauty Essentials', original: '₹649', price: '₹479', image: beautySet },
  { name: 'The Essential Set', original: '₹999', price: '₹749', image: essentialSet },
  { name: 'Glow Drops', original: '₹399', price: '₹299', image: glowDrops },
  { name: 'Everyday Care', original: '₹599', price: '₹449', image: facialCare },
  { name: 'Beauty Collection', original: '₹799', price: '₹599', image: beautySet },
  { name: 'Daily Essentials', original: '₹499', price: '₹349', image: dailyCleanser },
].map((product): Product => ({ ...product, zoom: 1, offsetY: 0, fit: 'cover' }));

type EditableTextProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
};

function EditableText({ label, value, onChange, maxLength }: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  return (
    <span className="ac1-editable">
      {editing ? (
        <input
          autoFocus
          aria-label={label}
          value={value}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === 'Escape') event.currentTarget.blur(); }}
        />
      ) : <span className="ac1-editable-value">{value || <span className="ac1-empty" data-html2canvas-ignore="true">Add {label.toLowerCase()}</span>}</span>}
      <button type="button" className="ac1-edit-button" aria-label={`Edit ${label}`} onClick={() => setEditing(true)} data-html2canvas-ignore="true">
        <Pencil size={13} aria-hidden="true" />
      </button>
    </span>
  );
}

type ExportFormat = 'a4' | 'post' | 'story';
const exportSizes: Record<ExportFormat, { width: number; height: number; label: string }> = {
  a4: { width: 1240, height: 1754, label: 'A4 pamphlet' },
  post: { width: 1080, height: 1080, label: 'Instagram post' },
  story: { width: 1080, height: 1920, label: 'Instagram story' },
};

export function Ac1Page({ previewDesign }: { previewDesign?: CatalogDesign }) {
  const [searchParams] = useSearchParams();
  const design = previewDesign ?? catalogDesigns.find((item) => item.id === searchParams.get('design')) ?? catalogDesigns[0];
  const [shop, setShop] = useState(initialShop);
  const [products, setProducts] = useState(initialProducts);
  const [format, setFormat] = useState<ExportFormat>('a4');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [zoomingProduct, setZoomingProduct] = useState<number | null>(null);
  const catalogRef = useRef<HTMLElement>(null);

  const updateProduct = (index: number, patch: Partial<(typeof initialProducts)[number]>) => {
    setProducts((current) => current.map((product, i) => i === index ? { ...product, ...patch } : product));
  };

  const changeImage = async (index: number, file: File | undefined) => {
    if (!file) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError('Choose a JPG, PNG or WebP image smaller than 10 MB.');
      return;
    }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read the image.'));
        reader.onerror = () => reject(new Error('Could not read the image.'));
        reader.readAsDataURL(file);
      });
      const image = new window.Image();
      image.src = dataUrl;
      await image.decode();
      updateProduct(index, { image: dataUrl, zoom: 1, offsetY: 0, fit: 'contain' });
    } catch (reason) {
      console.error('Could not load product image:', reason);
      setError('Could not load that image. Please choose another file.');
    }
  };

  const download = async () => {
    const catalogElement = catalogRef.current;
    if (!catalogElement) {
      setError('The catalog is not ready to download.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await document.fonts.ready;
      await Promise.all(Array.from(catalogElement.querySelectorAll('img'), (image) => image.decode()));
      const { default: html2canvas } = await import('html2canvas');
      const { width, height } = exportSizes[format];
      const canvas = await html2canvas(catalogElement, {
        backgroundColor: '#f9f7f2',
        scale: 1,
        width,
        height,
        windowWidth: width,
        windowHeight: height,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDocument, catalog) => {
          clonedDocument.documentElement.style.backgroundColor = 'transparent';
          clonedDocument.body.style.backgroundColor = 'transparent';
          catalog.classList.add('ac1-export', `ac1-export-${format}`);
          catalog.querySelectorAll<HTMLImageElement>('.ac1-photo img').forEach((image) => {
            const photo = image.parentElement;
            if (photo) {
              const layer = clonedDocument.createElement('div');
              layer.className = 'ac1-export-photo';
              layer.style.backgroundImage = `url("${image.src}")`;
              layer.style.backgroundSize = image.dataset.fit === 'contain' ? 'contain' : 'cover';
              layer.style.backgroundPosition = image.dataset.fit === 'contain' ? 'center' : 'center 62%';
              layer.style.transformOrigin = image.dataset.fit === 'contain' ? 'center' : 'center 62%';
              layer.style.transform = image.style.transform;
              photo.replaceChild(layer, image);
            }
          });
        },
      });
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error('The browser could not create the PNG.'));
      }, 'image/png'));
      downloadBlob(blob, `catalog-${format}.png`);
    } catch (reason) {
      console.error('Catalog export failed:', reason);
      setError(reason instanceof Error ? `Download failed: ${reason.message}` : 'Download failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const catalog = (
      <article ref={catalogRef} className={`ac1-catalog ac1-${design.id} ac1-count-${design.count}${previewDesign ? ' ac1-preview' : ''}`} aria-label="Product catalog">
        <header className="ac1-header">
          <div className="ac1-header-content">
            <h1><EditableText label="Shop name" value={shop.name} maxLength={60} onChange={(name) => setShop((current) => ({ ...current, name }))} /></h1>
            <p data-empty={!shop.subtitle.trim()}><EditableText label="Subheading" value={shop.subtitle} maxLength={100} onChange={(subtitle) => setShop((current) => ({ ...current, subtitle }))} /></p>
          </div>
        </header>

        <section className="ac1-products" aria-label="Products">
          {products.slice(0, design.count).map((product, index) => (
            <article className="ac1-product" key={index}>
              <div className={`ac1-photo${product.fit === 'contain' ? ' ac1-photo-contain' : ''}`}>
                <img src={product.image} alt="" data-fit={product.fit} style={{ transform: `translateY(${product.offsetY}%) scale(${product.zoom})` }} />
                <div className="ac1-photo-controls" data-html2canvas-ignore="true">
                  <button type="button" className="ac1-zoom-button" aria-label={`Adjust photo for product ${index + 1}`} aria-expanded={zoomingProduct === index} onClick={() => setZoomingProduct((current) => current === index ? null : index)}>
                    <ZoomIn size={16} aria-hidden="true" />
                  </button>
                  <label className="ac1-photo-edit">
                    <ImagePlus size={16} aria-hidden="true" />
                    <span className="sr-only">Change photo for product {index + 1}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; void changeImage(index, file); }} />
                  </label>
                </div>
                {zoomingProduct === index && (
                  <div className="ac1-zoom-control" data-html2canvas-ignore="true">
                    <label>
                      <span>Zoom {Math.round(product.zoom * 100)}%</span>
                      <input type="range" min="0.5" max="2" step="0.1" value={product.zoom} aria-label={`Zoom level for product ${index + 1}`} onChange={(event) => updateProduct(index, { zoom: Number(event.target.value) })} />
                    </label>
                    <label>
                      <span>Up / down</span>
                      <input type="range" min="-50" max="50" step="1" value={product.offsetY} aria-label={`Vertical position for product ${index + 1}`} aria-valuetext={product.offsetY === 0 ? 'Centered' : `${Math.abs(product.offsetY)}% ${product.offsetY < 0 ? 'up' : 'down'}`} onChange={(event) => updateProduct(index, { offsetY: Number(event.target.value) })} />
                    </label>
                  </div>
                )}
              </div>
              <div className="ac1-product-details">
                <h2><EditableText label={`Product ${index + 1} name`} value={product.name} maxLength={32} onChange={(name) => updateProduct(index, { name })} /></h2>
                <div className="ac1-prices">
                  <span className="ac1-old-price"><s><EditableText label={`Product ${index + 1} original price`} value={product.original} maxLength={12} onChange={(original) => updateProduct(index, { original })} /></s></span>
                  <span className="ac1-price"><EditableText label={`Product ${index + 1} sale price`} value={product.price} maxLength={12} onChange={(price) => updateProduct(index, { price })} /></span>
                </div>
              </div>
            </article>
          ))}
        </section>

        <footer className="ac1-footer" aria-label="Shop contact details">
          <div className="ac1-contact">
            <MessageCircle aria-hidden="true" />
            <div><span>WhatsApp</span><strong><EditableText label="WhatsApp number" value={shop.whatsapp} maxLength={50} onChange={(whatsapp) => setShop((current) => ({ ...current, whatsapp }))} /></strong></div>
          </div>
          <div className="ac1-contact">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 8h3V4.4c-.5-.1-1.6-.2-2.8-.2-2.8 0-4.7 1.7-4.7 4.8v2.7H6.4v4h3.1V24h3.8v-8.3h3.1l.5-4h-3.6V9.4c0-1.1.3-1.4.7-1.4Z" />
            </svg>
            <div><span>Facebook</span><strong><EditableText label="Facebook link" value={shop.facebook} maxLength={80} onChange={(facebook) => setShop((current) => ({ ...current, facebook }))} /></strong></div>
          </div>
          <div className="ac1-contact">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
            </svg>
            <div><span>Instagram</span><strong><EditableText label="Instagram link" value={shop.instagram} maxLength={80} onChange={(instagram) => setShop((current) => ({ ...current, instagram }))} /></strong></div>
          </div>
        </footer>
      </article>
  );
  if (previewDesign) return catalog;

  return (
    <div className="ac1-stage" lang="en">
      <PageMetadata title="Catalog Design Preview" description="A sample product catalog design." noindex />
      <div className="ac1-instructions">
        <Link to="/ac1">← All templates</Link>
        <p>Use the pencil icons to edit text and the photo controls to replace, zoom or move images. Changes are not saved after you leave this page.</p>
      </div>
      {catalog}
      <div className="ac1-download">
        <label htmlFor="ac1-format">Image size</label>
        <select id="ac1-format" value={format} onChange={(event) => {
          const value = event.target.value;
          if (value === 'a4' || value === 'post' || value === 'story') setFormat(value);
        }} disabled={busy}>
          {Object.entries(exportSizes).map(([key, size]) => <option key={key} value={key}>{size.label} ({size.width} × {size.height})</option>)}
        </select>
        <button type="button" onClick={() => void download()} disabled={busy}>{busy ? 'Preparing image…' : 'Download PNG'}</button>
        {error && <p role="alert">{error}</p>}
      </div>
    </div>
  );
}
