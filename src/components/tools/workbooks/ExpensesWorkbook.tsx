import React from 'react';
import { buildExpenses } from '../../../lib/workbooks/expenses';
import T from '../../../locales/packs/workbooks.more2.text.en.json';
import { ListWorkbook } from './ListWorkbook';
import type { ListSpec } from './listSpec';

const t = T.expenses.ui;
const SPEC: ListSpec = {
  id: 'expenses', fileBase: 'expense-claim', ui: { start: t.start, starters: t.starters, listIntro: t.listIntro, previewYours: t.previewYours, previewSample: t.previewSample },
  texts: [{ key: 'business', label: t.business, placeholder: t.businessPlaceholder }, { key: 'claimant', label: t.claimant, placeholder: t.claimantPlaceholder }],
  numbers: [{ key: 'spare', label: t.spare, hint: t.spareHint, min: 0, max: 30 }, { key: 'logRows', label: t.logRows, hint: t.logRowsHint, min: 50, max: 2000 }],
  more: ['spare', 'logRows'], region: {},
  defaults: { business: '', claimant: '', spare: 5, logRows: 200 },
  starters: T.expenses.starters, sampleHeaders: [t.fieldName, t.fieldLimit],
  fields: [{ key: 'name', label: t.fieldName, aliases: ['category', 'expense type', 'head', 'type', 'name'], required: true }, { key: 'limit', label: t.fieldLimit, aliases: ['limit', 'max', 'cap', 'maximum', 'per claim limit'] }],
  maxRows: 40, tooMany: t.tooMany,
  build: ({ settings, rows, sample, region, hinglish }) => buildExpenses({ business: String(settings.business), claimant: String(settings.claimant), rows, spare: Number(settings.spare), logRows: Number(settings.logRows), sample, region, hinglish }),
};

/** Expenses Excel maker. */
export const ExpensesWorkbook: React.FC = () => <ListWorkbook spec={SPEC} />;
export default ExpensesWorkbook;
