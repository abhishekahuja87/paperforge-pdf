import React, { useEffect, useRef } from 'react';
import { renderCatalogue, type CatBusiness, type CatOptions, type CatProduct, type PageSpec } from '../../../lib/catalogue/render';

/** A small picture of one page, drawn with the same code as the full page. */
export const CatalogueThumb: React.FC<{ spec: PageSpec; business: CatBusiness; products: CatProduct[]; options: CatOptions; ready: string; width?: number }> = ({ spec, business, products, options, ready, width = 200 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const h = Math.round((width * options.size.h) / options.size.w);
  useEffect(() => {
    const canvas = ref.current, ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = width; canvas.height = h;
    renderCatalogue(ctx, width, h, spec, business, products, options, 3);
  }, [spec, business, products, options, ready, width, h]);
  return <canvas ref={ref} aria-hidden="true" className="h-auto w-full rounded-lg bg-white shadow" />;
};
