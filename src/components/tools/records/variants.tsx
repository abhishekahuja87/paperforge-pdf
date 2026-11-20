import React from 'react';
import { FAMILIES } from '../../../lib/records';
import { RecordSheets } from './RecordSheets';

/** One screen for each sheet. Every page of a family shows all its sheets; picking one goes to that sheet's address. */
const page = (family: keyof typeof FAMILIES, id: string): React.FC => () => <RecordSheets family={FAMILIES[family]} initialId={id} />;

export const MilkPage = page('home', 'milk-maid-attendance-calendar-printable');
export const BudgetPage = page('home', 'monthly-household-budget-sheet-printable');
export const WarrantyPage = page('home', 'warranty-service-record-printable');
export const AttendancePage = page('shop', 'staff-attendance-register-printable');
export const LedgerPage = page('shop', 'udhaar-credit-ledger-printable');
export const CashPage = page('shop', 'daily-cash-sales-sheet-printable');
export const StockPage = page('shop', 'stock-count-sheet-printable');
export const PetRecordPage = page('pet', 'pet-health-record-card-printable');
export const PetTrackerPage = page('pet', 'pet-vaccination-tracker-printable');
export const PetSitterPage = page('pet', 'pet-sitter-instructions-printable');
export const ClassAttendancePage = page('teach', 'class-attendance-register-printable');
export const MarksPage = page('teach', 'student-marks-register-printable');
export const TuitionFeesPage = page('teach', 'tuition-fee-register-printable');
export const LessonPlanPage = page('teach', 'weekly-lesson-plan-printable');
export const TimetablePage = page('teach', 'class-timetable-printable');
export const DiaryPage = page('teach', 'homework-diary-printable');
export const MeetingPage = page('teach', 'parent-teacher-meeting-sheet-printable');
export const CleanOfficePage = page('clean', 'office-cleaning-checklist-printable');
export const CleanWashroomPage = page('clean', 'washroom-cleaning-checklist-printable');
export const CleanLiftPage = page('clean', 'lift-cleaning-checklist-printable');
export const CleanRoomPage = page('clean', 'room-cleaning-checklist-printable');
export const CleanPantryPage = page('clean', 'pantry-kitchen-cleaning-checklist-printable');
export const CleanSocietyPage = page('clean', 'society-common-area-cleaning-checklist-printable');
export const CleanWeeklyPage = page('clean', 'weekly-cleaning-schedule-printable');
export const CleanRoundPage = page('clean', 'washroom-hourly-cleaning-log-printable');
export const CleanServicePage = page('clean', 'water-tank-cleaning-record-printable');
export const CleanDeepPage = page('clean', 'deep-cleaning-planner-printable');
