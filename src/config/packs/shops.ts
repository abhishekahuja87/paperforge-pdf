import shops from '../../locales/packs/shops.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Tools for small shops. Each runs in the browser. The poster maker's fonts are bundled with the site. */
export const SHOPS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'offer-poster-maker', kind: 'offerPosterMaker', guideKey: 'offerPosterMakerGuide', category: 'media', icon: 'receipt', tier: 'popular',
    keywords: ['sale poster maker', 'offer poster maker', 'instagram story maker for shop', 'discount poster', 'whatsapp status offer', 'shop offer pamphlet', 'price list poster', 'diwali offer poster', 'catalogue maker', 'product offer flyer', 'festival sale poster', 'instagram post for small business'],
  }, shops.toolCatalog),
];
