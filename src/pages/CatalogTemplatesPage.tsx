import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageMetadata } from '../components/common/PageMetadata';
import { Ac1Page } from './Ac1Page';
import { catalogDesigns } from './catalogDesigns';
import { PosterThumb } from '../components/tools/shops/PosterThumb';
import { POSTER_THEMES } from '../config/posterThemes';
import { POSTER_COUNTS } from '../config/posterSamples';
import { POSTER_FORMATS, type FormatId } from '../lib/poster/layout';
import type { PosterInput } from '../lib/poster/render';
import { loadPosterFonts } from '../lib/poster/fonts';
import { loadSamplePhotos } from '../lib/poster/samples';
import { AC1_PRODUCTS, AC1_SHOP } from './ac1Defaults';
import '../components/tools/shops/posterFonts.css';
import './catalog-templates.css';

const PREVIEW_FORMATS: FormatId[] = ['a4', 'post', 'portrait', 'story'];

/** The newer designs, drawn with the shop's own details. Same designs as the public Offer Poster Maker. */
function NewDesigns() {
  const [count, setCount] = useState(6);
  const [format, setFormat] = useState<FormatId>('a4');
  const [ready, setReady] = useState('');
  const [photos, setPhotos] = useState<Awaited<ReturnType<typeof loadSamplePhotos>>>([]);
  useEffect(() => {
    let alive = true;
    Promise.all([loadPosterFonts(), loadSamplePhotos()]).then(([, loaded]) => { if (alive) { setPhotos(loaded); setReady('yes'); } });
    return () => { alive = false; };
  }, []);
  const input = useMemo<PosterInput>(() => ({
    shop: { ...AC1_SHOP, headline: '' },
    products: AC1_PRODUCTS.slice(0, count).map((p, i) => ({ name: p.name, original: p.original, price: p.price, image: photos[i]?.source ?? null, iw: photos[i]?.width ?? 0, ih: photos[i]?.height ?? 0, zoom: 1, offsetX: 0, offsetY: 0, fit: 'cover' as const, badge: '' })),
    emphasis: 'photos',
    offerBadge: '',
  }), [count, photos]);
  return (
    <section aria-label="New designs">
      <h2 className="catalog-section-title">New designs</h2>
      <p className="catalog-section-note">Any number of products. Pick how many and the size, then choose a design.</p>
      <div className="catalog-poster-options">
        <label>Products <select value={count} onChange={(event) => setCount(Number(event.target.value))}>{POSTER_COUNTS.map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
        <label>Size <select value={format} onChange={(event) => setFormat(event.target.value as FormatId)}>{PREVIEW_FORMATS.map((id) => <option key={id} value={id}>{POSTER_FORMATS[id].label}</option>)}</select></label>
      </div>
      <div className="catalog-template-grid">
        {POSTER_THEMES.map((theme) => (
          <article className="catalog-template" key={theme.id}>
            <div className="catalog-template-preview" aria-hidden="true">
              <PosterThumb themeId={theme.id} format={format} input={input} ready={ready} width={format === 'story' ? 170 : 250} className="catalog-poster-thumb" />
            </div>
            <div className="catalog-template-info">
              <div><h3>{theme.name}</h3><p>{count} products · {theme.description}</p></div>
              <Link to={`/ac1/poster?design=${theme.id}&count=${count}&format=${format}`} aria-label={`Use ${theme.name}, ${count} products`}>
                Use design <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CatalogTemplatesPage() {
  return (
    <div className="catalog-chooser" lang="en">
      <PageMetadata title="Pamphlet Templates" description="Choose a product catalog design and make it your own." noindex />
      <div className="catalog-chooser-inner">
        <h1>Choose your pamphlet</h1>
        <p>Pick a design, then add your products and shop details.</p>
        <NewDesigns />
        <h2 className="catalog-section-title">Classic designs</h2>
        <div className="catalog-template-grid">
          {catalogDesigns.map((design) => (
            <article className="catalog-template" key={design.id}>
              <div className="catalog-template-preview" aria-hidden="true" inert>
                <div className="catalog-preview-frame"><Ac1Page previewDesign={design} /></div>
              </div>
              <div className="catalog-template-info">
                <div><h2>{design.name}</h2><p>{design.count} products · {design.description}</p></div>
                <Link to={`/ac1/edit?design=${design.id}`} aria-label={`Use ${design.name}, ${design.count} products`}>
                  Use design <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
