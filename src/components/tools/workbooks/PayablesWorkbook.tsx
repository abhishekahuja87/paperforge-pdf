import React from 'react';
import { buildPayables } from '../../../lib/workbooks/payables';
import T from '../../../locales/packs/workbooks.more.text.en.json';
import { ListWorkbook } from './ListWorkbook';
import type { ListSpec } from './listSpec';

const t = T.payables.ui;
const SPEC: ListSpec = {
  id: 'payables', fileBase: 'supplier-payments', ui: { start: t.start, starters: t.starters, listIntro: t.listIntro, previewYours: t.previewYours, previewSample: t.previewSample },
  texts: [{ key: 'business', label: t.business, placeholder: t.businessPlaceholder }],
  numbers: [{ key: 'creditDays', label: t.creditDays, hint: t.creditDaysHint, min: 0, max: 365 }, { key: 'soonDays', label: t.soonDays, hint: t.soonDaysHint, min: 0, max: 60 }, { key: 'spare', label: t.spare, hint: t.spareHint, min: 0, max: 150 }, { key: 'logRows', label: t.logRows, hint: t.logRowsHint, min: 100, max: 5000 }],
  more: ['spare', 'logRows'], region: {},
  defaults: { business: '', creditDays: 30, soonDays: 7, spare: 30, logRows: 1000 },
  starters: T.payables.starters, sampleHeaders: [t.fieldName, t.fieldPhone, t.fieldDays, t.fieldNote],
  fields: [{ key: 'name', label: t.fieldName, aliases: ['supplier', 'vendor', 'party', 'name'], required: true }, { key: 'phone', label: t.fieldPhone, aliases: ['mobile', 'phone number', 'contact'] }, { key: 'days', label: t.fieldDays, aliases: ['credit days', 'days', 'terms', 'payment terms'] }, { key: 'note', label: t.fieldNote, aliases: ['notes', 'remark', 'remarks', 'goods'] }],
  maxRows: 200, tooMany: t.tooMany,
  build: ({ settings, rows, sample, region, hinglish }) => buildPayables({ business: String(settings.business), rows, spare: Number(settings.spare), logRows: Number(settings.logRows), creditDays: Number(settings.creditDays), soonDays: Number(settings.soonDays), sample, region, hinglish }),
};

/** Payables Excel maker. */
export const PayablesWorkbook: React.FC = () => <ListWorkbook spec={SPEC} />;
export default PayablesWorkbook;
