import React from 'react';
import { buildLeave, leaveNotes } from '../../../lib/docs/letters';
import T from '../../../locales/packs/worddocs.text.en.json';
import { DocMaker } from './DocMaker';
import type { DocSpec } from './docSpec';

const SPEC: DocSpec = { id: 'leave-application', form: T.leave.form as unknown as DocSpec['form'], starters: T.leave.starters as unknown as DocSpec['starters'], build: buildLeave, notes: leaveNotes };

/** Leave Word maker. */
export const LeaveDoc: React.FC = () => <DocMaker spec={SPEC} />;
export default LeaveDoc;
