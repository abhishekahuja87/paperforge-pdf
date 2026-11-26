import reviewsign from '../../locales/packs/reviewsign.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Review Us Sign Maker (components/tools/reviewsign, logic in src/lib/reviewsign). Runs in the browser. */
export const REVIEWSIGN_TOOLS: PackTool[] = [
  definePackTool({
    id: 'review-us-sign-maker', kind: 'reviewSign', guideKey: 'reviewSignGuide', category: 'business', icon: 'grid', tier: 'popular',
    keywords: ['review us sign maker', 'google review qr code sign', 'scan to review us poster', 'google review qr code printable', 'review qr code stand', 'table tent review sign', 'feedback qr code sign', 'review us sign for shop', 'google review link qr code', 'restaurant review qr tent card', 'free review sign printable', 'scan to leave a review sign'],
  }, reviewsign.toolCatalog),
];
