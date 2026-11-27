import React from 'react';
import { buildJobs } from '../../../lib/workbooks/jobs';
import T from '../../../locales/packs/workbooks.more2.text.en.json';
import { ListWorkbook } from './ListWorkbook';
import type { ListSpec } from './listSpec';

const t = T.jobs.ui;
const SPEC: ListSpec = {
  id: 'jobs', fileBase: 'job-tracker', ui: { start: t.start, starters: t.starters, listIntro: t.listIntro, previewYours: t.previewYours, previewSample: t.previewSample },
  texts: [{ key: 'business', label: t.business, placeholder: t.businessPlaceholder }],
  numbers: [{ key: 'soonDays', label: t.soonDays, hint: t.soonDaysHint, min: 0, max: 30 }, { key: 'spare', label: t.spare, hint: t.spareHint, min: 0, max: 200 }, { key: 'logRows', label: t.logRows, hint: t.logRowsHint, min: 100, max: 3000 }],
  more: ['spare', 'logRows'], region: {},
  defaults: { business: '', soonDays: 3, spare: 30, logRows: 500 },
  starters: T.jobs.starters, sampleHeaders: [t.fieldName, t.fieldPhone, t.fieldNote],
  fields: [{ key: 'name', label: t.fieldName, aliases: ['customer', 'client', 'party', 'name'], required: true }, { key: 'phone', label: t.fieldPhone, aliases: ['mobile', 'phone number', 'contact', 'whatsapp'] }, { key: 'note', label: t.fieldNote, aliases: ['notes', 'remark', 'remarks', 'address', 'work'] }],
  maxRows: 300, tooMany: t.tooMany,
  build: ({ settings, rows, sample, region, hinglish }) => buildJobs({ business: String(settings.business), rows, spare: Number(settings.spare), logRows: Number(settings.logRows), soonDays: Number(settings.soonDays), sample, region, hinglish }),
};

/** Jobs Excel maker. */
export const JobsWorkbook: React.FC = () => <ListWorkbook spec={SPEC} />;
export default JobsWorkbook;
