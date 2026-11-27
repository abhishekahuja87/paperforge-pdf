import worddocs from '../../locales/packs/worddocs.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Word document makers (components/tools/docs, builders in src/lib/docs, file writer in src/lib/docx). Each builds a .docx in the browser from a few boxes. */
export const WORDDOCS_TOOLS: PackTool[] = [
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
  definePackTool({
    id: 'project-proposal-word-template', kind: 'tplProjectProposal', guideKey: 'projectProposalWordTemplateGuide', category: 'business', icon: 'file-text', tier: 'popular',
    keywords: ['project proposal format in word', 'project proposal sample', 'proposal for client template', 'project proposal docx', 'project proposal template', 'project proposal word template', 'project proposal format', 'project proposal download', 'free project proposal template', 'editable project proposal', 'project proposal with headings', 'project proposal with contents page'],
  }, worddocs.toolCatalog),
  definePackTool({
    id: 'project-report-word-template', kind: 'tplProjectReport', guideKey: 'projectReportWordTemplateGuide', category: 'business', icon: 'file-text', tier: 'popular',
    keywords: ['project report format in word', 'project report sample', 'final project report template', 'project report docx', 'project report template', 'project report word template', 'project report format', 'project report download', 'free project report template', 'editable project report', 'project report with headings', 'project report with contents page'],
  }, worddocs.toolCatalog),
  definePackTool({
    id: 'business-plan-word-template', kind: 'tplBusinessPlan', guideKey: 'businessPlanWordTemplateGuide', category: 'business', icon: 'file-text', tier: 'popular',
    keywords: ['business plan template word', 'business plan format for loan', 'small business plan sample', 'business plan docx', 'business plan template', 'business plan word template', 'business plan format', 'business plan download', 'business plan sample', 'free business plan template', 'editable business plan', 'business plan with headings'],
  }, worddocs.toolCatalog),
  definePackTool({
    id: 'sop-word-template', kind: 'tplSop', guideKey: 'sopWordTemplateGuide', category: 'business', icon: 'file-text', tier: 'popular',
    keywords: ['sop template word', 'standard operating procedure format', 'sop format for company', 'sop docx', 'sop template', 'sop word template', 'sop format', 'sop download', 'sop sample', 'free sop template', 'editable sop', 'sop with headings'],
  }, worddocs.toolCatalog),
  definePackTool({
    id: 'job-description-word-template', kind: 'tplJobDescription', guideKey: 'jobDescriptionWordTemplateGuide', category: 'business', icon: 'file-text', tier: 'popular',
    keywords: ['job description template word', 'jd format for hr', 'job description sample', 'job description docx', 'job description template', 'job description word template', 'job description format', 'job description download', 'free job description template', 'editable job description', 'job description with headings', 'job description with contents page'],
  }, worddocs.toolCatalog),
  definePackTool({
    id: 'company-policy-word-template', kind: 'tplCompanyPolicy', guideKey: 'companyPolicyWordTemplateGuide', category: 'business', icon: 'file-text', tier: 'popular',
    keywords: ['company policy template word', 'policy document format', 'office policy sample', 'policy docx', 'company policy template', 'company policy word template', 'company policy format', 'company policy download', 'company policy sample', 'free company policy template', 'editable company policy', 'company policy with headings'],
  }, worddocs.toolCatalog),
  definePackTool({
    id: 'case-study-word-template', kind: 'tplCaseStudy', guideKey: 'caseStudyWordTemplateGuide', category: 'business', icon: 'file-text', tier: 'popular',
    keywords: ['case study template word', 'case study format for business', 'client case study sample', 'case study docx', 'case study template', 'case study word template', 'case study format', 'case study download', 'case study sample', 'free case study template', 'editable case study', 'case study with headings'],
  }, worddocs.toolCatalog),
  definePackTool({
    id: 'internship-report-word-template', kind: 'tplInternshipReport', guideKey: 'internshipReportWordTemplateGuide', category: 'business', icon: 'file-text', tier: 'popular',
    keywords: ['internship report format in word', 'internship report sample', 'summer training report format', 'internship report docx', 'internship report template', 'internship report word template', 'internship report format', 'internship report download', 'free internship report template', 'editable internship report', 'internship report with headings', 'internship report with contents page'],
  }, worddocs.toolCatalog),
  definePackTool({
    id: 'event-plan-word-template', kind: 'tplEventPlan', guideKey: 'eventPlanWordTemplateGuide', category: 'business', icon: 'file-text', tier: 'popular',
    keywords: ['event plan template word', 'event planning document', 'annual day event plan', 'event plan docx', 'event plan template', 'event plan word template', 'event plan format', 'event plan download', 'event plan sample', 'free event plan template', 'editable event plan', 'event plan with headings'],
  }, worddocs.toolCatalog),
  definePackTool({
    id: 'status-report-word-template', kind: 'tplStatusReport', guideKey: 'statusReportWordTemplateGuide', category: 'business', icon: 'file-text', tier: 'popular',
    keywords: ['weekly status report template word', 'project status report format', 'progress report sample', 'status report docx', 'status report template', 'status report word template', 'status report format', 'status report download', 'status report sample', 'free status report template', 'editable status report', 'status report with headings'],
  }, worddocs.toolCatalog),
];
