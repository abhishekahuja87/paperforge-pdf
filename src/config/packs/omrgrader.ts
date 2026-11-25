import omrgrader from '../../locales/packs/omrgrader.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** OMR Scanner and Grader (components/tools/omr, logic in src/lib/omr). Runs in the browser. */
export const OMR_TOOLS: PackTool[] = [
  definePackTool({
    id: 'omr-scanner-and-grader', kind: 'omrGrader', guideKey: 'omrGraderGuide', category: 'everyday', icon: 'grid', tier: 'popular',
    keywords: ['omr scanner', 'omr sheet checker with phone camera', 'omr grader free', 'check omr sheets online', 'omr answer sheet reader', 'mcq answer sheet scanner', 'omr sheet marks calculator', 'omr checker without scanner machine', 'scan omr sheet using mobile', 'omr roll number reader', 'multiple choice test grader', 'omr sheet generator and checker'],
  }, omrgrader.toolCatalog),
];
