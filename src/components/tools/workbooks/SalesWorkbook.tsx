import React from 'react';
import { buildSales } from '../../../lib/workbooks/sales';
import T from '../../../locales/packs/workbooks.more3.text.en.json';
import { ListWorkbook } from './ListWorkbook';
import type { ListSpec } from './listSpec';

const t = T.sales.ui;
const SPEC: ListSpec = {
  id: 'sales', fileBase: 'daily-sales-report', ui: { start: t.start, starters: t.starters, listIntro: t.listIntro, previewYours: t.previewYours, previewSample: t.previewSample },
  texts: [{ key: 'business', label: t.business, placeholder: t.businessPlaceholder }],
  numbers: [{ key: 'spare', label: t.spare, hint: t.spareHint, min: 0, max: 200 }, { key: 'logRows', label: t.logRows, hint: t.logRowsHint, min: 100, max: 5000 }],
  more: ['spare', 'logRows'], region: {},
  defaults: { business: '', spare: 30, logRows: 1500 },
  starters: T.sales.starters, sampleHeaders: [t.fieldName, t.fieldPrice, t.fieldUnit],
  fields: [{ key: 'name', label: t.fieldName, aliases: ['item', 'product', 'item name', 'product name', 'description'], required: true }, { key: 'price', label: t.fieldPrice, aliases: ['rate', 'selling price', 'mrp', 'price'] }, { key: 'unit', label: t.fieldUnit, aliases: ['uom', 'unit of measure'] }],
  maxRows: 300, tooMany: t.tooMany,
  build: ({ settings, rows, sample, region, hinglish }) => buildSales({ business: String(settings.business), rows, spare: Number(settings.spare), logRows: Number(settings.logRows), sample, region, hinglish }),
};

/** Daily sales report Excel maker. */
export const SalesWorkbook: React.FC = () => <ListWorkbook spec={SPEC} />;
export default SalesWorkbook;
