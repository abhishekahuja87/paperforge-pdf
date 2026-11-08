import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageMetadata } from '../components/common/PageMetadata';
import { Ac1Page } from './Ac1Page';
import { catalogDesigns } from './catalogDesigns';
import './catalog-templates.css';

export function CatalogTemplatesPage() {
  return (
    <div className="catalog-chooser" lang="en">
      <PageMetadata title="Pamphlet Templates" description="Choose a product catalog design and make it your own." />
      <div className="catalog-chooser-inner">
        <h1>Choose your pamphlet</h1>
        <p>Pick a design, then add your products and shop details.</p>
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
