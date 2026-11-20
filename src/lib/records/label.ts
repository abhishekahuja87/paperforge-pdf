import { INK, clamp, fitText, flag, line, lines, makePages, num, str, text, titleBar, wrap, type Ctx } from './draw';
import type { Family, Field, SheetDef } from './types';

export interface LabelSpec {
  id: string;
  label: string;
  hint: string;
  cols: number;
  rows: number;
  /** Text labels use one typed line per label; form labels have fixed lines to fill. */
  kind: 'text' | 'form';
  /** Small words above each label, such as "To:". */
  header?: string;
  /** A second small line under the typed text, such as "Class". */
  subLabel?: string;
  /** The fixed lines of a form label. */
  formLines?: string[];
  items?: { label: string; hint: string; defaults: string };
  size: 'small' | 'medium' | 'large';
  border: 'none' | 'plain' | 'double' | 'dashed';
}

const SIZES = { small: 11, medium: 15, large: 22 };

function frameLabel(c: Ctx, x: number, y: number, w: number, h: number, border: string): void {
  if (border === 'none') return;
  const dash: [number, number] | undefined = border === 'dashed' ? [1.5, 1] : undefined;
  const edge = (x1: number, y1: number, x2: number, y2: number, weight = c.weight) => c.items.push({ t: 'line', x1, y1, x2, y2, w: weight, c: c.color, ...(dash ? { dash } : {}) });
  edge(x, y, x + w, y); edge(x + w, y, x + w, y + h); edge(x + w, y + h, x, y + h); edge(x, y + h, x, y);
  if (border === 'double') { const i = 1.6; edge(x + i, y + i, x + w - i, y + i, c.weight * 0.7); edge(x + w - i, y + i, x + w - i, y + h - i, c.weight * 0.7); edge(x + w - i, y + h - i, x + i, y + h - i, c.weight * 0.7); edge(x + i, y + h - i, x + i, y + i, c.weight * 0.7); }
}

/** A sheet of stickers or tags in a grid: typed text for each label, or lines to fill in by hand. */
export function labelSheet(s: LabelSpec): SheetDef {
  const per = s.cols * s.rows;
  const fields: Field[] = [];
  if (s.kind === 'text') {
    fields.push({ type: 'list', key: 'items', label: s.items?.label ?? 'Text for each label', hint: s.items?.hint ?? 'One per line. Each line is one label.', max: per * 4 });
    if (s.subLabel) fields.push({ type: 'text', key: 'sub', label: `${s.subLabel} (printed on every label)`, placeholder: '', max: 30 });
    fields.push({ type: 'toggle', key: 'repeat', label: 'Repeat the first label to fill the sheet', hint: 'Useful when you need many of the same label.' });
  } else {
    (s.formLines ?? []).forEach((lab, i) => fields.push({ type: 'text', key: `f${i}`, label: `${lab} (optional)`, placeholder: '', max: 30 }));
    fields.push({ type: 'toggle', key: 'repeat', label: 'Fill in the typed details on every label', hint: 'Turn off to print blank labels.' });
  }
  fields.push({ type: 'select', key: 'size', label: 'Text size', options: [{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }] });
  fields.push({ type: 'select', key: 'border', label: 'Border', options: [{ value: 'plain', label: 'Plain line' }, { value: 'double', label: 'Double line' }, { value: 'dashed', label: 'Dashed cut line' }, { value: 'none', label: 'None' }] });
  fields.push({ type: 'number', key: 'pages', label: 'Pages (when repeating)', min: 1, max: 6, step: 1, unit: 'pages' });
  const defaults: Record<string, string | number | boolean> = { size: s.size, border: s.border, repeat: s.kind === 'form', pages: 1, items: s.items?.defaults ?? '', sub: '' };
  return {
    id: s.id, label: s.label, hint: s.hint, path: `/${s.id}`, landscape: false, fields, defaults,
    build: (v, common) => {
      const typed = s.kind === 'text' ? lines(v, 'items', per * 4) : [];
      const repeat = flag(v, 'repeat');
      const pages = repeat || typed.length === 0 ? clamp(num(v, 'pages', 1), 1, 6) : Math.max(1, Math.min(6, Math.ceil(typed.length / per)));
      const size = SIZES[(str(v, 'size') || s.size) as keyof typeof SIZES] ?? 15;
      return makePages(common, pages, (c, pi) => {
        const cw = c.w / s.cols; const ch = c.h / s.rows;
        for (let k = 0; k < per; k += 1) {
          const x = c.x + (k % s.cols) * cw + 1.2; const y = c.y + Math.floor(k / s.cols) * ch + 1.2; const w = cw - 2.4; const h = ch - 2.4;
          frameLabel(c, x, y, w, h, str(v, 'border') || s.border);
          if (s.kind === 'form') {
            const formLines = s.formLines ?? [];
            const step = h / (formLines.length + 1);
            formLines.forEach((lab, i) => {
              const ly = y + step * (i + 1);
              text(c, x + 3, ly, Math.min(9, step * 0.55), `${lab}:`, true, 'start', INK);
              const at = x + 4 + lab.length * Math.min(9, step * 0.55) * 0.22 + 2;
              line(c, at, ly + 0.8, x + w - 3, ly + 0.8, c.weight * 0.8);
              const value = repeat ? str(v, `f${i}`) : '';
              if (value) fitText(c, at + 1, ly - 0.6, x + w - at - 4, Math.min(9, step * 0.7), value, Math.min(11, step * 0.7));
            });
          } else {
            const entry = repeat ? (typed[0] ?? '') : (typed[pi * per + k] ?? '');
            if (s.header) text(c, x + 3, y + 5, 7.5, s.header, true, 'start', '#666666');
            if (entry) {
              const parts = entry.split('/').map((p) => p.trim()).filter(Boolean);
              if (parts.length > 1) {
                const top = y + (s.header ? 9 : 4);
                const stepY = Math.min(size * 0.45, (h - (top - y) - 3) / parts.length);
                parts.slice(0, 6).forEach((part, i) => fitText(c, x + 3, top + stepY * (i + 0.8), w - 6, stepY, part, Math.min(size, stepY * 2.2), i === 0));
              } else {
                const box = h - (s.header ? 10 : 4) - (str(v, 'sub') ? 7 : 0);
                fitText(c, x + 2, y + (s.header ? 9 : 3) + box / 2 + Math.min(size, box * 1.6) * 0.15, w - 4, box, entry, size, true, 'middle');
              }
            }
            if (str(v, 'sub')) text(c, x + w / 2, y + h - 3, 8, str(v, 'sub'), false, 'middle', '#555555');
          }
        }
      });
    },
  };
}

const SPECS: LabelSpec[] = [
  { id: 'name-tag-sticker-sheet-printable', label: 'Name tags', hint: 'Hello my name is', cols: 2, rows: 5, kind: 'text', header: 'HELLO, my name is', items: { label: 'Names', hint: 'One name per line. Each is one tag.', defaults: '' }, size: 'large', border: 'double' },
  { id: 'school-book-label-printable', label: 'School book labels', hint: 'Name, class, subject, school', cols: 2, rows: 5, kind: 'form', formLines: ['Name', 'Class', 'Subject', 'School'], size: 'medium', border: 'plain' },
  { id: 'kids-name-labels-printable', label: 'Kids name labels', hint: 'Small labels for bottles and things', cols: 4, rows: 12, kind: 'text', items: { label: 'Names', hint: 'One name per line, or tick repeat to fill the sheet with one name.', defaults: '' }, size: 'small', border: 'dashed' },
  { id: 'spice-jar-label-printable', label: 'Spice jar labels', hint: 'Kitchen and pantry', cols: 3, rows: 8, kind: 'text', items: { label: 'Names of the jars', hint: 'One per line, such as Jeera, Haldi, Rice.', defaults: 'Jeera\nHaldi\nDhania powder\nRed chilli\nGaram masala\nMustard seeds\nSalt\nSugar\nTea\nRice\nAtta\nToor dal' }, subLabel: 'Small line', size: 'medium', border: 'plain' },
  { id: 'address-label-printable', label: 'Address labels', hint: 'Parcels and envelopes', cols: 2, rows: 7, kind: 'text', header: 'To:', items: { label: 'Addresses', hint: 'One label for each line. Separate the lines of an address with a slash, for example Mr Sharma / 12 Park Road / Pune 411001.', defaults: '' }, size: 'medium', border: 'plain' },
  { id: 'storage-box-and-file-label-printable', label: 'Storage and file labels', hint: 'Boxes, folders and shelves', cols: 2, rows: 8, kind: 'text', items: { label: 'Labels', hint: 'One per line, such as Tax papers, Winter clothes, Toys.', defaults: 'Bills\nWarranty cards\nWinter clothes\nToys\nBooks\nTools\nPhotos\nDocuments' }, size: 'large', border: 'double' },
  { id: 'freezer-food-date-label-printable', label: 'Food date labels', hint: 'Item, made on, use by', cols: 3, rows: 8, kind: 'form', formLines: ['Item', 'Made on', 'Use by'], size: 'small', border: 'dashed' },
  { id: 'gift-tag-printable', label: 'Gift tags', hint: 'To, from and a message', cols: 2, rows: 4, kind: 'form', formLines: ['To', 'From', 'Message'], size: 'medium', border: 'double' },
  { id: 'table-place-card-printable', label: 'Place cards', hint: 'Names for a party table', cols: 2, rows: 4, kind: 'text', items: { label: 'Guest names', hint: 'One per line. Each is one card. Fold or cut as you like.', defaults: '' }, subLabel: 'Table', size: 'large', border: 'dashed' },
];

/* ---------- Door signs ---------- */

const MESSAGES = ['OPEN', 'CLOSED', 'WELCOME', 'BACK IN 10 MINUTES', 'PLEASE KNOCK', 'RESERVED', 'SILENCE PLEASE', 'STAFF ONLY', 'PUSH', 'PULL', 'PLEASE WAIT HERE', 'THANK YOU, VISIT AGAIN', 'MEETING IN PROGRESS', 'PLEASE TAKE OFF YOUR SHOES'];

const doorSign: SheetDef = {
  id: 'door-sign-printable', label: 'Door signs', hint: 'Open, closed, welcome and more', path: '/door-sign-printable', landscape: true,
  fields: [
    { type: 'select', key: 'message', label: 'Message', options: [...MESSAGES.map((m) => ({ value: m, label: m })), { value: 'custom', label: 'My own words' }] },
    { type: 'text', key: 'custom', label: 'Your own words', placeholder: 'Closed for Diwali', max: 40 },
    { type: 'text', key: 'small', label: 'Small line below (optional)', placeholder: 'Please call 98xxxxxx for help', max: 60 },
    { type: 'select', key: 'border', label: 'Border', options: [{ value: 'double', label: 'Double line' }, { value: 'plain', label: 'Bold line' }, { value: 'dashed', label: 'Dashed' }, { value: 'none', label: 'None' }] },
    { type: 'number', key: 'pages', label: 'Copies', min: 1, max: 6, step: 1, unit: 'copies' },
  ],
  defaults: { message: 'OPEN', custom: '', small: '', border: 'double', pages: 1 },
  build: (v, common) => makePages(common, clamp(num(v, 'pages', 1), 1, 6), (c) => {
    frameLabel(c, c.x + 2, c.y + 2, c.w - 4, c.h - 4, str(v, 'border') || 'double');
    const msg = str(v, 'message') === 'custom' ? str(v, 'custom') || ' ' : str(v, 'message') || 'OPEN';
    const lines2 = wrap(msg, 16);
    const size = lines2.length > 1 ? 70 : 110;
    lines2.slice(0, 3).forEach((part, i) => fitText(c, c.x + 10, c.y + c.h / 2 - (lines2.length - 1) * 18 + i * 36 + (lines2.length === 1 ? 14 : 4), c.w - 20, 40, part, size, true, 'middle'));
    if (str(v, 'small')) fitText(c, c.x + 10, c.y + c.h - 24, c.w - 20, 12, str(v, 'small'), 20, false, 'middle');
    if (c.heading.trim()) fitText(c, c.x + 10, c.y + 18, c.w - 20, 10, c.heading.trim(), 18, true, 'middle');
  }),
};

/* ---------- Seating chart ---------- */

const seatingChart: SheetDef = {
  id: 'wedding-seating-chart-printable', label: 'Seating chart', hint: 'Tables with a line for each guest', path: '/wedding-seating-chart-printable', landscape: false,
  fields: [
    { type: 'list', key: 'tables', label: 'Table names (optional)', hint: 'One per line, up to 24, such as Family, Friends, Table 1. Empty gives numbered tables.', max: 24 },
    { type: 'number', key: 'count', label: 'Tables', min: 2, max: 24, step: 1, unit: 'tables' },
    { type: 'number', key: 'seats', label: 'Seats at each table', min: 2, max: 12, step: 1, unit: 'seats' },
  ],
  defaults: { tables: '', count: 8, seats: 8 },
  build: (v, common) => {
    const names = lines(v, 'tables', 24);
    const count = names.length > 0 ? names.length : clamp(num(v, 'count', 8), 2, 24);
    const seats = clamp(num(v, 'seats', 8), 2, 12);
    const perPage = 6;
    return makePages(common, Math.ceil(count / perPage), (c, pi) => {
      const top = c.y + titleBar(c, 'Seating chart');
      const cw = c.w / 2; const ch = (c.y + c.h - top) / 3;
      for (let k = 0; k < perPage; k += 1) {
        const idx = pi * perPage + k;
        if (idx >= count) break;
        const x = c.x + (k % 2) * cw + 2; const y = top + Math.floor(k / 2) * ch + 2; const w = cw - 4; const h = ch - 4;
        line(c, x, y, x + w, y, c.weight * 1.6); line(c, x, y + h, x + w, y + h, c.weight * 1.6); line(c, x, y, x, y + h, c.weight * 1.6); line(c, x + w, y, x + w, y + h, c.weight * 1.6);
        fitText(c, x + 3, y + 7, w - 6, 9, names[idx] ?? `Table ${idx + 1}`, 12, true);
        const step = Math.min(8, (h - 12) / seats);
        for (let s2 = 0; s2 < seats; s2 += 1) { const ly = y + 12 + (s2 + 1) * step - 1; text(c, x + 3, ly - 0.8, 6.5, `${s2 + 1}.`, false, 'start', '#777777'); line(c, x + 9, ly, x + w - 3, ly, c.weight * 0.7, '#999999'); }
      }
    });
  },
};

export const LABEL_FAMILY: Family = {
  key: 'label',
  headingLabel: 'Business or home name (printed on door signs)',
  headingPlaceholder: 'Sharma Stores',
  note: 'Print on plain paper and cut, or on sticker sheets. Check one sheet before printing many, since printers differ.',
  sheets: [...SPECS.map(labelSheet), doorSign, seatingChart],
};
