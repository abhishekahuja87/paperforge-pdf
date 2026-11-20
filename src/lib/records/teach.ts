import { addDays, monthName, parseIso, shortDate, weekdayName } from '../planner/dates';
import { INK, clamp, fitText, flag, line, lines, makePages, num, ruled, str, table, text, titleBar, type Ctx } from './draw';
import { monthGrid } from './grid';
import type { Family, SheetDef } from './types';

const LOCALE = 'en';
const now = new Date();
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: monthName(2026, i + 1, LOCALE) }));
const SHORT_MONTHS = Array.from({ length: 12 }, (_, i) => monthName(2026, i + 1, LOCALE).slice(0, 3));

/** A label with a line after it, and a typed value on the line. */
function blank(c: Ctx, x: number, y: number, w: number, label: string, value = ''): void {
  text(c, x, y + 3.2, 8, label, true, 'start', INK);
  const at = x + label.length * 1.75 + 2;
  line(c, at, y + 3.7, x + w, y + 3.7, c.weight * 0.9);
  fitText(c, at + 1, y + 2.6, x + w - at - 2, 5, value, 9);
}

const classAttendance: SheetDef = {
  id: 'class-attendance-register-printable',
  label: 'Class attendance register',
  hint: 'Students by days, a month',
  path: '/class-attendance-register-printable',
  landscape: true,
  fields: [
    { type: 'list', key: 'students', label: 'Student names (optional)', hint: 'One per line, up to 40. Leave empty to write the names by hand.', max: 40 },
    { type: 'number', key: 'rows', label: 'Rows', min: 10, max: 40, step: 1, unit: 'rows' },
    { type: 'select', key: 'month', label: 'Month', options: MONTHS },
    { type: 'number', key: 'year', label: 'Year', min: 2020, max: 2100, step: 1, unit: '' },
    { type: 'number', key: 'months', label: 'How many months', min: 1, max: 12, step: 1, unit: 'months' },
    { type: 'toggle', key: 'skipSundays', label: 'Leave out Sundays', hint: 'Only the days classes can run get a column, so the boxes are wider.' },
    { type: 'toggle', key: 'weekdays', label: 'Weekday letters under the dates' },
    { type: 'toggle', key: 'totals', label: 'Present and absent totals' },
  ],
  defaults: { students: '', rows: 30, month: String(now.getMonth() + 1), year: now.getFullYear(), months: 1, skipSundays: true, weekdays: true, totals: true },
  build: (v, common) => {
    const students = lines(v, 'students', 40);
    const rows = Math.max(clamp(num(v, 'rows', 30), 10, 40), students.length);
    return makePages(common, clamp(num(v, 'months', 1), 1, 12), (c, i) => {
      const index = clamp(num(v, 'month', 1), 1, 12) - 1 + i;
      const year = clamp(num(v, 'year', now.getFullYear()), 2020, 2100) + Math.floor(index / 12);
      const month = (index % 12) + 1;
      monthGrid(c, {
        title: `Class attendance: ${monthName(year, month, LOCALE)} ${year}`, labelHead: 'Student name', labelW: 46, labels: students, rows, year, month,
        skipSundays: flag(v, 'skipSundays'), weekdays: flag(v, 'weekdays'),
        tail: flag(v, 'totals') ? [{ label: 'Present', w: 12 }, { label: 'Absent', w: 12 }] : [],
        foot: [],
        legend: 'Write P for present, A for absent and L for leave. Count the days at the end of the month.',
      });
    });
  },
};

const marks: SheetDef = {
  id: 'student-marks-register-printable',
  label: 'Student marks register',
  hint: 'Students by tests and subjects',
  path: '/student-marks-register-printable',
  landscape: true,
  fields: [
    { type: 'text', key: 'subject', label: 'Subject', placeholder: 'Mathematics', max: 30 },
    { type: 'list', key: 'students', label: 'Student names (optional)', hint: 'One per line, up to 40.', max: 40 },
    { type: 'list', key: 'tests', label: 'Columns (tests or subjects)', hint: 'One per line, up to 8.', max: 8 },
    { type: 'number', key: 'rows', label: 'Rows', min: 10, max: 40, step: 1, unit: 'rows' },
    { type: 'toggle', key: 'max', label: 'Space for maximum marks in each heading' },
    { type: 'toggle', key: 'totals', label: 'Total and percentage columns' },
  ],
  defaults: { subject: '', students: '', tests: 'Unit test 1\nUnit test 2\nMid-term\nUnit test 3\nFinal exam', rows: 30, max: true, totals: true },
  build: (v, common) => {
    const students = lines(v, 'students', 40);
    const tests = lines(v, 'tests', 8);
    const rows = Math.max(clamp(num(v, 'rows', 30), 10, 40), students.length);
    return makePages(common, 1, (c) => {
      const top = c.y + titleBar(c, 'Student marks register');
      blank(c, c.x, top + 1, 90, 'Subject:', str(v, 'subject'));
      blank(c, c.x + 100, top + 1, 70, 'Teacher:');
      blank(c, c.x + 180, top + 1, c.w - 180, 'Year:');
      const columns = [{ label: 'No.', w: 0.5 }, { label: 'Student', w: 3.2 }, ...tests.map((label) => ({ label: flag(v, 'max') ? `${label} / ___` : label, w: 1.3 }))];
      if (flag(v, 'totals')) columns.push({ label: 'Total', w: 1.1 }, { label: '%', w: 0.9 });
      table(c, top + 10, c.y + c.h - 2, columns, rows, students, { numbered: true, headH: 12, headSize: 8 });
    });
  },
};

const fees: SheetDef = {
  id: 'tuition-fee-register-printable',
  label: 'Tuition fee register',
  hint: 'Students by twelve months',
  path: '/tuition-fee-register-printable',
  landscape: true,
  fields: [
    { type: 'list', key: 'students', label: 'Student names (optional)', hint: 'One per line, up to 30.', max: 30 },
    { type: 'number', key: 'rows', label: 'Rows', min: 10, max: 30, step: 1, unit: 'rows' },
    { type: 'select', key: 'start', label: 'First month', options: MONTHS },
    { type: 'toggle', key: 'fee', label: 'Monthly fee column' },
    { type: 'toggle', key: 'totals', label: 'Total paid and balance columns' },
  ],
  defaults: { students: '', rows: 20, start: '4', fee: true, totals: true },
  build: (v, common) => {
    const students = lines(v, 'students', 30);
    const rows = Math.max(clamp(num(v, 'rows', 20), 10, 30), students.length);
    const first = clamp(num(v, 'start', 4), 1, 12) - 1;
    return makePages(common, 1, (c) => {
      const top = c.y + titleBar(c, 'Tuition fee register', 'Write the amount and the date paid in the box for each month.');
      const columns = [{ label: 'No.', w: 0.5 }, { label: 'Student', w: 2.6 }];
      if (flag(v, 'fee')) columns.push({ label: 'Fee per month', w: 1.2 });
      for (let m = 0; m < 12; m += 1) columns.push({ label: SHORT_MONTHS[(first + m) % 12]!, w: 1 });
      if (flag(v, 'totals')) columns.push({ label: 'Total paid', w: 1.2 }, { label: 'Balance', w: 1.2 });
      table(c, top, c.y + c.h - 2, columns, rows, students, { numbered: true, headH: 9, headSize: 8 });
    });
  },
};

const lessonPlan: SheetDef = {
  id: 'weekly-lesson-plan-printable',
  label: 'Weekly lesson plan',
  hint: 'Topic, activities, homework by day',
  path: '/weekly-lesson-plan-printable',
  landscape: true,
  fields: [
    { type: 'text', key: 'subject', label: 'Subject and class', placeholder: 'Science, Class 7', max: 40 },
    { type: 'date', key: 'week', label: 'Week starting (optional)' },
    { type: 'select', key: 'days', label: 'Days', options: [{ value: '5', label: 'Monday to Friday' }, { value: '6', label: 'Monday to Saturday' }] },
    { type: 'toggle', key: 'notes', label: 'Notes and reflection strip' },
  ],
  defaults: { subject: '', week: '', days: '6', notes: true },
  build: (v, common) => makePages(common, 1, (c) => {
    const top = c.y + titleBar(c, 'Weekly lesson plan');
    blank(c, c.x, top + 1, 120, 'Subject and class:', str(v, 'subject'));
    blank(c, c.x + 130, top + 1, c.w - 130, 'Teacher:');
    const days = Number(v.days) === 5 ? 5 : 6;
    const start = parseIso(str(v, 'week'));
    const notesH = flag(v, 'notes') ? 24 : 0;
    const gridTop = top + 10;
    const bottom = c.y + c.h - notesH - (notesH ? 3 : 0);
    const colW = c.w / days;
    const headH = 9;
    const parts: [string, number][] = [['Topic', 0.24], ['Activities', 0.46], ['Homework or assessment', 0.3]];
    line(c, c.x, gridTop, c.x + c.w, gridTop, c.weight * 1.6);
    for (let d = 0; d < days; d += 1) {
      const x = c.x + d * colW;
      const date = start ? ` · ${shortDate(addDays(start, d), LOCALE)}` : '';
      text(c, x + colW / 2, gridTop + 6, 9, weekdayName((d + 1) % 7, LOCALE, 'long') + date, true, 'middle', INK);
      let y = gridTop + headH;
      parts.forEach(([label, share]) => {
        const h = (bottom - gridTop - headH) * share;
        line(c, x, y, x + colW, y, c.weight * 1.2);
        text(c, x + 1.5, y + 4, 7, label, true, 'start', '#555555');
        ruled(c, x + 1, x + colW - 1, y + 4, y + h - 1, 7);
        y += h;
      });
    }
    line(c, c.x, bottom, c.x + c.w, bottom, c.weight * 1.6);
    for (let d = 0; d <= days; d += 1) line(c, c.x + d * colW, gridTop, c.x + d * colW, bottom, d === 0 || d === days ? c.weight * 1.6 : c.weight);
    if (notesH) {
      const y = bottom + 3;
      text(c, c.x + 1, y + 4.5, 9, 'Notes and reflection', true, 'start', INK);
      ruled(c, c.x, c.x + c.w, y + 4, y + notesH, 7);
      line(c, c.x, y + notesH, c.x + c.w, y + notesH, c.weight * 1.6);
    }
  }),
};

/** Turns "08:00" into minutes after midnight. */
const minutesOf = (value: string, fallback: number): number => {
  const match = /^(\d{1,2})[:.](\d{2})$/.exec(value.trim());
  if (!match) return fallback;
  const h = Number(match[1]);
  const m = Number(match[2]);
  return h < 24 && m < 60 ? h * 60 + m : fallback;
};
const clock = (minutes: number, twelve: boolean): string => {
  const h = Math.floor(minutes / 60) % 24;
  const m = String(minutes % 60).padStart(2, '0');
  if (!twelve) return `${String(h).padStart(2, '0')}:${m}`;
  return `${h % 12 === 0 ? 12 : h % 12}:${m}`;
};

const timetable: SheetDef = {
  id: 'class-timetable-printable',
  label: 'Class timetable',
  hint: 'Periods and times, by day',
  path: '/class-timetable-printable',
  landscape: true,
  fields: [
    { type: 'select', key: 'days', label: 'Days', options: [{ value: '5', label: 'Monday to Friday' }, { value: '6', label: 'Monday to Saturday' }, { value: '7', label: 'Monday to Sunday' }] },
    { type: 'number', key: 'periods', label: 'Periods a day', min: 4, max: 10, step: 1, unit: 'periods' },
    { type: 'text', key: 'start', label: 'First period starts (24-hour, like 08:00)', placeholder: '08:00', max: 5 },
    { type: 'number', key: 'length', label: 'Period length', min: 25, max: 90, step: 5, unit: 'min' },
    { type: 'number', key: 'breakAfter', label: 'Break after period (0 for none)', min: 0, max: 9, step: 1, unit: '' },
    { type: 'number', key: 'breakLength', label: 'Break length', min: 5, max: 60, step: 5, unit: 'min' },
    { type: 'toggle', key: 'twelve', label: '12-hour times (no am or pm)' },
  ],
  defaults: { days: '6', periods: 8, start: '08:00', length: 40, breakAfter: 4, breakLength: 20, twelve: false },
  build: (v, common) => makePages(common, 1, (c) => {
    const top = c.y + titleBar(c, 'Class timetable');
    const days = clamp(num(v, 'days', 6), 5, 7);
    const periods = clamp(num(v, 'periods', 8), 4, 10);
    const length = clamp(num(v, 'length', 40), 25, 90);
    const breakAfter = clamp(num(v, 'breakAfter', 0), 0, periods - 1);
    const breakLength = clamp(num(v, 'breakLength', 20), 5, 60);
    let at = minutesOf(str(v, 'start'), 8 * 60);
    const slots: { label: string; isBreak: boolean }[] = [];
    for (let p = 1; p <= periods; p += 1) {
      slots.push({ label: `${clock(at, flag(v, 'twelve'))} - ${clock(at + length, flag(v, 'twelve'))}`, isBreak: false });
      at += length;
      if (p === breakAfter) { slots.push({ label: `${clock(at, flag(v, 'twelve'))} - ${clock(at + breakLength, flag(v, 'twelve'))}`, isBreak: true }); at += breakLength; }
    }
    const headH = 10;
    const gridTop = top + 1;
    const bottom = c.y + c.h - 2;
    const units = slots.reduce((sum, s) => sum + (s.isBreak ? 0.55 : 1), 0);
    const unit = (bottom - gridTop - headH) / units;
    const timeW = 34;
    const dayW = (c.w - timeW) / days;
    line(c, c.x, gridTop, c.x + c.w, gridTop, c.weight * 1.6);
    text(c, c.x + timeW / 2, gridTop + 6.5, 9, 'Period and time', true, 'middle', INK);
    for (let d = 0; d < days; d += 1) text(c, c.x + timeW + d * dayW + dayW / 2, gridTop + 6.5, 10, weekdayName((d + 1) % 7, LOCALE, 'long'), true, 'middle', INK);
    let y = gridTop + headH;
    let period = 0;
    const edges: { from: number; to: number }[] = [{ from: gridTop, to: gridTop + headH }];
    slots.forEach((slot) => {
      const h = unit * (slot.isBreak ? 0.55 : 1);
      line(c, c.x, y, c.x + c.w, y, slot.isBreak || y === gridTop + headH ? c.weight * 1.6 : c.weight);
      if (slot.isBreak) text(c, c.x + c.w / 2, y + h / 2 + 1.6, 8, `BREAK  ${slot.label}`, true, 'middle', '#666666');
      else { period += 1; text(c, c.x + 2, y + h / 2 - 0.4, 9, `${period}`, true, 'start', INK); text(c, c.x + 9, y + h / 2 + 0.2, 7.5, slot.label, false, 'start'); edges.push({ from: y, to: y + h }); }
      y += h;
    });
    line(c, c.x, y, c.x + c.w, y, c.weight * 1.6);
    line(c, c.x, gridTop, c.x, y, c.weight * 1.6);
    line(c, c.x + c.w, gridTop, c.x + c.w, y, c.weight * 1.6);
    // The lines between days stop at the break row, which runs across the whole page.
    for (let d = 0; d <= days - 1; d += 1) edges.forEach((edge) => line(c, c.x + timeW + d * dayW, edge.from, c.x + timeW + d * dayW, edge.to, d === 0 ? c.weight * 1.6 : c.weight));
  }),
};

const diary: SheetDef = {
  id: 'homework-diary-printable',
  label: 'Homework diary',
  hint: 'A week of homework, signed',
  path: '/homework-diary-printable',
  landscape: false,
  fields: [
    { type: 'date', key: 'week', label: 'Week starting (optional)' },
    { type: 'select', key: 'days', label: 'Days', options: [{ value: '5', label: 'Monday to Friday' }, { value: '6', label: 'Monday to Saturday' }] },
    { type: 'number', key: 'lines', label: 'Lines each day', min: 3, max: 6, step: 1, unit: 'lines' },
    { type: 'toggle', key: 'sign', label: 'Parent signature box for each day' },
    { type: 'toggle', key: 'note', label: 'Teacher note at the bottom' },
    { type: 'number', key: 'pages', label: 'Pages (weeks)', min: 1, max: 12, step: 1, unit: 'pages' },
  ],
  defaults: { week: '', days: '6', lines: 4, sign: true, note: true, pages: 1 },
  build: (v, common) => makePages(common, clamp(num(v, 'pages', 1), 1, 12), (c, page) => {
    const top = c.y + titleBar(c, 'Homework diary');
    blank(c, c.x, top + 1, c.w * 0.55, 'Name:');
    blank(c, c.x + c.w * 0.6, top + 1, c.w * 0.4, 'Class:');
    const days = Number(v.days) === 5 ? 5 : 6;
    const rows = clamp(num(v, 'lines', 4), 3, 6);
    const start = parseIso(str(v, 'week'));
    const noteH = flag(v, 'note') ? 26 : 0;
    const gridTop = top + 11;
    const bottom = c.y + c.h - noteH - (noteH ? 3 : 0);
    const blockH = (bottom - gridTop) / days;
    const dayW = 24;
    const signW = flag(v, 'sign') ? 24 : 0;
    const subjectW = 30;
    for (let d = 0; d < days; d += 1) {
      const y = gridTop + d * blockH;
      line(c, c.x, y, c.x + c.w, y, c.weight * 1.6);
      const date = start ? shortDate(addDays(start, d + page * 7), LOCALE) : '';
      text(c, c.x + dayW / 2, y + blockH / 2 - 0.5, 9, weekdayName((d + 1) % 7, LOCALE, 'short'), true, 'middle', INK);
      if (date) text(c, c.x + dayW / 2, y + blockH / 2 + 4.5, 7.5, date, false, 'middle');
      const rowH = blockH / rows;
      for (let r = 1; r < rows; r += 1) line(c, c.x + dayW, y + r * rowH, c.x + c.w - signW, y + r * rowH, c.weight * 0.8);
      line(c, c.x + dayW, y, c.x + dayW, y + blockH, c.weight);
      line(c, c.x + dayW + subjectW, y, c.x + dayW + subjectW, y + blockH, c.weight * 0.8);
      if (d === 0) {
        text(c, c.x + dayW + subjectW / 2, y - 0.8, 7, 'Subject', true, 'middle', '#555555');
        text(c, c.x + dayW + subjectW + (c.w - dayW - subjectW - signW) / 2, y - 0.8, 7, 'Homework', true, 'middle', '#555555');
      }
      if (signW) {
        line(c, c.x + c.w - signW, y, c.x + c.w - signW, y + blockH, c.weight);
        text(c, c.x + c.w - signW / 2, y + blockH - 2, 6.5, 'Parent sign', false, 'middle', '#777777');
      }
    }
    line(c, c.x, bottom, c.x + c.w, bottom, c.weight * 1.6);
    line(c, c.x, gridTop, c.x, bottom, c.weight * 1.6);
    line(c, c.x + c.w, gridTop, c.x + c.w, bottom, c.weight * 1.6);
    if (noteH) {
      const y = bottom + 3;
      text(c, c.x + 1, y + 4.5, 9, "Teacher's note", true, 'start', INK);
      ruled(c, c.x, c.x + c.w, y + 4, y + noteH, 7.5);
      line(c, c.x, y + noteH, c.x + c.w, y + noteH, c.weight * 1.6);
    }
  }),
};

const meeting: SheetDef = {
  id: 'parent-teacher-meeting-sheet-printable',
  label: 'Parent-teacher meeting sheet',
  hint: 'A page for each student',
  path: '/parent-teacher-meeting-sheet-printable',
  landscape: false,
  fields: [
    { type: 'list', key: 'students', label: 'Student names (optional)', hint: 'One per line, up to 30. Each student gets a page. Leave empty for blank pages.', max: 30 },
    { type: 'number', key: 'pages', label: 'Blank pages', min: 1, max: 30, step: 1, unit: 'pages' },
  ],
  defaults: { students: '', pages: 2 },
  build: (v, common) => {
    const students = lines(v, 'students', 30);
    const count = students.length > 0 ? students.length : clamp(num(v, 'pages', 2), 1, 30);
    return makePages(common, count, (c, i) => {
      const top = c.y + titleBar(c, 'Parent-teacher meeting');
      blank(c, c.x, top + 1, c.w * 0.62, 'Student:', students[i] ?? '');
      blank(c, c.x + c.w * 0.66, top + 1, c.w * 0.34, 'Date:');
      blank(c, c.x, top + 10, c.w * 0.62, 'Parent or guardian:');
      blank(c, c.x + c.w * 0.66, top + 10, c.w * 0.34, 'Phone:');
      const sections = ['Attendance and punctuality', 'Progress in studies', 'Strengths', 'Concerns', 'What we agreed to do', "Parent's comments"];
      const signH = 20;
      let y = top + 21;
      const each = (c.y + c.h - signH - y) / sections.length;
      sections.forEach((label) => {
        line(c, c.x, y, c.x + c.w, y, c.weight * 1.6);
        text(c, c.x + 1, y + 5.5, 9.5, label, true, 'start', INK);
        ruled(c, c.x, c.x + c.w, y + 6, y + each - 1, 7.5);
        y += each;
      });
      line(c, c.x, y, c.x + c.w, y, c.weight * 1.6);
      blank(c, c.x, y + 8, c.w * 0.32, 'Teacher sign:');
      blank(c, c.x + c.w * 0.34, y + 8, c.w * 0.32, 'Parent sign:');
      blank(c, c.x + c.w * 0.68, y + 8, c.w * 0.32, 'Next meeting:');
    });
  },
};

export const TEACH_FAMILY: Family = {
  key: 'teach',
  headingLabel: 'Class or tuition name',
  headingPlaceholder: 'Class 8 B  or  Sharma Tuition Classes',
  note: 'These sheets help you keep a teacher\'s records. Follow your school\'s or board\'s own formats where it requires them.',
  sheets: [classAttendance, marks, fees, lessonPlan, timetable, diary, meeting],
};
