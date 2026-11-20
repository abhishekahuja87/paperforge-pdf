import { INK, clamp, fitText, line, lines, makePages, num, ruled, str, table, text, titleBar, type Ctx } from './draw';
import type { Family, SheetDef } from './types';

/** A label and a typed value on a line. */
function labelled(c: Ctx, x: number, y: number, w: number, label: string, value: string, size = 10): void {
  text(c, x, y + 3.2, 7, label, true, 'start', '#555555');
  line(c, x, y + 12, x + w, y + 12, c.weight * 0.9);
  fitText(c, x + 1, y + 9.8, w - 2, 6.5, value, size);
}

const record: SheetDef = {
  id: 'pet-health-record-card-printable',
  label: 'Pet health record',
  hint: 'Details, vaccines, deworming',
  path: '/pet-health-record-card-printable',
  landscape: false,
  fields: [
    { type: 'text', key: 'species', label: 'Species and breed', placeholder: 'Dog, Labrador', max: 40 },
    { type: 'text', key: 'born', label: 'Date of birth or age', max: 30 },
    { type: 'text', key: 'colour', label: 'Colour and marks', max: 40 },
    { type: 'text', key: 'chip', label: 'Microchip or licence number', max: 30 },
    { type: 'text', key: 'vet', label: 'Vet name and clinic', max: 50 },
    { type: 'text', key: 'vetPhone', label: 'Vet phone', max: 30 },
    { type: 'text', key: 'owner', label: 'Owner name', max: 40 },
    { type: 'text', key: 'ownerPhone', label: 'Owner phone', max: 30 },
    { type: 'text', key: 'allergies', label: 'Allergies or conditions', max: 60 },
  ],
  defaults: { species: '', born: '', colour: '', chip: '', vet: '', vetPhone: '', owner: '', ownerPhone: '', allergies: '' },
  build: (v, common) => makePages(common, 1, (c) => {
    const top = c.y + titleBar(c, 'Pet health record', 'Keep it with the vet papers. The vet decides what is given and when.');
    const col = (c.w - 8) / 2;
    const fields: [string, string, string, string][] = [
      ['Species and breed', str(v, 'species'), 'Date of birth or age', str(v, 'born')],
      ['Colour and marks', str(v, 'colour'), 'Microchip or licence number', str(v, 'chip')],
      ['Vet and clinic', str(v, 'vet'), 'Vet phone', str(v, 'vetPhone')],
      ['Owner', str(v, 'owner'), 'Owner phone', str(v, 'ownerPhone')],
    ];
    let y = top;
    for (const [l1, v1, l2, v2] of fields) { labelled(c, c.x, y, col, l1, v1); labelled(c, c.x + col + 8, y, col, l2, v2); y += 15; }
    labelled(c, c.x, y, c.w, 'Allergies or conditions', str(v, 'allergies')); y += 17;
    const bottom = c.y + c.h;
    const vaccH = (bottom - y) * 0.5;
    text(c, c.x, y + 4, 10.5, 'Vaccinations', true, 'start', INK);
    table(c, y + 6, y + vaccH, [{ label: 'Vaccine', w: 2.4 }, { label: 'Date given', w: 1.3 }, { label: 'Next due', w: 1.3 }, { label: 'Vet signature or stamp', w: 2 }], 8, [], { headH: 8 });
    y += vaccH + 4;
    text(c, c.x, y + 4, 10.5, 'Deworming, tick and flea treatment', true, 'start', INK);
    table(c, y + 6, bottom, [{ label: 'Treatment', w: 2.4 }, { label: 'Date given', w: 1.3 }, { label: 'Next due', w: 1.3 }, { label: 'Notes', w: 2 }], 5, [], { headH: 8 });
  }),
};

const tracker: SheetDef = {
  id: 'pet-vaccination-tracker-printable',
  label: 'Vaccination tracker',
  hint: 'Dates, batch and next due',
  path: '/pet-vaccination-tracker-printable',
  landscape: true,
  fields: [
    { type: 'list', key: 'entries', label: 'Vaccines or treatments to pre-fill (optional)', hint: 'One per line, as your vet names them. Leave empty to write them in by hand.', max: 30 },
    { type: 'number', key: 'rows', label: 'Rows on each page', min: 8, max: 25, step: 1, unit: 'rows' },
    { type: 'number', key: 'pages', label: 'Pages', min: 1, max: 6, step: 1, unit: 'pages' },
    { type: 'text', key: 'species', label: 'Species and breed (optional)', placeholder: 'Dog, Labrador', max: 40 },
  ],
  defaults: { entries: '', rows: 14, pages: 1, species: '' },
  build: (v, common) => {
    const entries = lines(v, 'entries', 30);
    const rows = clamp(num(v, 'rows', 14), 8, 25);
    const count = Math.max(clamp(num(v, 'pages', 1), 1, 6), Math.ceil(entries.length / rows));
    return makePages(common, count, (c, i) => {
      const top = c.y + titleBar(c, 'Vaccination and treatment record', [str(v, 'species'), count > 1 ? `Page ${i + 1} of ${count}` : ''].filter(Boolean).join('     '));
      table(c, top, c.y + c.h, [{ label: 'Date', w: 1.2 }, { label: 'Vaccine or treatment', w: 3 }, { label: 'Brand and batch', w: 2 }, { label: 'Weight (kg)', w: 1 }, { label: 'Vet name or stamp', w: 2.2 }, { label: 'Next due', w: 1.2 }], rows, [], { headH: 9 });
      const slice = entries.slice(i * rows, (i + 1) * rows);
      // Pre-filled names go in the second column.
      slice.forEach((label, r) => {
        const total = 1.2 + 3 + 2 + 1 + 2.2 + 1.2;
        const x = c.x + (1.2 / total) * c.w + 1.2;
        const w = (3 / total) * c.w - 2.4;
        const rowH = (c.y + c.h - top - 9) / rows;
        fitText(c, x, top + 9 + r * rowH + Math.min(5, rowH * 0.62), w, rowH - 0.8, label, Math.min(10, rowH * 1.5));
      });
    });
  },
};

const sitter: SheetDef = {
  id: 'pet-sitter-instructions-printable',
  label: 'Pet sitter sheet',
  hint: 'Feeding, walks, emergencies',
  path: '/pet-sitter-instructions-printable',
  landscape: false,
  fields: [
    { type: 'text', key: 'food', label: 'Food and brand', max: 60 },
    { type: 'text', key: 'amount', label: 'Amount and meal times', max: 60 },
    { type: 'text', key: 'walks', label: 'Walks and toilet breaks', max: 60 },
    { type: 'text', key: 'medicine', label: 'Medicines (name, how much, when)', max: 80 },
    { type: 'text', key: 'vet', label: 'Vet and clinic', max: 50 },
    { type: 'text', key: 'vetPhone', label: 'Vet phone', max: 30 },
    { type: 'text', key: 'owner', label: 'Owner phone while away', max: 40 },
    { type: 'text', key: 'backup', label: 'Backup person and phone', max: 50 },
  ],
  defaults: { food: '', amount: '', walks: '', medicine: '', vet: '', vetPhone: '', owner: '', backup: '' },
  build: (v, common) => makePages(common, 1, (c) => {
    const top = c.y + titleBar(c, 'Pet sitter instructions', 'Everything someone needs to look after the pet while you are away.');
    const bottom = c.y + c.h;
    const rows: { head: string; items: [string, string][]; free?: number }[] = [
      { head: 'Feeding', items: [['Food and brand', str(v, 'food')], ['Amount and meal times', str(v, 'amount')]] },
      { head: 'Walks and toilet', items: [['Walks and toilet breaks', str(v, 'walks')]] },
      { head: 'Medicines', items: [['Name, how much, when', str(v, 'medicine')]] },
      { head: 'Emergency', items: [['Vet and clinic', str(v, 'vet')], ['Vet phone', str(v, 'vetPhone')], ['Owner phone while away', str(v, 'owner')], ['Backup person and phone', str(v, 'backup')]] },
    ];
    let y = top;
    for (const row of rows) {
      line(c, c.x, y, c.x + c.w, y, c.weight * 1.6);
      text(c, c.x + 1, y + 6, 10.5, row.head, true, 'start', INK);
      y += 8;
      for (const [label, value] of row.items) { labelled(c, c.x + 1, y, c.w - 2, label, value); y += 15; }
      y += 2;
    }
    const blocks = ['Likes, dislikes and habits', 'Where things are and house rules'];
    const each = (bottom - y) / blocks.length;
    blocks.forEach((label, i) => {
      const by = y + i * each;
      line(c, c.x, by, c.x + c.w, by, c.weight * 1.6);
      text(c, c.x + 1, by + 6, 10.5, label, true, 'start', INK);
      ruled(c, c.x, c.x + c.w, by + 6, by + each - 1, 8);
    });
    line(c, c.x, bottom, c.x + c.w, bottom, c.weight * 1.6);
  }),
};

export const PET_FAMILY: Family = {
  key: 'pet',
  headingLabel: 'Pet name',
  headingPlaceholder: 'e.g. Bruno',
  sheets: [record, tracker, sitter],
};
