import { addDays, longDate, monthName, parseIso } from '../planner/dates';
import { INK, clamp, flag, lines, makePages, num, ruled, str, table, text, titleBar } from './draw';
import { monthGrid } from './grid';
import type { Family, SheetDef } from './types';

const LOCALE = 'en';
const now = new Date();
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: monthName(2026, i + 1, LOCALE) }));
const SHORT_MONTHS = Array.from({ length: 12 }, (_, i) => monthName(2026, i + 1, LOCALE).slice(0, 3));
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

interface ChecklistSpec {
  id: string;
  label: string;
  hint: string;
  /** Title printed on the sheet. */
  title: string;
  /** What the "Area" line is called on this sheet. */
  areaLabel: string;
  tasks: string[];
}

/** A month of daily cleaning: tasks down the side, a box for each day, and sign-off rows. The same layout serves every kind of area; only the starting task list differs. */
const checklist = (spec: ChecklistSpec): SheetDef => ({
  id: spec.id,
  label: spec.label,
  hint: spec.hint,
  path: `/${spec.id}`,
  landscape: true,
  fields: [
    { type: 'text', key: 'area', label: spec.areaLabel, max: 40 },
    { type: 'list', key: 'tasks', label: 'Tasks', hint: 'One per line, up to 20. Edit, delete or add your own.', max: 20 },
    { type: 'number', key: 'rows', label: 'Rows', min: 8, max: 20, step: 1, unit: 'rows' },
    { type: 'select', key: 'month', label: 'Month', options: MONTHS },
    { type: 'number', key: 'year', label: 'Year', min: 2020, max: 2100, step: 1, unit: '' },
    { type: 'number', key: 'months', label: 'How many months', min: 1, max: 12, step: 1, unit: 'months' },
    { type: 'toggle', key: 'signoff', label: "Cleaner's and supervisor's sign-off rows" },
    { type: 'toggle', key: 'skipSundays', label: 'Leave out Sundays' },
    { type: 'toggle', key: 'weekdays', label: 'Weekday letters under the dates' },
  ],
  defaults: { area: '', tasks: spec.tasks.join('\n'), rows: Math.max(8, spec.tasks.length), month: String(now.getMonth() + 1), year: now.getFullYear(), months: 1, signoff: true, skipSundays: false, weekdays: true },
  build: (v, common) => {
    const tasks = lines(v, 'tasks', 20);
    const rows = Math.max(clamp(num(v, 'rows', 12), 8, 20), tasks.length);
    return makePages(common, clamp(num(v, 'months', 1), 1, 12), (c, i) => {
      const index = clamp(num(v, 'month', 1), 1, 12) - 1 + i;
      const year = clamp(num(v, 'year', now.getFullYear()), 2020, 2100) + Math.floor(index / 12);
      const month = (index % 12) + 1;
      monthGrid(c, {
        title: `${spec.title}: ${monthName(year, month, LOCALE)} ${year}`, sub: str(v, 'area') ? `${spec.areaLabel.replace(/ \(.*$/, '')}: ${str(v, 'area')}` : '',
        labelHead: 'Task', labelW: 70, labels: tasks, rows, year, month, skipSundays: flag(v, 'skipSundays'), weekdays: flag(v, 'weekdays'),
        tail: [], foot: flag(v, 'signoff') ? ["Cleaner's initials", "Supervisor's check"] : [],
        legend: 'Tick or write your initials in the box when the task is done. Write X if it was not needed that day, and note problems on the back.',
      });
    });
  },
});

const office = checklist({
  id: 'office-cleaning-checklist-printable', label: 'Office and ODC cleaning', hint: 'Floors, desks, glass, bins', title: 'Office cleaning checklist', areaLabel: 'Floor or area (optional)',
  tasks: ['Sweep and mop floors', 'Dust desks, partitions and monitors', 'Empty dustbins and replace liners', 'Clean glass doors and partitions', 'Wipe door handles and switches', 'Clean pantry counter and sink', 'Vacuum carpets and mats', 'Wipe meeting room tables', 'Clean chairs and common sofas', 'Clean reception and entrance', 'Check the washroom log is filled'],
});
const washroom = checklist({
  id: 'washroom-cleaning-checklist-printable', label: 'Washroom cleaning', hint: 'Toilets, basins, supplies', title: 'Washroom cleaning checklist', areaLabel: 'Washroom (optional)',
  tasks: ['Clean toilet seats and bowls', 'Clean urinals', 'Scrub and mop the floor', 'Clean wash basins and taps', 'Wipe mirrors', 'Clean doors and partitions', 'Empty bins and replace liners', 'Refill soap, tissue and sanitiser', 'Check for leaks and water supply', 'Check light and exhaust fan work'],
});
const lift = checklist({
  id: 'lift-cleaning-checklist-printable', label: 'Lift cleaning', hint: 'Floor, walls, buttons, tracks', title: 'Lift cleaning checklist', areaLabel: 'Lift name or number (optional)',
  tasks: ['Sweep and mop the lift floor', 'Wipe walls and panels', 'Clean mirror and glass', 'Wipe buttons and call panels', 'Clean door tracks and sills', 'Wipe handrails', 'Clean the ceiling light cover', 'Clean lift doors on every floor', 'Clean the notice frame', 'Remove litter from the lift lobby'],
});
const room = checklist({
  id: 'room-cleaning-checklist-printable', label: 'Room cleaning', hint: 'Hotel, hostel, PG, guest room', title: 'Room cleaning checklist', areaLabel: 'Room number (optional)',
  tasks: ['Change bed linen', 'Make the bed', 'Dust furniture and shelves', 'Sweep and mop the floor', 'Clean the bathroom', 'Replace towels and toiletries', 'Empty dustbins', 'Clean windows and mirrors', 'Clean AC vents and filters', 'Check kettle, glasses and amenities'],
});
const pantry = checklist({
  id: 'pantry-kitchen-cleaning-checklist-printable', label: 'Pantry and kitchen cleaning', hint: 'Counters, sink, fridge, floor', title: 'Pantry and kitchen cleaning checklist', areaLabel: 'Pantry or kitchen (optional)',
  tasks: ['Wipe counters and tables', 'Clean sink and taps', 'Clean microwave and stove top', 'Wipe the fridge outside and inside', 'Clean tea or coffee machine', 'Wash and put away utensils', 'Remove old food from the fridge', 'Empty bins and replace liners', 'Sweep and mop the floor', 'Wipe shelves and cupboard doors'],
});
const society = checklist({
  id: 'society-common-area-cleaning-checklist-printable', label: 'Society common areas', hint: 'Stairs, lobby, parking, garbage', title: 'Common area cleaning checklist', areaLabel: 'Tower or block (optional)',
  tasks: ['Sweep and mop staircases', 'Clean lobby and entrance', 'Clean the lifts', 'Collect and clear garbage room', 'Clean parking area', 'Clean garden paths', 'Clean drains and gutters', 'Clean the security cabin', 'Clean clubhouse and gym', 'Wipe handrails and gates', 'Clean terrace and landings'],
});

const weekly: SheetDef = {
  id: 'weekly-cleaning-schedule-printable',
  label: 'Weekly cleaning schedule',
  hint: 'Which area, which day, who',
  path: '/weekly-cleaning-schedule-printable',
  landscape: true,
  fields: [
    { type: 'list', key: 'tasks', label: 'Areas or tasks', hint: 'One per line, up to 24.', max: 24 },
    { type: 'number', key: 'rows', label: 'Rows', min: 8, max: 24, step: 1, unit: 'rows' },
    { type: 'toggle', key: 'sunday', label: 'Include Sunday' },
    { type: 'toggle', key: 'assigned', label: 'Frequency, assigned to and supervisor columns' },
  ],
  defaults: {
    tasks: 'Main gate and security cabin\nLobby and reception\nStaircases (all floors)\nLifts\nCorridors\nParking area\nGarbage collection point\nTerrace\nGarden and pathways\nClubhouse and gym\nDrains and gutters\nCommon washrooms',
    rows: 14, sunday: true, assigned: true,
  },
  build: (v, common) => {
    const tasks = lines(v, 'tasks', 24);
    const rows = Math.max(clamp(num(v, 'rows', 14), 8, 24), tasks.length);
    return makePages(common, 1, (c) => {
      const top = c.y + titleBar(c, 'Weekly cleaning schedule', 'Mark the days each area is cleaned. Write who is responsible, and have the supervisor sign the week.');
      const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].slice(0, flag(v, 'sunday') ? 7 : 6);
      const columns = [{ label: 'No.', w: 0.5 }, { label: 'Area or task', w: 3.6 }, ...names.map((label) => ({ label, w: 0.75 }))];
      if (flag(v, 'assigned')) columns.push({ label: 'Frequency', w: 1.1 }, { label: 'Assigned to', w: 1.6 }, { label: 'Supervisor sign', w: 1.4 });
      table(c, top + 1, c.y + c.h - 9, columns, rows, tasks, { numbered: true, headH: 9, headSize: 8 });
      text(c, c.x, c.y + c.h - 2, 8, 'Week of: ______________________     Checked by: ______________________     Date: ______________', false, 'start', INK);
    });
  },
};

const round: SheetDef = {
  id: 'washroom-hourly-cleaning-log-printable',
  label: 'Hourly cleaning round sheet',
  hint: 'Time slots, initials, a page a day',
  path: '/washroom-hourly-cleaning-log-printable',
  landscape: false,
  fields: [
    { type: 'list', key: 'areas', label: 'Areas', hint: 'One per line, up to 14.', max: 14 },
    { type: 'date', key: 'start', label: 'First day' },
    { type: 'number', key: 'days', label: 'How many days (one page each)', min: 1, max: 31, step: 1, unit: 'days' },
    { type: 'text', key: 'first', label: 'First round at (24-hour, like 08:00)', placeholder: '08:00', max: 5 },
    { type: 'select', key: 'gap', label: 'Time between rounds', options: [{ value: '1', label: 'Every hour' }, { value: '2', label: 'Every 2 hours' }, { value: '3', label: 'Every 3 hours' }, { value: '4', label: 'Every 4 hours' }] },
    { type: 'number', key: 'rounds', label: 'Rounds a day', min: 3, max: 10, step: 1, unit: 'rounds' },
    { type: 'toggle', key: 'remarks', label: 'Remarks lines and supervisor sign' },
  ],
  defaults: { areas: "Gents washroom\nLadies washroom\nDisabled-access washroom\nPantry\nLift lobby\nReception", start: today, days: 1, first: '08:00', gap: '2', rounds: 6, remarks: true },
  build: (v, common) => {
    const areas = lines(v, 'areas', 14);
    const rows = Math.max(8, areas.length);
    const date = parseIso(str(v, 'start')) ?? now;
    const rounds = clamp(num(v, 'rounds', 6), 3, 10);
    const gap = clamp(num(v, 'gap', 2), 1, 4) * 60;
    const match = /^(\d{1,2})[:.](\d{2})$/.exec(str(v, 'first'));
    const first = match && Number(match[1]) < 24 && Number(match[2]) < 60 ? Number(match[1]) * 60 + Number(match[2]) : 8 * 60;
    const label = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    return makePages(common, clamp(num(v, 'days', 1), 1, 31), (c, i) => {
      const top = c.y + titleBar(c, 'Cleaning round sheet', longDate(addDays(date, i), LOCALE));
      const remarksH = flag(v, 'remarks') ? 58 : 14;
      const columns = [{ label: 'Area', w: 3 }, ...Array.from({ length: rounds }, (_, r) => ({ label: label(first + r * gap), w: 1 }))];
      table(c, top, c.y + c.h - remarksH, columns, rows, areas, { headH: 9, headSize: 8 });
      const y = c.y + c.h - remarksH + 6;
      text(c, c.x, y + 1, 7.5, 'Write your initials in the box at each round. Write X if the area was locked or closed.');
      if (flag(v, 'remarks')) {
        text(c, c.x, y + 9, 9.5, 'Remarks', true, 'start', INK);
        ruled(c, c.x, c.x + c.w, y + 9, y + 38, 7.5);
        text(c, c.x, y + 48, 8.5, 'Supervisor sign: ______________________', false, 'start', INK);
        text(c, c.x + c.w, y + 48, 8.5, 'Time: ____________', false, 'end', INK);
      }
    });
  },
};

const service: SheetDef = {
  id: 'water-tank-cleaning-record-printable',
  label: 'Tank, pest control and service record',
  hint: 'Date, work done, next due',
  path: '/water-tank-cleaning-record-printable',
  landscape: true,
  fields: [
    { type: 'text', key: 'title', label: 'Title', placeholder: 'Water tank cleaning record', max: 40 },
    { type: 'number', key: 'rows', label: 'Rows on a page', min: 8, max: 24, step: 1, unit: 'rows' },
    { type: 'number', key: 'pages', label: 'Pages', min: 1, max: 5, step: 1, unit: 'pages' },
    { type: 'toggle', key: 'nextDue', label: 'Next due column' },
  ],
  defaults: { title: 'Water tank cleaning record', rows: 14, pages: 1, nextDue: true },
  build: (v, common) => makePages(common, clamp(num(v, 'pages', 1), 1, 5), (c) => {
    const top = c.y + titleBar(c, str(v, 'title') || 'Cleaning and service record', 'Write the date, the area or item, what was done, who did it and when it is next due.');
    const columns = [{ label: 'Date', w: 1 }, { label: 'Area or item', w: 2 }, { label: 'Work done', w: 3 }, { label: 'Done by', w: 1.6 }];
    if (flag(v, 'nextDue')) columns.push({ label: 'Next due', w: 1 });
    columns.push({ label: 'Checked by', w: 1.4 });
    table(c, top, c.y + c.h - 9, columns, clamp(num(v, 'rows', 14), 8, 24), [], { headH: 9, headSize: 8.5 });
    text(c, c.x, c.y + c.h - 2, 7.5, 'Keep the receipts and certificates from the contractor with this record.');
  }),
};

const planner: SheetDef = {
  id: 'deep-cleaning-planner-printable',
  label: 'Deep cleaning planner',
  hint: 'Twelve months, big jobs',
  path: '/deep-cleaning-planner-printable',
  landscape: true,
  fields: [
    { type: 'list', key: 'tasks', label: 'Deep cleaning jobs', hint: 'One per line, up to 20.', max: 20 },
    { type: 'number', key: 'rows', label: 'Rows', min: 8, max: 20, step: 1, unit: 'rows' },
    { type: 'select', key: 'start', label: 'First month', options: MONTHS },
    { type: 'number', key: 'year', label: 'Year', min: 2020, max: 2100, step: 1, unit: '' },
    { type: 'toggle', key: 'doneBy', label: 'Contractor or done by column' },
  ],
  defaults: {
    tasks: 'Water tanks\nWindows and glass (outside)\nCeiling fans and light fittings\nAC filters and vents\nCarpets and upholstery\nFloor scrubbing and polishing\nPest control\nKitchen chimney and exhaust\nDrains and gutters\nTerrace and tank area\nStores and cupboards',
    rows: 12, start: String(now.getMonth() + 1), year: now.getFullYear(), doneBy: true,
  },
  build: (v, common) => {
    const tasks = lines(v, 'tasks', 20);
    const rows = Math.max(clamp(num(v, 'rows', 12), 8, 20), tasks.length);
    const first = clamp(num(v, 'start', 1), 1, 12) - 1;
    return makePages(common, 1, (c) => {
      const top = c.y + titleBar(c, `Deep cleaning planner ${clamp(num(v, 'year', now.getFullYear()), 2020, 2100)}`, 'Write the date or a tick in the month each job is done.');
      const columns = [{ label: 'No.', w: 0.5 }, { label: 'Job', w: 3.2 }];
      for (let m = 0; m < 12; m += 1) columns.push({ label: SHORT_MONTHS[(first + m) % 12]!, w: 1 });
      if (flag(v, 'doneBy')) columns.push({ label: 'Done by', w: 1.6 });
      table(c, top, c.y + c.h - 2, columns, rows, tasks, { numbered: true, headH: 9, headSize: 8 });
    });
  },
};

export const CLEAN_FAMILY: Family = {
  key: 'clean',
  headingLabel: 'Site or area name',
  headingPlaceholder: 'Sunrise Heights Society  or  Floor 3, Tower B',
  note: 'These sheets keep a cleaning record. Lift and tank repairs and safety checks, pest control chemicals and anything regulated are for the licensed contractor and your own rules.',
  sheets: [office, washroom, lift, room, pantry, society, weekly, round, service, planner],
};
