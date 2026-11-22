import devtools from '../../locales/packs/devtools.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Developer tools that work on whole files of data: JSON to CSV and the JSON viewer (components/tools/devtools). All run in the browser. */
export const DEVTOOLS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'json-to-csv-converter', kind: 'devJsonToCsv', guideKey: 'jsonToCsvConverterGuide', category: 'dev', icon: 'file-code', tier: 'popular',
    keywords: ['json to csv', 'convert json to csv online', 'json to excel', 'json file to spreadsheet', 'api response to csv', 'nested json to csv', 'flatten json to csv', 'json array to csv', 'json to csv free', 'json to csv no upload', 'json to google sheets', 'large json to csv'],
  }, devtools.toolCatalog),
  definePackTool({
    id: 'json-viewer', kind: 'devJsonViewer', guideKey: 'jsonViewerGuide', category: 'dev', icon: 'file-code', tier: 'popular',
    keywords: ['json viewer', 'json tree viewer online', 'view nested json', 'json explorer', 'collapse expand json', 'large json viewer', 'json viewer free', 'json path finder', 'search in json', 'json to table viewer', 'open json file online', 'json viewer no upload'],
  }, devtools.toolCatalog),
];
