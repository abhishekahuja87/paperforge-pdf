import React from 'react';
import { buildBudget } from '../../../lib/workbooks/budget';
import T from '../../../locales/packs/workbooks.more.text.en.json';
import { ListWorkbook } from './ListWorkbook';
import type { ListSpec } from './listSpec';

const t = T.budget.ui;
const SPEC: ListSpec = {
  id: 'budget', fileBase: 'budget-planner', ui: { start: t.start, starters: t.starters, listIntro: t.listIntro, previewYours: t.previewYours, previewSample: t.previewSample },
  texts: [{ key: 'title', label: t.name, placeholder: t.namePlaceholder, max: 60 }],
  numbers: [{ key: 'spareIncome', label: t.spareIncome, hint: t.spareIncomeHint, min: 0, max: 30 }, { key: 'spareSpend', label: t.spareSpend, hint: t.spareSpendHint, min: 0, max: 60 }],
  more: ['spareIncome', 'spareSpend'], region: {},
  defaults: { title: '', spareIncome: 3, spareSpend: 8 },
  starters: T.budget.starters, sampleHeaders: [t.fieldKind, t.fieldName, t.fieldPlanned],
  fields: [{ key: 'kind', label: t.fieldKind, aliases: ['type', 'income or expense', 'kind'], required: true }, { key: 'name', label: t.fieldName, aliases: ['category', 'item', 'head', 'name'], required: true }, { key: 'planned', label: t.fieldPlanned, aliases: ['planned', 'budget', 'amount', 'monthly', 'per month'] }],
  maxRows: 80, tooMany: t.tooMany,
  build: ({ settings, rows, sample, region, hinglish }) => buildBudget({ title: String(settings.title), rows, spareIncome: Number(settings.spareIncome), spareSpend: Number(settings.spareSpend), sample, region, hinglish }),
};

/** Budget Excel maker. */
export const BudgetWorkbook: React.FC = () => <ListWorkbook spec={SPEC} />;
export default BudgetWorkbook;
