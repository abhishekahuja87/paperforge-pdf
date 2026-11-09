import careers from '../../locales/packs/careers.en.json';
import { definePackTool, type PackTool } from './types';

/** Tools for people looking for work: resume, notice period and a pre-upload file check. */
export const CAREERS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'resume-builder', kind: 'resume', guideKey: 'resumeBuilder', category: 'everyday', icon: 'file-text', tier: 'popular',
    keywords: ['resume', 'cv', 'resume builder', 'cv maker', 'curriculum vitae', 'job application', 'ats resume', 'free resume'],
  }, careers.toolCatalog),
  definePackTool({
    id: 'notice-period-calculator', kind: 'noticePeriod', guideKey: 'noticePeriodCalc', category: 'everyday', icon: 'calculator', tier: 'more', shareable: true,
    keywords: ['notice period', 'last working day', 'resignation', 'notice buyout', 'relieving date', 'joining date', 'job change'],
  }, careers.toolCatalog),
  definePackTool({
    id: 'upload-file-checker', kind: 'fileChecker', guideKey: 'uploadFileChecker', category: 'pdf', icon: 'shield-check', tier: 'more',
    keywords: ['file size checker', 'upload checker', 'pdf size', 'photo size', 'application form upload', 'file name check', 'document check'],
  }, careers.toolCatalog),
];
