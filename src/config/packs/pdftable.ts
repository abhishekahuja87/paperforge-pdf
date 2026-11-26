import pdftable from '../../locales/packs/pdftable.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** PDF Table to Excel (components/tools/pdftable, logic in src/lib/pdftable). Runs in the browser. */
export const PDFTABLE_TOOLS: PackTool[] = [
  definePackTool({
    id: 'pdf-table-to-excel', kind: 'pdfTable', guideKey: 'pdfTableGuide', category: 'pdf', icon: 'grid', tier: 'popular',
    keywords: ['pdf table to excel', 'convert pdf table to excel free', 'bank statement pdf to excel', 'pdf to xlsx table', 'extract table from pdf', 'marksheet pdf to excel', 'invoice pdf to excel', 'pdf to csv table', 'copy table from pdf to excel', 'pdf bank statement to csv', 'convert pdf to excel without upload', 'pdf table extractor'],
  }, pdftable.toolCatalog),
];
