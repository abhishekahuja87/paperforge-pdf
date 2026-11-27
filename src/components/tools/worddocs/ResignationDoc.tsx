import React from 'react';
import { buildResignation, resignationNotes } from '../../../lib/docs/letters';
import T from '../../../locales/packs/worddocs.text.en.json';
import { DocMaker } from './DocMaker';
import type { DocSpec } from './docSpec';

const SPEC: DocSpec = { id: 'resignation-letter', form: T.resignation.form as unknown as DocSpec['form'], starters: T.resignation.starters as unknown as DocSpec['starters'], build: buildResignation, notes: resignationNotes };

/** Resignation Word maker. */
export const ResignationDoc: React.FC = () => <DocMaker spec={SPEC} />;
export default ResignationDoc;
