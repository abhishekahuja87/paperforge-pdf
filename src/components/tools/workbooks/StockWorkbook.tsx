import React from 'react';
import { buildStock } from '../../../lib/workbooks/stock';
import T from '../../../locales/packs/workbooks.more.text.en.json';
import { ListWorkbook } from './ListWorkbook';
import type { ListSpec } from './listSpec';

const t = T.stock.ui;
const SPEC: ListSpec = {
  id: 'stock', fileBase: 'stock-register', ui: { start: t.start, starters: t.starters, listIntro: t.listIntro, previewYours: t.previewYours, previewSample: t.previewSample },
  texts: [{ key: 'business', label: t.business, placeholder: t.businessPlaceholder }],
  numbers: [{ key: 'orderMultiple', label: t.multiple, hint: t.multipleHint, min: 1, max: 10 }, { key: 'spare', label: t.spare, hint: t.spareHint, min: 0, max: 200 }, { key: 'logRows', label: t.logRows, hint: t.logRowsHint, min: 100, max: 3000 }],
  more: ['spare', 'logRows'], region: {},
  defaults: { business: '', orderMultiple: 2, spare: 30, logRows: 1000 },
  starters: T.stock.starters, sampleHeaders: [t.fieldName, t.fieldUnit, t.fieldOpening, t.fieldReorder, t.fieldCost, t.fieldPrice],
  fields: [{ key: 'name', label: t.fieldName, aliases: ['item', 'product', 'item name', 'product name', 'description'], required: true }, { key: 'unit', label: t.fieldUnit, aliases: ['uom', 'unit of measure'] }, { key: 'opening', label: t.fieldOpening, aliases: ['stock', 'quantity', 'qty', 'current stock', 'opening qty', 'on hand'] }, { key: 'reorder', label: t.fieldReorder, aliases: ['minimum', 'min stock', 'reorder', 'reorder point', 'low stock'] }, { key: 'cost', label: t.fieldCost, aliases: ['cost', 'purchase price', 'buying price', 'buy price'] }, { key: 'price', label: t.fieldPrice, aliases: ['price', 'selling price', 'mrp', 'rate'] }],
  maxRows: 300, tooMany: t.tooMany,
  build: ({ settings, rows, sample, region, hinglish }) => buildStock({ business: String(settings.business), rows, spare: Number(settings.spare), logRows: Number(settings.logRows), orderMultiple: Number(settings.orderMultiple), sample, region, hinglish }),
};

/** Stock register Excel maker. */
export const StockWorkbook: React.FC = () => <ListWorkbook spec={SPEC} />;
export default StockWorkbook;
