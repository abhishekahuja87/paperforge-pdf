import React from 'react';
import { buildLoan } from '../../../lib/workbooks/loan';
import T from '../../../locales/packs/workbooks.more3.text.en.json';
import { ListWorkbook } from './ListWorkbook';
import type { ListSpec } from './listSpec';

const t = T.loan.ui;
const SPEC: ListSpec = {
  id: 'loan', fileBase: 'loan-emi-tracker', ui: { start: t.start, starters: t.starters, listIntro: t.listIntro, previewYours: t.previewYours, previewSample: t.previewSample },
  texts: [{ key: 'business', label: t.business, placeholder: t.businessPlaceholder }],
  numbers: [{ key: 'soonDays', label: t.soonDays, hint: t.soonDaysHint, min: 0, max: 30 }, { key: 'spare', label: t.spare, hint: t.spareHint, min: 0, max: 60 }],
  more: ['spare'], region: {},
  defaults: { business: '', soonDays: 5, spare: 6 },
  starters: T.loan.starters, sampleHeaders: [t.fieldName, t.fieldAmount, t.fieldRate, t.fieldMonths, t.fieldFirst, t.fieldNote],
  fields: [{ key: 'name', label: t.fieldName, aliases: ['loan', 'loan name', 'lender', 'bank', 'name'], required: true }, { key: 'amount', label: t.fieldAmount, aliases: ['principal', 'loan amount', 'amount'] }, { key: 'rate', label: t.fieldRate, aliases: ['interest', 'interest rate', 'rate', 'roi'] }, { key: 'months', label: t.fieldMonths, aliases: ['tenure', 'term', 'months', 'duration', 'emis'] }, { key: 'first', label: t.fieldFirst, aliases: ['start', 'start date', 'first emi', 'first date', 'emi start'] }, { key: 'note', label: t.fieldNote, aliases: ['notes', 'remark', 'remarks', 'account'] }],
  maxRows: 60, tooMany: t.tooMany,
  build: ({ settings, rows, sample, region, hinglish }) => buildLoan({ business: String(settings.business), rows, spare: Number(settings.spare), soonDays: Number(settings.soonDays), sample, region, hinglish }),
};

/** Loan and EMI tracker Excel maker. */
export const LoanWorkbook: React.FC = () => <ListWorkbook spec={SPEC} />;
export default LoanWorkbook;
