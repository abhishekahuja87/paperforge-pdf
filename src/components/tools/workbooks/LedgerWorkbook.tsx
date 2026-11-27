import React from 'react';
import { buildLedger } from '../../../lib/workbooks/ledger';
import T from '../../../locales/packs/workbooks.more.text.en.json';
import { ListWorkbook } from './ListWorkbook';
import type { ListSpec } from './listSpec';

const t = T.ledger.ui;
const SPEC: ListSpec = {
  id: 'ledger', fileBase: 'credit-ledger', ui: { start: t.start, starters: t.starters, listIntro: t.listIntro, previewYours: t.previewYours, previewSample: t.previewSample },
  texts: [{ key: 'business', label: t.business, placeholder: t.businessPlaceholder }, { key: 'message', label: t.message, hint: t.messageHint, multiline: 3, max: 300 }],
  numbers: [{ key: 'period', label: t.period, hint: t.periodHint, min: 1, max: 365 }, { key: 'spare', label: t.spare, hint: t.spareHint, min: 0, max: 200 }, { key: 'logRows', label: t.logRows, hint: t.logRowsHint, min: 100, max: 5000 }],
  more: ['message', 'spare', 'logRows'], region: { code: true },
  defaults: { business: '', period: 30, message: t.defaultMessage, spare: 30, logRows: 1500 },
  starters: T.ledger.starters, sampleHeaders: [t.fieldName, t.fieldPhone, t.fieldOpening, t.fieldLimit, t.fieldNote],
  fields: [{ key: 'name', label: t.fieldName, aliases: ['customer', 'party', 'party name', 'customer name', 'name'], required: true }, { key: 'phone', label: t.fieldPhone, aliases: ['mobile', 'phone number', 'contact', 'whatsapp'] }, { key: 'opening', label: t.fieldOpening, aliases: ['balance', 'opening', 'due', 'outstanding', 'pending'] }, { key: 'limit', label: t.fieldLimit, aliases: ['limit', 'credit limit', 'max credit'] }, { key: 'note', label: t.fieldNote, aliases: ['notes', 'remark', 'remarks', 'address'] }],
  maxRows: 300, tooMany: t.tooMany,
  build: ({ settings, rows, sample, region, hinglish }) => buildLedger({ business: String(settings.business), rows, spare: Number(settings.spare), logRows: Number(settings.logRows), period: Number(settings.period), message: String(settings.message), sample, region, hinglish }),
};

/** Ledger Excel maker. */
export const LedgerWorkbook: React.FC = () => <ListWorkbook spec={SPEC} />;
export default LedgerWorkbook;
