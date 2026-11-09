import vcard from '../../locales/packs/vcard.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Contact conversion: vCard (.vcf) to CSV and Excel, in the browser, for files of any size. */
export const VCARD_TOOLS: PackTool[] = [
  definePackTool({
    id: 'vcard-to-csv-converter', kind: 'vcardConverter', guideKey: 'vcardConverterGuide', category: 'everyday', icon: 'file-text', tier: 'popular',
    keywords: ['vcf to csv', 'vcard to excel', 'vcf to xlsx', 'convert vcf to csv', 'contacts to excel', 'export contacts to csv', 'large vcf file converter', 'vcard converter'],
  }, vcard.toolCatalog),
];
