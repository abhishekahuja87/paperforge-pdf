import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const WORDDOCS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  docCover: lazy(() => import('./CoverDoc')),
  docResignation: lazy(() => import('./ResignationDoc')),
  docLeave: lazy(() => import('./LeaveDoc')),
  docMinutes: lazy(() => import('./MinutesDoc')),
  docNotice: lazy(() => import('./NoticeDoc')),
  tplProjectProposal: lazy(() => import('./TemplatePages').then((m) => ({ default: m.ProjectProposalTemplate }))),
  tplProjectReport: lazy(() => import('./TemplatePages').then((m) => ({ default: m.ProjectReportTemplate }))),
  tplBusinessPlan: lazy(() => import('./TemplatePages').then((m) => ({ default: m.BusinessPlanTemplate }))),
  tplSop: lazy(() => import('./TemplatePages').then((m) => ({ default: m.SopTemplate }))),
  tplJobDescription: lazy(() => import('./TemplatePages').then((m) => ({ default: m.JobDescriptionTemplate }))),
  tplCompanyPolicy: lazy(() => import('./TemplatePages').then((m) => ({ default: m.CompanyPolicyTemplate }))),
  tplCaseStudy: lazy(() => import('./TemplatePages').then((m) => ({ default: m.CaseStudyTemplate }))),
  tplInternshipReport: lazy(() => import('./TemplatePages').then((m) => ({ default: m.InternshipReportTemplate }))),
  tplEventPlan: lazy(() => import('./TemplatePages').then((m) => ({ default: m.EventPlanTemplate }))),
  tplStatusReport: lazy(() => import('./TemplatePages').then((m) => ({ default: m.StatusReportTemplate }))),
};
