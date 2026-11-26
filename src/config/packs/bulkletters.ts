import bulkletters from '../../locales/packs/bulkletters.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Bulk Letter Maker (components/tools/letters, logic in src/lib/letters). Runs in the browser. */
export const BULKLETTERS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'bulk-letter-maker', kind: 'bulkLetters', guideKey: 'bulkLettersGuide', category: 'business', icon: 'file-text', tier: 'popular',
    keywords: ['bulk letter maker', 'mail merge to pdf', 'letters from excel list', 'fee reminder letter for every student', 'mail merge without word', 'society dues notice for every flat', 'personalised letters from csv', 'invitation letter for each guest', 'mail merge online free', 'letter generator from excel data', 'bulk offer letter maker', 'mail merge pdf from csv'],
  }, bulkletters.toolCatalog),
];
