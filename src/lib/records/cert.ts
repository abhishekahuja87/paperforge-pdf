import { INK, clamp, drawLogo, fillRect, fitText, line, lines, makePages, num, str, text, type Ctx } from './draw';
import type { Family, Field, SheetDef } from './types';

const GOLD = '#8a6d1f';

export interface CertSpec {
  id: string;
  label: string;
  hint: string;
  title: string;
  /** The line above the name. */
  intro: string;
  /** The default wording under the name. */
  reason: string;
  signers: [string, string];
}

type Border = 'double' | 'corners' | 'dotted' | 'simple' | 'band' | 'sidebar' | 'tinted' | 'ribbon';

const bandColor = (c: Ctx) => (c.fill ? c.accent : c.color);

function frame(c: Ctx, border: Border): void {
  const { x, y, w, h } = c;
  const rect = (inset: number, weight: number, color = c.color) => {
    line(c, x + inset, y + inset, x + w - inset, y + inset, weight, color); line(c, x + w - inset, y + inset, x + w - inset, y + h - inset, weight, color);
    line(c, x + w - inset, y + h - inset, x + inset, y + h - inset, weight, color); line(c, x + inset, y + h - inset, x + inset, y + inset, weight, color);
  };
  if (border === 'simple') { rect(2, c.weight * 3); return; }
  if (border === 'band') { fillRect(c, x, y, w, 11, bandColor(c)); fillRect(c, x, y + h - 11, w, 11, bandColor(c)); rect(14, c.weight * 1); return; }
  if (border === 'sidebar') { fillRect(c, x, y, 16, h, bandColor(c)); fillRect(c, x + 18, y, 2, h, c.fill ? c.tint : '#dddddd'); rect(2, c.weight * 1.4); return; }
  if (border === 'tinted') { fillRect(c, x, y, w, h, c.tint); fillRect(c, x + 7, y + 7, w - 14, h - 14, '#ffffff'); rect(7, c.weight * 2, bandColor(c)); rect(9.5, c.weight * 0.8); return; }
  if (border === 'ribbon') { rect(2, c.weight * 1.6); fillRect(c, x + w / 2 - 22, y + 2, 44, 9, bandColor(c)); fillRect(c, x + w / 2 - 22, y + h - 11, 44, 9, bandColor(c)); return; }
  if (border === 'double') { rect(2, c.weight * 3.5); rect(5.5, c.weight * 1); return; }
  if (border === 'corners') {
    rect(2, c.weight * 1.2);
    [[x + 2, y + 2, 1, 1], [x + w - 2, y + 2, -1, 1], [x + 2, y + h - 2, 1, -1], [x + w - 2, y + h - 2, -1, -1]].forEach(([cx, cy, sx, sy]) => {
      line(c, cx!, cy! + sy! * 14, cx!, cy!, c.weight * 4, GOLD); line(c, cx!, cy!, cx! + sx! * 14, cy!, c.weight * 4, GOLD);
      line(c, cx! + sx! * 3, cy! + sy! * 11, cx! + sx! * 3, cy! + sy! * 3, c.weight * 1.4, GOLD); line(c, cx! + sx! * 3, cy! + sy! * 3, cx! + sx! * 11, cy! + sy! * 3, c.weight * 1.4, GOLD);
    });
    return;
  }
  rect(2, c.weight * 3);
  for (let px = x + 8; px < x + w - 6; px += 5) { c.items.push({ t: 'dot', x: px, y: y + 6, r: 0.6, c: GOLD }); c.items.push({ t: 'dot', x: px, y: y + h - 6, r: 0.6, c: GOLD }); }
  for (let py = y + 8; py < y + h - 6; py += 5) { c.items.push({ t: 'dot', x: x + 6, y: py, r: 0.6, c: GOLD }); c.items.push({ t: 'dot', x: x + w - 6, y: py, r: 0.6, c: GOLD }); }
}

/** A landscape certificate for each name typed, or blank ones. Several borders and a wording you can change. */
export function certSheet(s: CertSpec): SheetDef {
  const fields: Field[] = [
    { type: 'list', key: 'names', label: 'Names (optional)', hint: 'One per line, up to 30. Each gets a certificate. Leave empty for blank lines to write on.', max: 30 },
    { type: 'text', key: 'reason', label: 'Wording under the name', placeholder: s.reason, max: 160 },
    { type: 'text', key: 'date', label: 'Date (optional)', placeholder: '20 November 2026', max: 24 },
    { type: 'text', key: 'sign1', label: 'First signature label', placeholder: s.signers[0], max: 30 },
    { type: 'text', key: 'sign2', label: 'Second signature label', placeholder: s.signers[1], max: 30 },
    { type: 'select', key: 'border', label: 'Border', options: [{ value: 'double', label: 'Double line' }, { value: 'corners', label: 'Gold corners' }, { value: 'dotted', label: 'Dotted frame' }, { value: 'simple', label: 'Simple bold line' }, { value: 'band', label: 'Colour bands top and bottom' }, { value: 'sidebar', label: 'Colour side bar' }, { value: 'tinted', label: 'Tinted page with frame' }, { value: 'ribbon', label: 'Ribbon tabs' }] },
    { type: 'number', key: 'blanks', label: 'Blank copies (if no names)', min: 1, max: 12, step: 1, unit: 'copies' },
  ];
  return {
    id: s.id, label: s.label, hint: s.hint, path: `/${s.id}`, landscape: true, fields,
    defaults: { names: '', reason: s.reason, date: '', sign1: s.signers[0], sign2: s.signers[1], border: 'double', blanks: 1 },
    build: (v, common) => {
      const names = lines(v, 'names', 30);
      const count = names.length > 0 ? names.length : clamp(num(v, 'blanks', 1), 1, 12);
      const border = (str(v, 'border') || 'double') as Border;
      return makePages(common, count, (c, i) => {
        frame(c, border);
        const cx = c.x + c.w / 2;
        const heading = c.heading.trim();
        drawLogo(c, cx - 15, c.y + 12, 30, 9, 'middle');
        if (heading) fitText(c, c.x + 15, c.y + (c.logo ? 28 : 20), c.w - 30, 12, heading, 15, true, 'middle');
        fitText(c, c.x + 12, c.y + 44, c.w - 24, 20, s.title, 32, true, 'middle', c.accent);
        line(c, cx - 40, c.y + 52, cx + 40, c.y + 52, c.weight * 2, GOLD);
        text(c, cx, c.y + 68, 12, s.intro, false, 'middle', '#555555');
        const name = names[i] ?? '';
        if (name) fitText(c, c.x + 20, c.y + 86, c.w - 40, 16, name, 28, true, 'middle');
        line(c, c.x + 35, c.y + 90, c.x + c.w - 35, c.y + 90, c.weight * 1.2);
        const reason = str(v, 'reason') || s.reason;
        fitText(c, c.x + 28, c.y + 108, c.w - 56, 34, reason, 13, false, 'middle');
        const base = c.y + c.h - 24;
        const dateText = str(v, 'date');
        if (dateText) text(c, c.x + 40 + 30, base - 2, 11, dateText, false, 'middle', INK);
        line(c, c.x + 40, base, c.x + 100, base, c.weight * 1.2);
        text(c, c.x + 70, base + 5, 8.5, 'Date', false, 'middle', '#555555');
        line(c, cx - 30, base, cx + 30, base, c.weight * 1.2);
        text(c, cx, base + 5, 8.5, str(v, 'sign1') || s.signers[0], false, 'middle', '#555555');
        line(c, c.x + c.w - 100, base, c.x + c.w - 40, base, c.weight * 1.2);
        text(c, c.x + c.w - 70, base + 5, 8.5, str(v, 'sign2') || s.signers[1], false, 'middle', '#555555');
      });
    },
  };
}

const SPECS: CertSpec[] = [
  { id: 'certificate-of-achievement-printable', label: 'Achievement', hint: 'For a great result', title: 'Certificate of Achievement', intro: 'This certificate is proudly presented to', reason: 'in recognition of outstanding achievement and hard work.', signers: ['Principal or Manager', 'Teacher or Director'] },
  { id: 'certificate-of-participation-printable', label: 'Participation', hint: 'For taking part', title: 'Certificate of Participation', intro: 'This is to certify that', reason: 'took part with enthusiasm and sincerity in the event.', signers: ['Organiser', 'Principal or Head'] },
  { id: 'certificate-of-appreciation-printable', label: 'Appreciation', hint: 'To thank someone', title: 'Certificate of Appreciation', intro: 'Presented with gratitude to', reason: 'in appreciation of valuable support, time and effort.', signers: ['President or Chairperson', 'Secretary'] },
  { id: 'course-completion-certificate-printable', label: 'Course completion', hint: 'For a class or workshop', title: 'Certificate of Completion', intro: 'This is to certify that', reason: 'has successfully completed the course.', signers: ['Instructor', 'Director'] },
  { id: 'sports-winner-certificate-printable', label: 'Sports winner', hint: 'First, second, third', title: 'Certificate of Merit in Sports', intro: 'Awarded to', reason: 'for winning a place in the sports competition.', signers: ['Sports Teacher', 'Principal'] },
  { id: 'perfect-attendance-certificate-printable', label: 'Perfect attendance', hint: 'For being present', title: 'Perfect Attendance Award', intro: 'This award is given to', reason: 'for excellent attendance and punctuality.', signers: ['Class Teacher', 'Principal'] },
  { id: 'employee-of-the-month-certificate-printable', label: 'Employee of the month', hint: 'For a team member', title: 'Employee of the Month', intro: 'Congratulations to', reason: 'for dedication, teamwork and excellent performance this month.', signers: ['Manager', 'Director'] },
  { id: 'best-student-certificate-printable', label: 'Best student', hint: 'For a class topper or star', title: 'Best Student Award', intro: 'This award is presented to', reason: 'for excellent conduct, effort and results.', signers: ['Class Teacher', 'Principal'] },
];

export const CERT_FAMILY: Family = {
  key: 'cert',
  headingLabel: 'School or organisation name',
  headingPlaceholder: 'Sunrise Public School',
  note: 'The wording is a starting point. Change it to suit your event. These are plain certificates for your own use; they are not official documents.',
  sheets: SPECS.map(certSheet),
};
