/** Meeting minutes and notices in Word. */
import type { Block, Cell, DocModel } from '../docx/model';
import { designOf, tint, topMark } from './designs';
import { P, clean, lines, longDate, paragraphs, type DocInput } from './kit';
import T from '../../locales/packs/worddocs.text.en.json';

export function buildMinutes(i: DocInput): DocModel {
  const v = i.values, d = T.minutes.doc, dz = designOf(i.look), blocks: Block[] = [...topMark(dz)];
  blocks.push(P(d.minutes, { size: 11, color: dz.accent2, bold: true, after: 0 }));
  blocks.push(P(clean(v.title) || ' ', { size: 18, bold: true, color: dz.accent, after: 6, ...(dz.cover === 'side' ? { bar: dz.accent2 } : {}) }));
  const facts: [string, string][] = [[d.date, longDate(v.date, i.region)], [d.time, clean(v.time)], [d.place, clean(v.place)], [d.chair, clean(v.chair)], [d.taker, clean(v.taker)]];
  blocks.push({ type: 'table', widths: [22, 78], lines: 'D0D0D0', rows: facts.filter(([, x]) => x).map(([k, x]): Cell[] => [{ runs: k, bold: true, fill: tint(dz.accent, 0.92) }, { runs: x }]) });
  const section = (title: string) => blocks.push(P(title.toUpperCase(), { bold: true, size: 11, color: dz.accent, rule: dz.accent2, before: 10, after: 4, keepNext: true }));
  if (lines(v.present).length) { section(d.present); lines(v.present).forEach((l) => blocks.push(P(l, { bullet: true, after: 0 }))); }
  if (lines(v.absent).length) { section(d.absent); lines(v.absent).forEach((l) => blocks.push(P(l, { bullet: true, after: 0 }))); }
  if (lines(v.agenda).length) { section(d.agenda); lines(v.agenda).forEach((l, k) => blocks.push(P(`${k + 1}.  ${l}`, { after: 1, indent: 4 }))); }
  const talk = (i.lists.discussion ?? []).filter((x) => clean(x.topic) || clean(x.notes));
  if (talk.length) { section(d.discussion); talk.forEach((x) => { blocks.push(P(clean(x.topic), { bold: true, after: 1, keepNext: true })); paragraphs(x.notes).forEach((p) => blocks.push(P(p, { after: 4 }))); }); }
  if (lines(v.decisions).length) { section(d.decisions); lines(v.decisions).forEach((l) => blocks.push(P(l, { bullet: true, after: 1 }))); }
  const acts = (i.lists.actions ?? []).filter((x) => clean(x.what));
  if (acts.length) {
    section(d.actions);
    const head: Cell[] = [d.what, d.owner, d.due].map((h) => ({ runs: h, bold: true, fill: dz.accent, color: 'FFFFFF' }));
    blocks.push({ type: 'table', widths: [58, 20, 22], lines: 'D0D0D0', header: true, rows: [head, ...acts.map((x): Cell[] => [{ runs: clean(x.what) }, { runs: clean(x.owner) }, { runs: longDate(x.due, i.region) }])] });
  }
  if (clean(v.next)) blocks.push(P([{ text: `${d.next}: `, bold: true }, { text: clean(v.next) }], { before: 8 }));
  return { title: clean(v.title) || d.minutes, blocks, paper: i.region.paper, font: dz.font, size: 10.5, margin: 20 };
}

export function buildNotice(i: DocInput): DocModel {
  const v = i.values, d = T.notice.doc, dz = designOf(i.look), blocks: Block[] = [];
  blocks.push(P(clean(v.org) || ' ', { size: 18, bold: true, color: dz.accent, align: 'center', after: 2 }));
  if (clean(v.orgLine)) blocks.push(P(clean(v.orgLine), { align: 'center', size: 10, color: '444444', rule: dz.accent2, after: 10 }));
  blocks.push(dz.head === 'shade' || dz.cover === 'band'
    ? P(clean(v.heading) || 'NOTICE', { size: 16, bold: true, align: 'center', before: 6, after: 10, color: 'FFFFFF', fill: dz.accent })
    : P(clean(v.heading) || 'NOTICE', { size: 16, bold: true, align: 'center', before: 6, after: 10, color: dz.accent, ...(dz.head === 'rule' ? { rule: dz.accent2 } : {}) }));
  const dateText = longDate(v.date, i.region);
  blocks.push({ type: 'table', widths: [50, 50], rows: [[{ runs: clean(v.ref) ? `${d.ref}: ${clean(v.ref)}` : '' }, { runs: dateText ? `${d.date}: ${dateText}` : '', align: 'right' }]] });
  if (clean(v.for)) blocks.push(P([{ text: `${d.to}: `, bold: true }, { text: lines(v.for).join(', ') }], { after: 6 }));
  if (clean(v.subject)) blocks.push(P([{ text: `${d.subject}: `, bold: true }, { text: clean(v.subject), bold: true, color: dz.accent }], { after: 8 }));
  paragraphs(v.body).forEach((p) => blocks.push(P(p, { align: 'both', after: 8 })));
  blocks.push(P(clean(v.signName), { bold: true, color: dz.accent, before: 28, after: 0, align: 'right', keepNext: true }));
  if (clean(v.signTitle)) blocks.push(P(clean(v.signTitle), { after: 0, align: 'right' }));
  if (clean(v.contact)) blocks.push(P(`${d.contact}: ${clean(v.contact)}`, { size: 10, color: '444444', align: 'right', after: 0 }));
  return { title: clean(v.subject) || d.ref, blocks, paper: i.region.paper, font: dz.font, size: 11, margin: 22 };
}
