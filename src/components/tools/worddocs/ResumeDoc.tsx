import React from 'react';
import { buildResume } from '../../../lib/docs/resume';
import T from '../../../locales/packs/worddocs.text.en.json';
import { DocMaker } from './DocMaker';
import type { DocSpec } from './docSpec';

const SPEC: DocSpec = { id: 'resume', form: T.resume.form as unknown as DocSpec['form'], starters: T.resume.starters as unknown as DocSpec['starters'], build: buildResume };

/** Resume Word maker. */
export const ResumeDoc: React.FC = () => <DocMaker spec={SPEC} />;
export default ResumeDoc;
