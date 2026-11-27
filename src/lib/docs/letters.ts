/** Letters in Word: cover letter, resignation letter and leave application. Each is built from the boxes on the page. */
import type { Block, DocModel } from '../docx/model';
import { designOf, senderBlock, subjectPara, topMark } from './designs';
import { P, clean, daysBetween, fill, lines, longDate, paragraphs, type DocInput } from './kit';
import T from '../../locales/packs/worddocs.text.en.json';

const para = (text: string) => P(text, { align: 'both', after: 8 });
const sign = (blocks: Block[], off: string, name: string, extra: string[] = [], color = '000000') => {
  blocks.push(P(off, { before: 10, after: 28, keepNext: true }));
  blocks.push(P(name, { bold: true, after: 0, color }));
  extra.filter(Boolean).forEach((e) => blocks.push(P(e, { after: 0 })));
};

export function buildCover(i: DocInput): DocModel {
  const v = i.values, d = T.cover.doc, blocks: Block[] = [];
  const dz = designOf(i.look);
  const contact = [v.phone, v.email].map(clean).filter(Boolean).join('  |  ');
  blocks.push(...senderBlock(dz, clean(v.name), [...lines(v.address), contact]));
  if (longDate(v.date, i.region)) blocks.push(P(longDate(v.date, i.region), { before: 12, after: 12 }));
  [v.recipient, v.recipientTitle, v.company].map(clean).filter(Boolean).forEach((l) => blocks.push(P(l, { after: 0 })));
  lines(v.companyAddress).forEach((l) => blocks.push(P(l, { after: 0 })));
  blocks.push(P(`${d.dear} ${clean(v.recipient) || d.team},`, { before: 12, after: 8 }));
  if (clean(v.role)) blocks.push(subjectPara(dz, `${d.subject} ${clean(v.role)}`, { after: 8 }));
  const map = { role: clean(v.role), company: clean(v.company), name: clean(v.name) };
  [v.p1, v.p2, v.p3].forEach((p) => paragraphs(fill(clean(p), map)).forEach((x) => blocks.push(para(x))));
  sign(blocks, clean(v.signoff), clean(v.name), [], dz.accent);
  return { title: `${clean(v.name)} cover letter`, blocks, paper: i.region.paper, font: dz.font, size: 11, margin: 25 };
}

export function buildResignation(i: DocInput): DocModel {
  const v = i.values, d = T.resignation.doc, dz = designOf(i.look), blocks: Block[] = [...topMark(dz)];
  if (longDate(v.date, i.region)) blocks.push(P(longDate(v.date, i.region), { after: 12 }));
  [v.to, v.toTitle, v.company].map(clean).filter(Boolean).forEach((l) => blocks.push(P(l, { after: 0 })));
  blocks.push(P(`${d.dear} ${clean(v.to) || ''}`.trim() + ',', { before: 12, after: 8 }));
  blocks.push(subjectPara(dz, `${d.subject} ${clean(v.designation)}`.trim(), { after: 8 }));
  const map = { designation: clean(v.designation), company: clean(v.company), lastDay: longDate(v.lastDay, i.region) || '[last working day]', name: clean(v.name), date: longDate(v.date, i.region) };
  paragraphs(fill(clean(v.body), map)).forEach((x) => blocks.push(para(x)));
  sign(blocks, clean(v.signoff), clean(v.name), [clean(v.designation), clean(v.department)], dz.accent);
  return { title: `${clean(v.name)} resignation letter`, blocks, paper: i.region.paper, font: dz.font, size: 11, margin: 25 };
}
export const resignationNotes = (i: DocInput): string[] => {
  const n = daysBetween(i.values.date, i.values.lastDay); const nt = T.resignation.notes;
  return n === null ? [] : n < 0 ? [nt.before] : [nt.gap.replace('{n}', String(n))];
};

export function buildLeave(i: DocInput): DocModel {
  const v = i.values, d = T.leave.doc, dz = designOf(i.look), blocks: Block[] = [...topMark(dz)];
  if (longDate(v.date, i.region)) blocks.push(P(longDate(v.date, i.region), { after: 12 }));
  [v.to, v.org].map(clean).filter(Boolean).forEach((l) => blocks.push(P(l, { after: 0 })));
  blocks.push(subjectPara(dz, d.subject + (longDate(v.from, i.region) ? ` (${longDate(v.from, i.region)}${longDate(v.until, i.region) && v.until !== v.from ? ` to ${longDate(v.until, i.region)}` : ''})` : ''), { before: 12, after: 8 }));
  const n = daysBetween(v.from, v.until);
  const days = n === null || n < 0 ? '[number of days]' : n === 0 ? d.one : `${n + 1} days`;
  const map = { name: clean(v.name), detail: clean(v.detail), from: longDate(v.from, i.region) || '[start date]', until: longDate(v.until, i.region) || '[end date]', days, reason: clean(v.reason) || '[reason]' };
  paragraphs(fill(clean(v.body), map)).forEach((x) => blocks.push(para(x)));
  if (clean(v.contact)) blocks.push(para(d.contact.replace('{contact}', clean(v.contact))));
  sign(blocks, clean(v.signoff), clean(v.writer) || clean(v.name), [clean(v.writer) && clean(v.name) && clean(v.writer) !== clean(v.name) ? `${clean(v.name)}, ${clean(v.detail)}` : clean(v.detail)], dz.accent);
  return { title: `${clean(v.name)} leave application`, blocks, paper: i.region.paper, font: dz.font, size: 11, margin: 25 };
}
export const leaveNotes = (i: DocInput): string[] => {
  const n = daysBetween(i.values.from, i.values.until); const nt = T.leave.notes;
  return n === null ? [] : n < 0 ? [nt.before] : [nt.days.replace('{n}', String(n + 1))];
};
