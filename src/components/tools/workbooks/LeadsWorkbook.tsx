import React from 'react';
import { buildLeads } from '../../../lib/workbooks/leads';
import { splitList } from '../../../lib/workbooks/kit';
import T from '../../../locales/packs/workbooks.more2.text.en.json';
import { ListWorkbook } from './ListWorkbook';
import type { ListSpec } from './listSpec';

const t = T.leads.ui;
const SPEC: ListSpec = {
  id: 'leads', fileBase: 'lead-tracker', ui: { start: t.start, starters: t.starters, listIntro: t.listIntro, previewYours: t.previewYours, previewSample: t.previewSample },
  texts: [{ key: 'business', label: t.business, placeholder: t.businessPlaceholder }, { key: 'sources', label: t.sources, hint: t.sourcesHint, max: 120 }, { key: 'message', label: t.message, hint: t.messageHint, multiline: 3, max: 300 }],
  numbers: [{ key: 'spare', label: t.spare, hint: t.spareHint, min: 0, max: 300 }],
  more: ['message', 'spare'], region: { code: true },
  defaults: { business: '', sources: 'Walk-in, Phone call, WhatsApp, Referral, Website', message: t.defaultMessage, spare: 40 },
  starters: T.leads.starters, sampleHeaders: [t.fieldName, t.fieldPhone, t.fieldSource, t.fieldInterest, t.fieldValue],
  fields: [{ key: 'name', label: t.fieldName, aliases: ['customer', 'lead', 'enquiry', 'prospect', 'name'], required: true }, { key: 'phone', label: t.fieldPhone, aliases: ['mobile', 'phone number', 'contact', 'whatsapp'] }, { key: 'source', label: t.fieldSource, aliases: ['source', 'channel', 'came from', 'how found'] }, { key: 'interest', label: t.fieldInterest, aliases: ['product', 'interest', 'requirement', 'service', 'course'] }, { key: 'value', label: t.fieldValue, aliases: ['value', 'amount', 'budget', 'price', 'quote'] }],
  maxRows: 300, tooMany: t.tooMany,
  build: ({ settings, rows, sample, region, hinglish }) => buildLeads({ business: String(settings.business), rows, sources: splitList(String(settings.sources), 8), spare: Number(settings.spare), message: String(settings.message), sample, region, hinglish }),
};

/** Leads Excel maker. */
export const LeadsWorkbook: React.FC = () => <ListWorkbook spec={SPEC} />;
export default LeadsWorkbook;
