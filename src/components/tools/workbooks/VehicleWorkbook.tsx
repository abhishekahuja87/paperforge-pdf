import React from 'react';
import { buildVehicle } from '../../../lib/workbooks/vehicle';
import T from '../../../locales/packs/workbooks.more2.text.en.json';
import { ListWorkbook } from './ListWorkbook';
import type { ListSpec } from './listSpec';

const t = T.vehicle.ui;
const SPEC: ListSpec = {
  id: 'vehicle', fileBase: 'vehicle-log-book', ui: { start: t.start, starters: t.starters, listIntro: t.listIntro, previewYours: t.previewYours, previewSample: t.previewSample },
  texts: [{ key: 'business', label: t.business, placeholder: t.businessPlaceholder }],
  numbers: [{ key: 'spare', label: t.spare, hint: t.spareHint, min: 0, max: 20 }, { key: 'logRows', label: t.logRows, hint: t.logRowsHint, min: 100, max: 3000 }],
  more: ['spare', 'logRows'], region: {},
  defaults: { business: '', spare: 3, logRows: 500 },
  starters: T.vehicle.starters, sampleHeaders: [t.fieldName, t.fieldReg, t.fieldNote],
  fields: [{ key: 'name', label: t.fieldName, aliases: ['vehicle', 'car', 'bike', 'name', 'model'], required: true }, { key: 'reg', label: t.fieldReg, aliases: ['registration', 'reg no', 'number plate', 'plate', 'vehicle number'] }, { key: 'note', label: t.fieldNote, aliases: ['notes', 'remark', 'remarks', 'driver'] }],
  maxRows: 30, tooMany: t.tooMany,
  build: ({ settings, rows, sample, region, hinglish }) => buildVehicle({ business: String(settings.business), rows, spare: Number(settings.spare), logRows: Number(settings.logRows), sample, region, hinglish }),
};

/** Vehicle Excel maker. */
export const VehicleWorkbook: React.FC = () => <ListWorkbook spec={SPEC} />;
export default VehicleWorkbook;
