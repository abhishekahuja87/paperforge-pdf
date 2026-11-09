import household from '../../locales/packs/household.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Paperwork for the home. Each tool runs in the browser and nothing is uploaded. */
export const HOUSEHOLD_TOOLS: PackTool[] = [
  definePackTool({
    id: 'rent-receipt-generator', kind: 'rentReceipt', guideKey: 'rentReceiptGuide', category: 'everyday', icon: 'receipt', tier: 'popular',
    keywords: ['rent receipt generator', 'rent receipt for hra', 'monthly rent receipt format', 'house rent receipt', 'rent receipt pdf', 'hra rent receipt', 'rent receipt india', 'rent receipt 12 months'],
  }, household.toolCatalog),
];
