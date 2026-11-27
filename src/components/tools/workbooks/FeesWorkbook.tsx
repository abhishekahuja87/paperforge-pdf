import React from 'react';
import { buildFees } from '../../../lib/workbooks/fees';
import T from '../../../locales/packs/workbooks.more.text.en.json';
import { ListWorkbook } from './ListWorkbook';
import type { ListSpec } from './listSpec';

const t = T.fees.ui;
const SPEC: ListSpec = {
  id: 'fees', fileBase: 'fees-tracker', ui: { start: t.start, starters: t.starters, listIntro: t.listIntro, previewYours: t.previewYours, previewSample: t.previewSample },
  texts: [{ key: 'business', label: t.business, placeholder: t.businessPlaceholder }, { key: 'item', label: t.item, hint: t.itemHint, max: 30 }, { key: 'message', label: t.message, hint: t.messageHint, multiline: 3, max: 300 }],
  numbers: [{ key: 'spare', label: t.spare, hint: t.spareHint, min: 0, max: 200 }],
  more: ['message', 'spare'], region: { code: true },
  defaults: { business: '', item: 'Fee', message: t.defaultMessage, spare: 20 },
  starters: T.fees.starters, sampleHeaders: [t.fieldName, t.fieldPhone, t.fieldGroup, t.fieldMonthly, t.fieldOpening],
  fields: [{ key: 'name', label: t.fieldName, aliases: ['student', 'tenant', 'member', 'resident', 'name'], required: true }, { key: 'phone', label: t.fieldPhone, aliases: ['mobile', 'phone number', 'contact', 'whatsapp'] }, { key: 'group', label: t.fieldGroup, aliases: ['class', 'flat', 'room', 'unit', 'batch', 'section'] }, { key: 'monthly', label: t.fieldMonthly, aliases: ['fee', 'rent', 'monthly', 'amount', 'maintenance'] }, { key: 'opening', label: t.fieldOpening, aliases: ['balance', 'opening', 'due', 'arrears', 'pending'] }],
  maxRows: 300, tooMany: t.tooMany,
  build: ({ settings, rows, sample, region, hinglish }) => buildFees({ business: String(settings.business), item: String(settings.item), rows, spare: Number(settings.spare), message: String(settings.message), sample, region, hinglish }),
};

/** Fees Excel maker. */
export const FeesWorkbook: React.FC = () => <ListWorkbook spec={SPEC} />;
export default FeesWorkbook;
