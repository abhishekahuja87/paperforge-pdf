import React from 'react';
import { buildNotice } from '../../../lib/docs/records';
import T from '../../../locales/packs/worddocs.text.en.json';
import { DocMaker } from './DocMaker';
import type { DocSpec } from './docSpec';

const SPEC: DocSpec = { id: 'notice', form: T.notice.form as unknown as DocSpec['form'], starters: T.notice.starters as unknown as DocSpec['starters'], build: buildNotice };

/** Notice Word maker. */
export const NoticeDoc: React.FC = () => <DocMaker spec={SPEC} />;
export default NoticeDoc;
