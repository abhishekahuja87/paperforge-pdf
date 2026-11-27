import React from 'react';
import { buildCashbook } from '../../../lib/workbooks/cashbook';
import T from '../../../locales/packs/workbooks.more.text.en.json';
import { ListWorkbook } from './ListWorkbook';
import type { ListSpec } from './listSpec';

const t = T.cashbook.ui;
const SPEC: ListSpec = {
  id: 'cashbook', fileBase: 'cash-book', ui: { start: t.start, starters: t.starters, listIntro: t.listIntro, previewYours: t.previewYours, previewSample: t.previewSample },
  texts: [{ key: 'business', label: t.business, placeholder: t.businessPlaceholder }, { key: 'modes', label: t.modes, hint: t.modesHint, max: 80 }, { key: 'openings', label: t.openings, hint: t.openingsHint, max: 80 }],
  numbers: [{ key: 'logRows', label: t.logRows, hint: t.logRowsHint, min: 100, max: 5000 }],
  more: ['logRows'], region: {},
  defaults: { business: '', modes: 'Cash, Bank, UPI', openings: '5000, 50000, 0', logRows: 1500 },
  starters: T.cashbook.starters, sampleHeaders: [t.fieldKind, t.fieldName],
  fields: [{ key: 'kind', label: t.fieldKind, aliases: ['type', 'income or expense', 'in or out', 'kind'], required: true }, { key: 'name', label: t.fieldName, aliases: ['category', 'head', 'name', 'account'], required: true }],
  maxRows: 60, tooMany: t.tooMany,
  build: ({ settings, rows, sample, region, hinglish }) => {
    const names = String(settings.modes).split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4);
    const opens = String(settings.openings).split(',').map((s) => parseFloat(s.replace(/[^0-9.-]/g, '')));
    const modes = (names.length ? names : ['Cash']).map((name, i) => ({ name, opening: Number.isFinite(opens[i]) ? (opens[i] as number) : null }));
    return buildCashbook({ business: String(settings.business), rows, logRows: Number(settings.logRows), spare: 10, modes, sample, region, hinglish });
  },
};

/** Cashbook Excel maker. */
export const CashbookWorkbook: React.FC = () => <ListWorkbook spec={SPEC} />;
export default CashbookWorkbook;
