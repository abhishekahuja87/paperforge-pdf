import { INK, clamp, fillRect, fitText, line, lines, makePages, num, str, text, wrap } from './draw';
import { blank } from './simple';
import type { Family, SheetDef } from './types';

export interface NoticeSpec {
  id: string;
  label: string;
  hint: string;
  /** The big word at the top, such as NOTICE. */
  title: string;
  subject: string;
  body: string;
  /** Shown as "To:" or "For:" lines, when the notice has them. */
  toLine?: string;
  signer: string;
}

/** A letter-style page: society or office name, title, date, subject, wrapped text and a signature block. */
export function noticeSheet(s: NoticeSpec): SheetDef {
  return {
    id: s.id, label: s.label, hint: s.hint, path: `/${s.id}`, landscape: false,
    fields: [
      { type: 'text', key: 'subject', label: 'Subject', placeholder: s.subject, max: 80 },
      { type: 'list', key: 'body', label: 'Text of the notice', hint: 'One paragraph on each line, up to 14. Replace the blanks with your details.', max: 14 },
      { type: 'text', key: 'ref', label: 'Reference number (optional)', placeholder: 'SOC/2026/14', max: 24 },
      { type: 'text', key: 'date', label: 'Date', placeholder: '20 November 2026', max: 24 },
      { type: 'text', key: 'signer', label: 'Signed by', placeholder: s.signer, max: 40 },
      { type: 'select', key: 'letterhead', label: 'Top of the page', options: [{ value: 'line', label: 'Name with a rule' }, { value: 'band', label: 'Colour band with the name' }, { value: 'box', label: 'Name in a framed box' }] },
      { type: 'number', key: 'size', label: 'Text size', min: 10, max: 16, step: 1, unit: 'pt' },
      { type: 'number', key: 'pages', label: 'Copies', min: 1, max: 10, step: 1, unit: 'copies' },
    ],
    defaults: { subject: s.subject, body: s.body, ref: '', date: '', signer: s.signer, letterhead: 'line', size: 12, pages: 1 },
    build: (v, common) => makePages(common, clamp(num(v, 'pages', 1), 1, 10), (c) => {
      const cx = c.x + c.w / 2;
      const heading = c.heading.trim();
      const style = str(v, 'letterhead') || 'line';
      const bandCol = c.fill ? c.accent : c.color;
      if (style === 'band') {
        fillRect(c, c.x, c.y, c.w, 20, bandCol);
        if (heading) fitText(c, c.x + 4, c.y + 13, c.w - 8, 12, heading, 20, true, 'middle', '#ffffff');
      } else if (style === 'box') {
        const bx = c.x + 12; const bw = c.w - 24;
        fillRect(c, bx, c.y, bw, 20, c.tint);
        line(c, bx, c.y, bx + bw, c.y, c.weight * 2, bandCol); line(c, bx, c.y + 20, bx + bw, c.y + 20, c.weight * 2, bandCol); line(c, bx, c.y, bx, c.y + 20, c.weight * 2, bandCol); line(c, bx + bw, c.y, bx + bw, c.y + 20, c.weight * 2, bandCol);
        if (heading) fitText(c, bx + 4, c.y + 13, bw - 8, 12, heading, 20, true, 'middle', c.accent);
      } else {
        if (heading) fitText(c, c.x, c.y + 12, c.w, 12, heading, 20, true, 'middle', c.accent);
        line(c, c.x, c.y + 18, c.x + c.w, c.y + 18, c.weight * 2);
      }
      text(c, cx, c.y + 36, 24, s.title, true, 'middle', c.accent);
      line(c, cx - 28, c.y + 39, cx + 28, c.y + 39, c.weight * 1.4, bandCol);
      const ref = str(v, 'ref');
      text(c, c.x, c.y + 52, 10, ref ? `Ref: ${ref}` : 'Ref:', true, 'start', INK);
      text(c, c.x + c.w, c.y + 52, 10, `Date: ${str(v, 'date') || '____________'}`, true, 'end', INK);
      let y = c.y + 64;
      if (s.toLine) { text(c, c.x, y, 10.5, s.toLine, true, 'start', INK); y += 9; }
      const subject = str(v, 'subject') || s.subject;
      text(c, c.x, y, 11.5, 'Subject:', true, 'start', INK);
      fitText(c, c.x + 22, y, c.w - 22, 14, subject, 11.5, true);
      line(c, c.x + 22, y + 1.6, c.x + 22 + Math.min(c.w - 22, subject.length * 2.3 + 4), y + 1.6, c.weight);
      y += 14;
      const size = clamp(num(v, 'size', 12), 10, 16);
      const perLine = Math.floor(c.w / (size * c.cw));
      const step = size * 0.5;
      lines(v, 'body', 14).forEach((para) => {
        wrap(para, perLine).forEach((row) => { if (y < c.y + c.h - 40) text(c, c.x, y, size, row, false, 'start', INK); y += step; });
        y += step * 0.6;
      });
      const base = c.y + c.h - 28;
      line(c, c.x + c.w - 70, base, c.x + c.w, base, c.weight * 1.2);
      text(c, c.x + c.w - 35, base + 6, 10, str(v, 'signer') || s.signer, true, 'middle', INK);
      text(c, c.x + c.w - 35, base + 11, 8, 'Signature and stamp', false, 'middle', '#666666');
    }),
  };
}

const SPECS: NoticeSpec[] = [
  { id: 'society-notice-template-printable', label: 'General notice', hint: 'Any society notice', title: 'NOTICE', subject: 'Notice to all residents', body: 'All residents are informed that ____________ will take place on ____________ at ____________.\nResidents are requested to cooperate with the arrangements.\nFor any questions, please contact the society office.', signer: 'Secretary' },
  { id: 'general-body-meeting-notice-printable', label: 'Meeting notice', hint: 'General body meeting', title: 'NOTICE OF MEETING', subject: 'General body meeting', body: 'A general body meeting of the society will be held on ____________ at ____________ at ____________.\nAgenda:\n1. Reading and confirming the minutes of the last meeting\n2. Accounts and maintenance\n3. Other matters with the permission of the chair\nAll members are requested to attend on time.', signer: 'Secretary' },
  { id: 'maintenance-collection-reminder-notice-printable', label: 'Maintenance reminder', hint: 'Dues reminder', title: 'REMINDER', subject: 'Maintenance charges for the month of ____________', body: 'This is a gentle reminder that the maintenance charges for the month of ____________ are due.\nMembers who have not yet paid are requested to pay at the society office or by the usual method.\nPlease keep the receipt for your records. Thank you for your cooperation.', signer: 'Treasurer' },
  { id: 'water-supply-interruption-notice-printable', label: 'Water supply notice', hint: 'Water or work disruption', title: 'NOTICE', subject: 'Interruption of water supply', body: 'Water supply will be interrupted on ____________ from ____________ to ____________ because of ____________.\nResidents are requested to store water in advance and to use it carefully.\nWe regret the inconvenience.', signer: 'Secretary' },
  { id: 'festival-celebration-notice-printable', label: 'Festival notice', hint: 'Invite residents to an event', title: 'INVITATION', subject: 'Celebration of ____________', body: 'The society will celebrate ____________ on ____________ at ____________.\nAll residents and their families are warmly invited.\nVolunteers are requested to give their names to the committee.', signer: 'Cultural Secretary' },
  { id: 'office-circular-template-printable', label: 'Office circular', hint: 'For staff', title: 'CIRCULAR', subject: 'Circular to all staff', body: 'All staff are informed that ____________.\nThis comes into effect from ____________.\nPlease read this circular and sign the acknowledgement sheet.', toLine: 'To: All staff', signer: 'Manager' },
];

/* ---------- Gate pass ---------- */

const gatePass: SheetDef = {
  id: 'gate-pass-printable', label: 'Gate pass', hint: 'Four passes on a page', path: '/gate-pass-printable', landscape: false,
  fields: [{ type: 'number', key: 'pages', label: 'Pages', min: 1, max: 12, step: 1, unit: 'pages' }],
  defaults: { pages: 1 },
  build: (v, common) => makePages(common, clamp(num(v, 'pages', 1), 1, 12), (c) => {
    const each = c.h / 4;
    for (let k = 0; k < 4; k += 1) {
      const y = c.y + k * each; const x = c.x; const w = c.w;
      line(c, x, y + 1, x + w, y + 1, c.weight * 1.6); line(c, x, y + each - 3, x + w, y + each - 3, c.weight * 1.6);
      line(c, x, y + 1, x, y + each - 3, c.weight * 1.6); line(c, x + w, y + 1, x + w, y + each - 3, c.weight * 1.6);
      text(c, x + 3, y + 8, 12, 'GATE PASS', true, 'start', INK);
      if (c.heading.trim()) text(c, x + w - 3, y + 8, 9, c.heading.trim(), true, 'end', INK);
      blank(c, x + 3, y + 11, w * 0.3, 'No.:'); blank(c, x + w * 0.62, y + 11, w * 0.36, 'Date:');
      blank(c, x + 3, y + 20, w * 0.56, 'Name:'); blank(c, x + w * 0.62, y + 20, w * 0.36, 'Phone:');
      blank(c, x + 3, y + 29, w * 0.56, 'Whom to meet:'); blank(c, x + w * 0.62, y + 29, w * 0.36, 'Flat or room:');
      blank(c, x + 3, y + 38, w * 0.56, 'Purpose:'); blank(c, x + w * 0.62, y + 38, w * 0.36, 'Vehicle no.:');
      blank(c, x + 3, y + each - 18, w * 0.2, 'In:'); blank(c, x + w * 0.24, y + each - 18, w * 0.2, 'Out:'); blank(c, x + w * 0.48, y + each - 18, w * 0.24, 'Guard sign:'); blank(c, x + w * 0.76, y + each - 18, w * 0.22, 'Host sign:');
    }
  }),
};

export const NOTICE_FAMILY: Family = {
  key: 'notice',
  headingLabel: 'Society, office or school name',
  headingPlaceholder: 'Sunrise Heights Residents Association',
  note: 'The wording is a starting point. Check dates, amounts and any rules in your own bye-laws before you print. These templates carry no legal wording.',
  sheets: [...SPECS.map(noticeSheet), gatePass],
};
