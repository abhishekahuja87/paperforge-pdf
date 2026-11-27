import React from 'react';
import { buildTimesheet } from '../../../lib/workbooks/timesheet';
import T from '../../../locales/packs/workbooks.more.text.en.json';
import { ListWorkbook } from './ListWorkbook';
import type { ListSpec } from './listSpec';

const t = T.timesheet.ui;
const SPEC: ListSpec = {
  id: 'timesheet', fileBase: 'timesheet', ui: { start: t.start, starters: t.starters, listIntro: t.listIntro, previewYours: t.previewYours, previewSample: t.previewSample },
  texts: [{ key: 'business', label: t.business, placeholder: t.businessPlaceholder }],
  numbers: [{ key: 'normalHours', label: t.normal, hint: t.normalHint, min: 1, max: 24 }, { key: 'multiplier', label: t.multiplier, hint: t.multiplierHint, min: 1, max: 5 }, { key: 'spare', label: t.spare, hint: t.spareHint, min: 0, max: 100 }, { key: 'logRows', label: t.logRows, hint: t.logRowsHint, min: 100, max: 5000 }],
  more: ['spare', 'logRows'], region: {},
  defaults: { business: '', normalHours: 8, multiplier: 1.5, spare: 20, logRows: 1000 },
  starters: T.timesheet.starters, sampleHeaders: [t.fieldName, t.fieldRole, t.fieldRate],
  fields: [{ key: 'name', label: t.fieldName, aliases: ['employee', 'worker', 'staff', 'person', 'name'], required: true }, { key: 'role', label: t.fieldRole, aliases: ['designation', 'job', 'position', 'title'] }, { key: 'rate', label: t.fieldRate, aliases: ['rate', 'hourly', 'hourly rate', 'wage', 'pay rate', 'per hour'] }],
  maxRows: 100, tooMany: t.tooMany,
  build: ({ settings, rows, sample, region, hinglish }) => buildTimesheet({ business: String(settings.business), rows, spare: Number(settings.spare), logRows: Number(settings.logRows), normalHours: Number(settings.normalHours), multiplier: Number(settings.multiplier), sample, region, hinglish }),
};

/** Timesheet Excel maker. */
export const TimesheetWorkbook: React.FC = () => <ListWorkbook spec={SPEC} />;
export default TimesheetWorkbook;
