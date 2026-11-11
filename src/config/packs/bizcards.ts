import bizcards from '../../locales/packs/bizcards.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Business cards and similar print-and-share pieces. Each tool runs in the browser and nothing is uploaded. */
export const BIZCARD_TOOLS: PackTool[] = [
  definePackTool({
    id: 'visiting-card-maker', kind: 'visitingCardMaker', guideKey: 'bizcardVisitingCard', category: 'everyday', icon: 'contact', tier: 'popular',
    keywords: ['visiting card maker', 'business card maker', 'visiting card design', 'business card template', 'free visiting card', 'visiting card online', 'business card with qr code', 'visiting card pdf', 'print business cards a4', 'digital visiting card', 'id card contact card'],
  }, bizcards.toolCatalog),
];
