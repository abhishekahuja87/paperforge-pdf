import hiring from '../../locales/packs/hiring.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Tools for people who hire. Each tool runs in the browser and nothing is uploaded. */
export const HIRING_TOOLS: PackTool[] = [
  definePackTool({
    id: 'job-description-builder', kind: 'jobDescriptionBuilder', guideKey: 'hiringJobDescription', category: 'everyday', icon: 'briefcase', tier: 'popular',
    keywords: ['job description builder', 'job description generator', 'job description template', 'jd maker', 'job posting template', 'job ad maker', 'write a job description', 'job description pdf', 'internship job description', 'sales job description', 'job description for naukri linkedin'],
  }, hiring.toolCatalog),
];
