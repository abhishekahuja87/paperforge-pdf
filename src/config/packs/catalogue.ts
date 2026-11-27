import catalogue from '../../locales/packs/catalogue.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** The product catalogue maker. The pages are drawn in the browser with fonts bundled with the site. */
export const CATALOGUE_TOOLS: PackTool[] = [
  definePackTool({
    id: 'product-catalogue-maker', kind: 'productCatalogueMaker', guideKey: 'productCatalogueMakerGuide', category: 'media', icon: 'image', tier: 'popular',
    keywords: ['product catalogue maker', 'catalogue maker online free', 'free catalogue maker', 'catalogue maker for small business', 'product catalog maker', 'price list maker', 'whatsapp catalogue maker', 'catalogue pdf maker', 'online catalogue maker', 'digital catalogue maker', 'business catalogue maker', 'product brochure maker'],
  }, catalogue.toolCatalog),
];
