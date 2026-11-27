import React from 'react';
import T from '../../../locales/packs/worddocs.templates.text.en.json';
import { TemplateMaker, type TemplateDef } from './TemplateMaker';

const T2 = T.templates as unknown as Record<string, TemplateDef>;

/** project-proposal Word template. */
export const ProjectProposalTemplate: React.FC = () => <TemplateMaker template={T2['project-proposal']!} />;

/** project-report Word template. */
export const ProjectReportTemplate: React.FC = () => <TemplateMaker template={T2['project-report']!} />;

/** business-plan Word template. */
export const BusinessPlanTemplate: React.FC = () => <TemplateMaker template={T2['business-plan']!} />;

/** sop Word template. */
export const SopTemplate: React.FC = () => <TemplateMaker template={T2['sop']!} />;

/** job-description Word template. */
export const JobDescriptionTemplate: React.FC = () => <TemplateMaker template={T2['job-description']!} />;

/** company-policy Word template. */
export const CompanyPolicyTemplate: React.FC = () => <TemplateMaker template={T2['company-policy']!} />;

/** case-study Word template. */
export const CaseStudyTemplate: React.FC = () => <TemplateMaker template={T2['case-study']!} />;

/** internship-report Word template. */
export const InternshipReportTemplate: React.FC = () => <TemplateMaker template={T2['internship-report']!} />;

/** event-plan Word template. */
export const EventPlanTemplate: React.FC = () => <TemplateMaker template={T2['event-plan']!} />;

/** status-report Word template. */
export const StatusReportTemplate: React.FC = () => <TemplateMaker template={T2['status-report']!} />;

/** marketing-plan Word template. */
export const MarketingPlanTemplate: React.FC = () => <TemplateMaker template={T2['marketing-plan']!} />;

/** lesson-plan Word template. */
export const LessonPlanTemplate: React.FC = () => <TemplateMaker template={T2['lesson-plan']!} />;

/** seminar-report Word template. */
export const SeminarReportTemplate: React.FC = () => <TemplateMaker template={T2['seminar-report']!} />;

/** product-requirements Word template. */
export const ProductRequirementsTemplate: React.FC = () => <TemplateMaker template={T2['product-requirements']!} />;

/** training-manual Word template. */
export const TrainingManualTemplate: React.FC = () => <TemplateMaker template={T2['training-manual']!} />;

/** grant-proposal Word template. */
export const GrantProposalTemplate: React.FC = () => <TemplateMaker template={T2['grant-proposal']!} />;
