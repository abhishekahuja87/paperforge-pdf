import worddocs from '../../locales/packs/worddocs.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Word document makers (components/tools/docs, builders in src/lib/docs, file writer in src/lib/docx). Each builds a .docx in the browser from a few boxes. */
export const WORDDOCS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'resume-word-maker', kind: 'docResume', guideKey: 'resumeWordGuide', category: 'business', icon: 'file-text', tier: 'popular',
    keywords: ['resume in word format', 'resume word template', 'cv format word download', 'resume maker docx', 'free resume template word', 'fresher resume format word', 'editable resume word', 'cv template docx', 'simple resume word doc', 'ats friendly resume word', 'resume builder word download', 'resume format for freshers'],
  }, worddocs.toolCatalog),
  definePackTool({
    id: 'cover-letter-word-maker', kind: 'docCover', guideKey: 'coverWordGuide', category: 'business', icon: 'file-text', tier: 'popular',
    keywords: ['cover letter in word format', 'cover letter template word', 'job application letter format', 'cover letter maker docx', 'free cover letter template', 'cover letter for freshers', 'application letter word download', 'cover letter sample for job', 'editable cover letter', 'simple cover letter format', 'cover letter with address block', 'job application cover letter'],
  }, worddocs.toolCatalog),
  definePackTool({
    id: 'resignation-letter-word-maker', kind: 'docResignation', guideKey: 'resignationWordGuide', category: 'business', icon: 'file-text', tier: 'popular',
    keywords: ['resignation letter format word', 'resignation letter template', 'resignation letter for job', 'simple resignation letter', 'resignation letter with notice period', 'resignation letter docx', 'how to write resignation letter', 'resignation letter sample', 'polite resignation letter', 'resignation letter download', 'one month notice letter', 'resign letter in word'],
  }, worddocs.toolCatalog),
  definePackTool({
    id: 'leave-application-word-maker', kind: 'docLeave', guideKey: 'leaveWordGuide', category: 'business', icon: 'file-text', tier: 'popular',
    keywords: ['leave application format word', 'leave letter for school', 'leave application for office', 'leave letter template', 'leave application for school by parent', 'one day leave application', 'sick leave application word', 'leave letter docx', 'application for leave format', 'simple leave letter', 'leave application download', 'casual leave application'],
  }, worddocs.toolCatalog),
  definePackTool({
    id: 'meeting-minutes-word-maker', kind: 'docMinutes', guideKey: 'minutesWordGuide', category: 'business', icon: 'file-text', tier: 'popular',
    keywords: ['meeting minutes template word', 'minutes of meeting format', 'meeting minutes sample', 'mom format word', 'meeting notes template', 'committee meeting minutes', 'minutes of meeting docx', 'action items template', 'weekly meeting minutes format', 'society meeting minutes', 'minutes of meeting download', 'simple meeting minutes'],
  }, worddocs.toolCatalog),
  definePackTool({
    id: 'notice-word-maker', kind: 'docNotice', guideKey: 'noticeWordGuide', category: 'business', icon: 'file-text', tier: 'popular',
    keywords: ['notice format word', 'school circular format', 'notice writing format', 'office notice template', 'society notice format', 'circular format in word', 'notice for residents', 'notice board notice template', 'parents notice format', 'notice docx', 'official notice sample', 'notice for staff'],
  }, worddocs.toolCatalog),
];
