import type { Item, Sheet } from '../paper/geometry';
import { PAGE_SIZES, TONES, WEIGHTS } from '../paper/types';
import { addDays, parseIso, shortDate, weekdayName } from '../planner/dates';
import { LOG_COLUMNS, MAX_DAYS, MAX_LOG_PAGES, MAX_WEEKS, SLOTS, type CareSettings, type MedicineRow } from './types';

const TEXT = '#444444';
const INK = '#111111';
const r3 = (value: number) => Math.round(value * 1000) / 1000;
const LOCALE = 'en';

/** Printed on the medicine pages so nobody mistakes the chart for a prescription. */
export const MEDICINE_NOTE = 'This chart only organises the schedule. Take medicines exactly as the doctor or pharmacist told you.';

interface Ctx { s: CareSettings; x: number; y: number; w: number; h: number; color: string; weight: number; items: Item[] }

const line = (c: Ctx, x1: number, y1: number, x2: number, y2: number, w = c.weight, color = c.color) =>
  c.items.push({ t: 'line', x1: r3(x1), y1: r3(y1), x2: r3(x2), y2: r3(y2), w, c: color });
const text = (c: Ctx, x: number, y: number, size: number, value: string, bold = false, anchor: 'start' | 'middle' | 'end' = 'start', color = TEXT) =>
  c.items.push({ t: 'text', x: r3(x), y: r3(y), size, text: value, c: color, bold, anchor });
const box = (c: Ctx, x: number, y: number, size: number) => {
  line(c, x, y, x + size, y); line(c, x + size, y, x + size, y + size); line(c, x + size, y + size, x, y + size); line(c, x, y + size, x, y);
};
const ruled = (c: Ctx, x1: number, x2: number, y1: number, y2: number, step: number) => {
  for (let y = y1 + step; y <= y2 + 1e-6; y += step) line(c, x1, y, x2, y, c.weight * 0.8);
};

/** Splits text into lines of at most `max` characters, at spaces where it can. */
function wrap(value: string, max: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of value.split(/\s+/).filter(Boolean)) {
    const piece = word.length > max ? `${word.slice(0, max - 1)}…` : word;
    if (current && current.length + 1 + piece.length > max) { lines.push(current); current = piece; } else current = current ? `${current} ${piece}` : piece;
  }
  if (current) lines.push(current);
  return lines;
}

/** Typed text wrapped to a box and made smaller if needed, then cut with a dot dot dot. A character is about 0.19 mm wide per point of size. */
function fitText(c: Ctx, x: number, y: number, width: number, height: number, value: string, size: number, bold = false, anchor: 'start' | 'middle' = 'start'): void {
  const clean = value.trim();
  if (!clean) return;
  let pt = size;
  let lines = wrap(clean, Math.max(3, Math.floor(width / (pt * 0.19))));
  const room = (p: number) => Math.max(1, Math.floor(height / (p * 0.42)));
  while (pt > 6 && lines.length > room(pt)) { pt -= 0.5; lines = wrap(clean, Math.max(3, Math.floor(width / (pt * 0.19)))); }
  const limit = room(pt);
  if (lines.length > limit) {
    lines = lines.slice(0, limit);
    const last = lines[limit - 1]!;
    lines[limit - 1] = `${last.slice(0, Math.max(1, last.length - 1))}…`;
  }
  const ox = anchor === 'middle' ? width / 2 : 0;
  lines.forEach((value, i) => text(c, x + ox, y + i * pt * 0.42, pt, value, bold, anchor, INK));
}

function title(c: Ctx, value: string, sub = ''): number {
  text(c, c.x, c.y + 8, 20, value, true, 'start', INK);
  if (c.s.person.trim()) text(c, c.x + c.w, c.y + 8, c.s.large ? 13 : 11, `For: ${c.s.person.trim()}`, true, 'end', INK);
  if (sub) text(c, c.x, c.y + 14, 9, sub);
  return sub ? 18 : 13;
}

const medicineLabel = (m: MedicineRow) => [m.name.trim(), m.strength.trim()].filter(Boolean).join(' ');
const filledMedicines = (s: CareSettings) => s.medicines.filter((m) => m.name.trim());

/** The plan: medicines down the side, parts of the day across, the amount to take in each. */
function medicinePlan(c: Ctx): void {
  const { s } = c;
  const k = s.large ? 1.25 : 1;
  const top = c.y + title(c, 'Medicine plan', s.doctor.trim() ? `Doctor: ${s.doctor.trim()}` : '');
  const rows = s.medicines.length;
  const noteH = 12;
  const headH = 11;
  const foodW = Math.min(34, c.w * 0.18);
  const nameW = Math.min(70, c.w * 0.34);
  const slotW = (c.w - nameW - foodW) / SLOTS.length;
  const rowH = Math.min(26, (c.h - (top - c.y) - headH - noteH) / Math.max(rows, 1));
  const gridTop = top + headH;
  line(c, c.x, top, c.x + c.w, top, c.weight * 1.6);
  text(c, c.x + 1.5, top + 7, 10 * k, 'Medicine', true, 'start', INK);
  SLOTS.forEach((slot, i) => text(c, c.x + nameW + i * slotW + slotW / 2, top + 7, 9.5 * k, slot, true, 'middle', INK));
  text(c, c.x + nameW + SLOTS.length * slotW + 1.5, top + 7, 9.5 * k, 'Note', true, 'start', INK);
  for (let r = 0; r <= rows; r += 1) line(c, c.x, gridTop + r * rowH, c.x + c.w, gridTop + r * rowH, r === 0 || r === rows ? c.weight * 1.6 : c.weight);
  const bottom = gridTop + rows * rowH;
  for (let i = 0; i <= 1 + SLOTS.length + 1; i += 1) {
    const x = i === 0 ? c.x : i === 1 ? c.x + nameW : i <= SLOTS.length + 1 ? c.x + nameW + (i - 1) * slotW : c.x + c.w;
    line(c, x, top, x, bottom, i === 0 || i === SLOTS.length + 2 ? c.weight * 1.6 : c.weight);
  }
  s.medicines.forEach((m, r) => {
    const y = gridTop + r * rowH;
    fitText(c, c.x + 1.8, y + 6.5 * k, nameW - 3.5, rowH - 3, medicineLabel(m), 12 * k, true);
    SLOTS.forEach((slot, i) => fitText(c, c.x + nameW + i * slotW, y + rowH / 2 + 3, slotW, rowH - 2, m.amounts[slot], 15 * k, true, 'middle'));
    fitText(c, c.x + nameW + SLOTS.length * slotW + 1.8, y + 6, foodW - 3, rowH - 3, m.food, 9.5 * k);
  });
  fitText(c, c.x, bottom + 6, c.w, noteH - 2, MEDICINE_NOTE, 8.5);
}

/** One week of tick boxes: a row for every medicine and part of the day where something is taken. */
function medicineWeek(c: Ctx, first: Date): void {
  const { s } = c;
  const last = addDays(first, 6);
  const top = c.y + title(c, 'Weekly tick chart', `${shortDate(first, LOCALE)} to ${shortDate(last, LOCALE)} ${last.getUTCFullYear()}`);
  const entries: { label: string; slot: string; amount: string }[] = [];
  for (const m of filledMedicines(s)) for (const slot of SLOTS) if (m.amounts[slot].trim()) entries.push({ label: `${medicineLabel(m)}${m.food ? ` (${m.food})` : ''}`, slot, amount: m.amounts[slot].trim() });
  const headH = 12;
  const noteH = 10;
  const dayW = Math.min(22, (c.w * 0.5) / 7);
  const labelW = c.w - 7 * dayW;
  const rows = Math.max(entries.length, 1);
  const rowH = Math.min(14, (c.h - (top - c.y) - headH - noteH) / rows);
  const gridTop = top + headH;
  line(c, c.x, top, c.x + c.w, top, c.weight * 1.6);
  text(c, c.x + 1.5, top + 8, 10, 'Medicine and time', true, 'start', INK);
  for (let d = 0; d < 7; d += 1) {
    const date = addDays(first, d);
    const x = c.x + labelW + d * dayW + dayW / 2;
    text(c, x, top + 5, 8.5, weekdayName(date.getUTCDay(), LOCALE, 'short'), true, 'middle', INK);
    text(c, x, top + 10, 7.5, shortDate(date, LOCALE), false, 'middle');
  }
  for (let r = 0; r <= rows; r += 1) line(c, c.x, gridTop + r * rowH, c.x + c.w, gridTop + r * rowH, r === 0 || r === rows ? c.weight * 1.6 : c.weight);
  for (let d = 0; d <= 7; d += 1) line(c, c.x + labelW + d * dayW, top, c.x + labelW + d * dayW, gridTop + rows * rowH, c.weight);
  line(c, c.x, top, c.x, gridTop + rows * rowH, c.weight * 1.6);
  line(c, c.x + c.w, top, c.x + c.w, gridTop + rows * rowH, c.weight * 1.6);
  entries.forEach((e, r) => {
    const y = gridTop + r * rowH;
    fitText(c, c.x + 1.5, y + Math.min(5.5, rowH * 0.45), labelW - 3, rowH - 1, `${e.label}`, 9.5, true);
    text(c, c.x + 1.5, y + rowH - 1.6, 7.5, `${e.slot}, take ${e.amount}`);
    const size = Math.min(8, rowH - 4, dayW - 6);
    for (let d = 0; d < 7; d += 1) box(c, c.x + labelW + d * dayW + (dayW - size) / 2, y + (rowH - size) / 2, size);
  });
  if (entries.length === 0) text(c, c.x + 2, gridTop + rowH / 2, 10, 'Add medicines and amounts to see rows here.', false, 'start', '#888888');
  fitText(c, c.x, gridTop + rows * rowH + 5, c.w, noteH - 2, MEDICINE_NOTE, 8.5);
}

function logPage(c: Ctx, pageNo: number, pages: number): void {
  const { s } = c;
  const columns = LOG_COLUMNS.filter((col) => s.logColumns.includes(col.id));
  const use = columns.length > 0 ? columns : LOG_COLUMNS.filter((col) => col.id === 'date' || col.id === 'notes');
  const top = c.y + title(c, 'Health log', pages > 1 ? `Page ${pageNo} of ${pages}` : '');
  const total = use.reduce((sum, col) => sum + col.width, 0);
  const headH = 12;
  const rows = Math.min(40, Math.max(6, s.logRows));
  const rowH = (c.h - (top - c.y) - headH) / rows;
  const gridTop = top + headH;
  let x = c.x;
  const edges = [x];
  for (const col of use) {
    const w = (col.width / total) * c.w;
    fitText(c, x + 1, top + 4.5, w - 2, headH - 2, col.label, 8.5, true, 'middle');
    x += w;
    edges.push(x);
  }
  line(c, c.x, top, c.x + c.w, top, c.weight * 1.6);
  for (let r = 0; r <= rows; r += 1) line(c, c.x, gridTop + r * rowH, c.x + c.w, gridTop + r * rowH, r === 0 || r === rows ? c.weight * 1.6 : c.weight);
  edges.forEach((ex, i) => line(c, ex, top, ex, gridTop + rows * rowH, i === 0 || i === edges.length - 1 ? c.weight * 1.6 : c.weight));
}

/** One card, drawn inside (x, y, w, h). All sizes scale from a 90 mm wide card. */
function card(c: Ctx, x: number, y: number, w: number, h: number): void {
  const { s } = c;
  const k = w / 90;
  const pad = 3 * k;
  line(c, x, y, x + w, y, c.weight * 1.6); line(c, x + w, y, x + w, y + h, c.weight * 1.6); line(c, x + w, y + h, x, y + h, c.weight * 1.6); line(c, x, y + h, x, y, c.weight * 1.6);
  text(c, x + pad, y + 6.2 * k, 10.5 * k, 'EMERGENCY INFORMATION', true, 'start', INK);
  line(c, x + pad, y + 8.2 * k, x + w - pad, y + 8.2 * k);
  const fields: { label: string; value: string; lines: number }[] = [
    { label: 'Name', value: s.person, lines: 1 },
    { label: 'Blood group', value: s.blood, lines: 1 },
    { label: 'Allergies', value: s.allergies, lines: 2 },
    { label: 'Conditions', value: s.conditions, lines: 2 },
    { label: 'Takes', value: s.takes, lines: 2 },
    { label: 'Doctor', value: s.doctor, lines: 1 },
    { label: 'Call 1', value: s.contact1, lines: 1 },
    { label: 'Call 2', value: s.contact2, lines: 1 },
  ];
  const total = fields.reduce((sum, f) => sum + f.lines, 0);
  const avail = h - 10 * k - pad;
  const unit = avail / total;
  let cy = y + 10 * k;
  const labelW = 21 * k;
  for (const f of fields) {
    const fh = f.lines * unit;
    text(c, x + pad, cy + Math.min(unit * 0.8, 4.4 * k), 6.8 * k, f.label, true);
    fitText(c, x + pad + labelW, cy + Math.min(unit * 0.8, 4.4 * k), w - 2 * pad - labelW, fh, f.value, 8.6 * k);
    line(c, x + pad, cy + fh, x + w - pad, cy + fh, c.weight * 0.6, '#bbbbbb');
    cy += fh;
  }
}

function emergencyPage(c: Ctx): void {
  const { s } = c;
  if (s.format === 'sheet') { card(c, c.x, c.y, c.w, Math.min(c.h, c.w * 1.25)); return; }
  const cw = 90;
  const ch = 58;
  const gap = 6;
  const cols = Math.max(1, Math.floor((c.w + gap) / (cw + gap)));
  const rows = Math.max(1, Math.floor((c.h + gap) / (ch + gap)));
  const ox = c.x + (c.w - (cols * cw + (cols - 1) * gap)) / 2;
  for (let r = 0; r < rows; r += 1) for (let i = 0; i < cols; i += 1) card(c, ox + i * (cw + gap), c.y + r * (ch + gap), cw, ch);
}

function visitPage(c: Ctx): void {
  const { s } = c;
  const v = s.visitSections;
  const top = c.y + title(c, 'Doctor visit sheet', [s.doctor.trim() ? `Doctor or clinic: ${s.doctor.trim()}` : '', s.visitDate.trim() ? `Date: ${s.visitDate.trim()}` : ''].filter(Boolean).join('     '));
  const sections: { label: string; weight: number; numbered?: number }[] = [];
  if (v.problem) sections.push({ label: 'Why I am going: the main problem and since when', weight: 2 });
  if (v.medicines) sections.push({ label: 'Medicines I take now (name, dose, how often)', weight: 2 });
  if (v.allergies) sections.push({ label: 'Allergies or reactions to medicines', weight: 1 });
  if (v.questions) sections.push({ label: 'Questions to ask the doctor', weight: Math.max(2, s.questions / 2), numbered: Math.min(14, Math.max(2, s.questions)) });
  if (v.notes) sections.push({ label: 'What the doctor said', weight: 2.5 });
  if (v.next) sections.push({ label: 'Tests, medicines and next visit date', weight: 1.5 });
  const totalW = sections.reduce((sum, sec) => sum + sec.weight, 0) || 1;
  const avail = c.y + c.h - top;
  let y = top;
  for (const sec of sections) {
    const h = (sec.weight / totalW) * avail;
    line(c, c.x, y, c.x + c.w, y, c.weight * 1.6);
    text(c, c.x + 1, y + 5.5, 10, sec.label, true, 'start', INK);
    if (sec.numbered) {
      const step = (h - 9) / sec.numbered;
      for (let i = 1; i <= sec.numbered; i += 1) {
        text(c, c.x + 1, y + 7 + i * step - 1.4, 8.5, `${i}.`);
        line(c, c.x + 7, y + 7 + i * step, c.x + c.w, y + 7 + i * step, c.weight * 0.8);
      }
    } else ruled(c, c.x, c.x + c.w, y + 6, y + h - 0.5, 8);
    y += h;
  }
  line(c, c.x, y, c.x + c.w, y, c.weight * 1.6);
}

function caregiverPage(c: Ctx, date: Date): void {
  const { s } = c;
  const top = c.y + title(c, 'Caregiver day log', `Date: ${weekdayName(date.getUTCDay(), LOCALE, 'long')}, ${shortDate(date, LOCALE)} ${date.getUTCFullYear()}`);
  const labels = ['Morning', 'Afternoon', 'Evening', 'Night', 'Late night', 'Early morning'].slice(0, Math.min(6, Math.max(2, s.caregiverSlots)));
  const cols = [{ t: 'Food and drink', w: 1.5 }, { t: 'Medicines given', w: 1.4 }, { t: 'Toilet and bath', w: 1.1 }, { t: 'Mood and health', w: 1.8 }, { t: 'Initials', w: 0.6 }];
  const totalW = cols.reduce((sum, col) => sum + col.w, 0);
  const slotW = 24;
  const handoverH = 38;
  const headH = 10;
  const gridTop = top + headH;
  const rowH = (c.h - (top - c.y) - headH - handoverH - 5) / labels.length;
  const gridBottom = gridTop + labels.length * rowH;
  line(c, c.x, top, c.x + c.w, top, c.weight * 1.6);
  let x = c.x + slotW;
  const edges = [c.x, x];
  for (const col of cols) {
    const w = (col.w / totalW) * (c.w - slotW);
    fitText(c, x + 1, top + 6.5, w - 2, headH - 2, col.t, 8.5, true, 'middle');
    x += w;
    edges.push(x);
  }
  for (let r = 0; r <= labels.length; r += 1) line(c, c.x, gridTop + r * rowH, c.x + c.w, gridTop + r * rowH, r === 0 || r === labels.length ? c.weight * 1.6 : c.weight);
  edges.forEach((ex, i) => line(c, ex, top, ex, gridBottom, i === 0 || i === edges.length - 1 ? c.weight * 1.6 : c.weight));
  labels.forEach((label, r) => text(c, c.x + 1.5, gridTop + r * rowH + 6.5, 9.5, label, true, 'start', INK));
  const hy = gridBottom + 5;
  text(c, c.x, hy + 3, 10, 'Handover notes for the next person', true, 'start', INK);
  ruled(c, c.x, c.x + c.w, hy + 3, hy + handoverH - 3, 8);
}

/** Builds every page of the chosen sheet. */
export function buildCarePages(s: CareSettings): Sheet[] {
  const size = PAGE_SIZES[s.page];
  const width = s.landscape ? size.height : size.width;
  const height = s.landscape ? size.width : size.height;
  const margin = Math.min(30, Math.max(4, s.margin));
  const color = TONES[s.tone].color;
  const weight = WEIGHTS[s.weight].mm;
  const make = (draw: (ctx: Ctx) => void): Sheet => {
    const ctx: Ctx = { s, x: margin, y: margin, w: width - 2 * margin, h: height - 2 * margin, color, weight, items: [] };
    draw(ctx);
    return { width, height, area: { x: margin, y: margin, w: ctx.w, h: ctx.h }, fixed: ctx.items, pageNumber: null };
  };
  const start = parseIso(s.startDate) ?? new Date();
  const pages: Sheet[] = [];
  if (s.kind === 'medicine') {
    pages.push(make(medicinePlan));
    const weeks = Math.min(MAX_WEEKS, Math.max(0, Math.round(s.weeks)));
    for (let i = 0; i < weeks; i += 1) pages.push(make((ctx) => medicineWeek(ctx, addDays(start, i * 7))));
  } else if (s.kind === 'log') {
    const count = Math.min(MAX_LOG_PAGES, Math.max(1, Math.round(s.logPages)));
    for (let i = 0; i < count; i += 1) pages.push(make((ctx) => logPage(ctx, i + 1, count)));
  } else if (s.kind === 'emergency') pages.push(make(emergencyPage));
  else if (s.kind === 'visit') pages.push(make(visitPage));
  else {
    const days = Math.min(MAX_DAYS, Math.max(1, Math.round(s.days)));
    for (let i = 0; i < days; i += 1) pages.push(make((ctx) => caregiverPage(ctx, addDays(start, i))));
  }
  return pages;
}
