import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const screen = (name: string) => lazy(() => import('./variants').then((m) => ({ default: (m as unknown as Record<string, ComponentType>)[name]! })));

export const RECORDS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  recMilk: screen('MilkPage'),
  recBudget: screen('BudgetPage'),
  recWarranty: screen('WarrantyPage'),
  recAttendance: screen('AttendancePage'),
  recLedger: screen('LedgerPage'),
  recCash: screen('CashPage'),
  recStock: screen('StockPage'),
  recPetRecord: screen('PetRecordPage'),
  recPetTracker: screen('PetTrackerPage'),
  recPetSitter: screen('PetSitterPage'),
  recClassAttendance: screen('ClassAttendancePage'),
  recMarks: screen('MarksPage'),
  recFees: screen('TuitionFeesPage'),
  recLessonPlan: screen('LessonPlanPage'),
  recTimetable: screen('TimetablePage'),
  recDiary: screen('DiaryPage'),
  recMeeting: screen('MeetingPage'),
  recCleanOffice: screen('CleanOfficePage'),
  recCleanWashroom: screen('CleanWashroomPage'),
  recCleanLift: screen('CleanLiftPage'),
  recCleanRoom: screen('CleanRoomPage'),
  recCleanPantry: screen('CleanPantryPage'),
  recCleanSociety: screen('CleanSocietyPage'),
  recCleanWeekly: screen('CleanWeeklyPage'),
  recCleanRound: screen('CleanRoundPage'),
  recCleanService: screen('CleanServicePage'),
  recCleanDeep: screen('CleanDeepPage'),
};
