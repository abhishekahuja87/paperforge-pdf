import students from '../../locales/packs/students.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Tools for students: grades, citations and exam planning. */
export const STUDENTS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'gpa-cgpa-calculator', kind: 'gpa', guideKey: 'gpaCalc', category: 'everyday', icon: 'calculator', tier: 'popular',
    keywords: ['gpa calculator', 'cgpa calculator', 'cgpa to percentage', 'sgpa', 'grade point average', 'college gpa', 'semester gpa', 'target cgpa'],
  }, students.toolCatalog),
  definePackTool({
    id: 'final-grade-calculator', kind: 'finalGrade', guideKey: 'finalGradeCalc', category: 'everyday', icon: 'calculator', tier: 'more',
    keywords: ['final grade calculator', 'what do i need on the final', 'weighted grade', 'exam score needed', 'course grade', 'grade calculator'],
  }, students.toolCatalog),
  definePackTool({
    id: 'citation-generator', kind: 'citation', guideKey: 'citationGen', category: 'everyday', icon: 'file-text', tier: 'popular',
    keywords: ['citation generator', 'apa citation', 'mla citation', 'harvard referencing', 'chicago citation', 'bibliography', 'reference list', 'cite a website'],
  }, students.toolCatalog),
  definePackTool({
    id: 'study-planner', kind: 'studyPlanner', guideKey: 'studyPlannerGuide', category: 'everyday', icon: 'grid', tier: 'more',
    keywords: ['study planner', 'exam timetable', 'study schedule', 'revision planner', 'exam preparation', 'study plan generator'],
  }, students.toolCatalog),
];
