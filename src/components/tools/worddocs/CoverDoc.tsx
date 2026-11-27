import React from 'react';
import { buildCover } from '../../../lib/docs/letters';
import T from '../../../locales/packs/worddocs.text.en.json';
import { DocMaker } from './DocMaker';
import type { DocSpec } from './docSpec';

const SPEC: DocSpec = { id: 'cover-letter', form: T.cover.form as unknown as DocSpec['form'], starters: T.cover.starters as unknown as DocSpec['starters'], build: buildCover };

/** Cover Word maker. */
export const CoverDoc: React.FC = () => <DocMaker spec={SPEC} />;
export default CoverDoc;
