import teach from '../../locales/packs/teach.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Printable sheets for teachers and tuition owners: class attendance, marks, fees, lesson plan, timetable, homework diary and parent-teacher meeting. Uses the shared records maker (components/tools/records); the first two are home tiles and the rest are in VARIANT_PAGES. */
export const TEACH_TOOLS: PackTool[] = [
  definePackTool({
    id: 'class-attendance-register-printable', kind: 'recClassAttendance', guideKey: 'classAttendanceGuide', category: 'everyday', icon: 'briefcase', tier: 'popular',
    keywords: ['class attendance register', 'student attendance sheet printable', 'school attendance register pdf', 'monthly attendance sheet for teachers', 'tuition attendance register', 'attendance register for students', 'classroom attendance tracker', 'attendance sheet for school', 'student attendance chart', 'teacher attendance register printable'],
  }, teach.toolCatalog),
  definePackTool({
    id: 'student-marks-register-printable', kind: 'recMarks', guideKey: 'marksRegisterGuide', category: 'everyday', icon: 'file-text', tier: 'more',
    keywords: ['marks register printable', 'student marks sheet', 'class result sheet template', 'gradebook printable', 'marks entry sheet', 'test marks register', 'student mark list', 'teacher gradebook pdf', 'exam marks record sheet', 'marks sheet for tuition'],
  }, teach.toolCatalog),
  definePackTool({
    id: 'tuition-fee-register-printable', kind: 'recFees', guideKey: 'tuitionFeeGuide', category: 'business', icon: 'receipt', tier: 'more',
    keywords: ['tuition fee register', 'fee collection register', 'monthly fee record sheet', 'student fee register printable', 'coaching fee register', 'fee register for tuition classes', 'fee payment tracker', 'fee balance sheet', 'school fee record sheet', 'tuition fee tracker'],
  }, teach.toolCatalog),
  definePackTool({
    id: 'weekly-lesson-plan-printable', kind: 'recLessonPlan', guideKey: 'lessonPlanGuide', category: 'everyday', icon: 'clock', tier: 'more',
    keywords: ['weekly lesson plan template', 'lesson plan printable', 'teacher weekly planner', 'lesson planner pdf', 'teacher plan book printable', 'weekly teaching plan', 'lesson plan template for teachers', 'lesson plan format', 'class plan sheet', 'teacher planner printable'],
  }, teach.toolCatalog),
  definePackTool({
    id: 'class-timetable-printable', kind: 'recTimetable', guideKey: 'classTimetableGuide', category: 'everyday', icon: 'clock', tier: 'more',
    keywords: ['class timetable template', 'school time table printable', 'timetable maker', 'period timetable chart', 'weekly timetable for school', 'timetable with break', 'school routine chart', 'time table format', 'class routine printable', 'teacher timetable printable'],
  }, teach.toolCatalog),
  definePackTool({
    id: 'homework-diary-printable', kind: 'recDiary', guideKey: 'homeworkDiaryGuide', category: 'everyday', icon: 'file-text', tier: 'more',
    keywords: ['homework diary printable', 'student diary template', 'weekly homework planner', 'homework tracker for kids', 'school diary printable', 'homework log sheet', 'assignment diary', 'parent signature diary', 'homework chart printable', 'daily homework sheet'],
  }, teach.toolCatalog),
  definePackTool({
    id: 'parent-teacher-meeting-sheet-printable', kind: 'recMeeting', guideKey: 'parentTeacherGuide', category: 'everyday', icon: 'contact', tier: 'more',
    keywords: ['parent teacher meeting form', 'PTM notes template', 'parent teacher conference form', 'parent teacher meeting record', 'student meeting notes template', 'PTM sheet printable', 'parent meeting record format', 'parent teacher communication log', 'parent conference notes', 'student progress discussion sheet'],
  }, teach.toolCatalog),
];
