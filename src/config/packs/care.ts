import care from '../../locales/packs/care.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Printable health and care sheets: one maker with five sheets (medicine chart, health log, emergency card, doctor visit sheet, caregiver log). The medicine chart is the home tile; every other sheet is reached by its button, which links to its own page. Text only organises; nothing here gives medical advice. */
export const CARE_TOOLS: PackTool[] = [
  definePackTool({
    id: 'medicine-schedule-chart-printable', kind: 'careMedicine', guideKey: 'medicineGuide', category: 'everyday', icon: 'shield-check', tier: 'popular',
    keywords: ['medicine schedule chart', 'medicine chart printable', 'pill schedule template', 'medication schedule printable', 'medicine reminder chart', 'daily medicine chart for elderly', 'tablet timetable', 'pill planner printable', 'medication tracker printable', 'weekly pill chart', '1-0-1 medicine chart', 'medicine timetable for parents'],
  }, care.toolCatalog),
  definePackTool({
    id: 'health-log-sheet-printable', kind: 'careLog', guideKey: 'healthLogGuide', category: 'everyday', icon: 'file-text', tier: 'more',
    keywords: ['health log printable', 'blood pressure log printable', 'blood sugar log sheet', 'bp tracker sheet', 'diabetes log printable', 'weight log printable', 'health tracker printable', 'vitals log sheet', 'glucose log pdf', 'blood pressure chart pdf'],
  }, care.toolCatalog),
  definePackTool({
    id: 'emergency-info-card-printable', kind: 'careEmergency', guideKey: 'emergencyCardGuide', category: 'everyday', icon: 'contact', tier: 'more',
    keywords: ['emergency information card', 'medical emergency card printable', 'wallet medical card', 'allergy card printable', 'emergency contact card', 'medical id card printable', 'fridge emergency sheet', 'in case of emergency card', 'blood group card'],
  }, care.toolCatalog),
  definePackTool({
    id: 'doctor-visit-sheet-printable', kind: 'careVisit', guideKey: 'doctorVisitGuide', category: 'everyday', icon: 'file-plus', tier: 'more',
    keywords: ['doctor visit notes template', 'questions to ask the doctor printable', 'doctor appointment sheet', 'medical appointment notes', 'patient visit form', 'doctor visit checklist', 'symptom diary for doctor'],
  }, care.toolCatalog),
  definePackTool({
    id: 'caregiver-daily-log-printable', kind: 'careCaregiver', guideKey: 'caregiverLogGuide', category: 'everyday', icon: 'clock', tier: 'more',
    keywords: ['caregiver log printable', 'daily care log', 'caregiver notes template', 'elderly care log sheet', 'patient care chart', 'home nurse log', 'care handover sheet', 'daily caregiver checklist'],
  }, care.toolCatalog),
];
