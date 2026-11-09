import freelancers from '../../locales/packs/freelancers.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Tools for freelancers and small businesses: pricing your time, quoting a client and checking margins. */
export const FREELANCERS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'freelance-rate-calculator', kind: 'freelanceRate', guideKey: 'freelanceRateCalc', category: 'everyday', icon: 'calculator', tier: 'popular', shareable: true,
    keywords: ['freelance rate calculator', 'hourly rate calculator', 'day rate', 'how much to charge', 'freelancer pricing', 'consultant rate', 'project price'],
  }, freelancers.toolCatalog),
  definePackTool({
    id: 'quotation-generator', kind: 'quotation', guideKey: 'quotationGen', category: 'everyday', icon: 'receipt', tier: 'popular',
    keywords: ['quotation generator', 'quote maker', 'price quote template', 'estimate template', 'proposal price', 'freelance quote', 'quote pdf'],
  }, freelancers.toolCatalog),
  definePackTool({
    id: 'margin-markup-calculator', kind: 'margin', guideKey: 'marginCalc', category: 'everyday', icon: 'calculator', tier: 'more', shareable: true,
    keywords: ['profit margin calculator', 'markup calculator', 'margin vs markup', 'selling price', 'discount impact', 'break even calculator', 'gross margin'],
  }, freelancers.toolCatalog),
];
