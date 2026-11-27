import React from 'react';
import { buildMinutes } from '../../../lib/docs/records';
import T from '../../../locales/packs/worddocs.text.en.json';
import { DocMaker } from './DocMaker';
import type { DocSpec } from './docSpec';

const SPEC: DocSpec = { id: 'meeting-minutes', form: T.minutes.form as unknown as DocSpec['form'], starters: T.minutes.starters as unknown as DocSpec['starters'], build: buildMinutes };

/** Minutes Word maker. */
export const MinutesDoc: React.FC = () => <DocMaker spec={SPEC} />;
export default MinutesDoc;
