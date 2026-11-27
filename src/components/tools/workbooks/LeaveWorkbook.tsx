import React from 'react';
import { buildLeave } from '../../../lib/workbooks/leave';
import T from '../../../locales/packs/workbooks.more3.text.en.json';
import { ListWorkbook } from './ListWorkbook';
import type { ListSpec } from './listSpec';

const t = T.leave.ui;
const SPEC: ListSpec = {
  id: 'leave', fileBase: 'leave-tracker', ui: { start: t.start, starters: t.starters, listIntro: t.listIntro, previewYours: t.previewYours, previewSample: t.previewSample },
  texts: [{ key: 'business', label: t.business, placeholder: t.businessPlaceholder }],
  numbers: [{ key: 'warnDays', label: t.warnDays, hint: t.warnDaysHint, min: 0, max: 30 }, { key: 'spare', label: t.spare, hint: t.spareHint, min: 0, max: 200 }, { key: 'logRows', label: t.logRows, hint: t.logRowsHint, min: 100, max: 3000 }],
  more: ['spare', 'logRows'], region: {},
  defaults: { business: '', warnDays: 3, spare: 30, logRows: 500 },
  starters: T.leave.starters, sampleHeaders: [t.fieldName, t.fieldDept, t.fieldDays],
  fields: [{ key: 'name', label: t.fieldName, aliases: ['employee', 'staff', 'teacher', 'person', 'name'], required: true }, { key: 'dept', label: t.fieldDept, aliases: ['department', 'team', 'section', 'role'] }, { key: 'days', label: t.fieldDays, aliases: ['leave days', 'yearly leave', 'entitlement', 'leaves', 'annual leave', 'days'] }],
  maxRows: 300, tooMany: t.tooMany,
  build: ({ settings, rows, sample, region, hinglish }) => buildLeave({ business: String(settings.business), rows, spare: Number(settings.spare), logRows: Number(settings.logRows), warnDays: Number(settings.warnDays), sample, region, hinglish }),
};

/** Leave tracker Excel maker. */
export const LeaveWorkbook: React.FC = () => <ListWorkbook spec={SPEC} />;
export default LeaveWorkbook;
