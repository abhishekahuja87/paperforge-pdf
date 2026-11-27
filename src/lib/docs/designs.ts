/** Looks for the Word makers: colours, a font, a cover style and a heading style. The same design drives the preview and the saved file. */
import type { Block, Para } from '../docx/model';
import { P } from './kit';

export type CoverStyle = 'centre' | 'band' | 'side' | 'line';
export type HeadStyle = 'rule' | 'shade' | 'bar' | 'plain';
export interface WordDesign { id: string; accent: string; accent2: string; font: string; cover: CoverStyle; head: HeadStyle }

export const WORD_DESIGNS: WordDesign[] = [
  { id: 'classic', accent: '1F4E79', accent2: '2E75B6', font: 'Calibri', cover: 'centre', head: 'rule' },
  { id: 'executive', accent: '1B2A41', accent2: 'B8912A', font: 'Georgia', cover: 'line', head: 'rule' },
  { id: 'forest', accent: '2E5E3A', accent2: '6B9E4F', font: 'Cambria', cover: 'side', head: 'bar' },
  { id: 'burgundy', accent: '7B1E3A', accent2: 'B5546F', font: 'Georgia', cover: 'band', head: 'shade' },
  { id: 'teal', accent: '0F766E', accent2: '14A39A', font: 'Calibri', cover: 'band', head: 'bar' },
  { id: 'slate', accent: '334155', accent2: '64748B', font: 'Arial', cover: 'side', head: 'rule' },
  { id: 'sunset', accent: 'C2410C', accent2: 'F59E0B', font: 'Trebuchet MS', cover: 'band', head: 'shade' },
  { id: 'violet', accent: '5B21B6', accent2: '8B5CF6', font: 'Cambria', cover: 'line', head: 'bar' },
  { id: 'rose', accent: 'BE185D', accent2: 'EC6FA3', font: 'Georgia', cover: 'centre', head: 'shade' },
  { id: 'ocean', accent: '0369A1', accent2: '38A9DB', font: 'Arial', cover: 'line', head: 'bar' },
  { id: 'mono', accent: '1A1A1A', accent2: '6B7280', font: 'Times New Roman', cover: 'centre', head: 'rule' },
  { id: 'modern', accent: '27272A', accent2: 'EA580C', font: 'Trebuchet MS', cover: 'side', head: 'bar' },
];

export const designOf = (id: string | undefined): WordDesign => WORD_DESIGNS.find((d) => d.id === id) ?? WORD_DESIGNS[0]!;

/** A pale version of a colour, for the shaded headings. */
export function tint(hex: string, amount = 0.88): string {
  const n = parseInt(hex, 16), mix = (c: number) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, '0');
  return `${mix((n >> 16) & 255)}${mix((n >> 8) & 255)}${mix(n & 255)}`.toUpperCase();
}

/** A heading in the design: coloured text, with a rule, a shaded band or a bar as the design asks. Level 2 stays plain. */
export function headingPara(d: WordDesign, text: string, level: 1 | 2, size?: number): Para {
  const base: Partial<Para> = { style: level === 1 ? 'h1' : 'h2', size: size ?? (level === 1 ? 16 : 13), keepNext: true, before: level === 1 ? 14 : 8, after: level === 1 ? 6 : 3 };
  if (level === 2) return P(text, { ...base, color: d.accent });
  if (d.head === 'rule') return P(text, { ...base, color: d.accent, rule: d.accent2 });
  if (d.head === 'shade') return P(text, { ...base, color: d.accent, fill: tint(d.accent) });
  if (d.head === 'bar') return P(text, { ...base, color: d.accent, bar: d.accent2 });
  return P(text, { ...base, color: d.accent });
}

/** The title page, or the title block at the top of a document without a cover page. */
export function titleBlocks(d: WordDesign, title: string, subtitle: string, facts: string[]): Block[] {
  const out: Block[] = [];
  const factLines = (align: 'center' | 'left') => facts.forEach((f, k) => out.push(P(f, { size: 12, align, before: k === 0 ? 30 : 0, after: 4, color: k === 0 ? d.accent : '404040', bold: k === 0 })));
  if (d.cover === 'band') {
    out.push(P('', { before: 90, after: 0 }));
    out.push(P(title, { size: 30, bold: true, color: 'FFFFFF', fill: d.accent, before: 0, after: 0 }));
    out.push(P(subtitle || ' ', { size: 15, color: 'FFFFFF', fill: d.accent, before: 0, after: 0 }));
    out.push(P('', { after: 0, fill: d.accent2, size: 3 }));
    factLines('left');
  } else if (d.cover === 'side') {
    out.push(P('', { before: 90, after: 0 }));
    out.push(P(title, { size: 32, bold: true, color: d.accent, bar: d.accent2, after: 4 }));
    if (subtitle) out.push(P(subtitle, { size: 16, color: '595959', bar: d.accent2, after: 4 }));
    factLines('left');
  } else if (d.cover === 'line') {
    out.push(P('', { before: 80, after: 0, rule: d.accent }));
    out.push(P(title, { size: 30, bold: true, color: d.accent, before: 14, after: 4 }));
    if (subtitle) out.push(P(subtitle, { size: 15, color: '595959', after: 10 }));
    out.push(P('', { after: 0, rule: d.accent2 }));
    factLines('left');
  } else {
    out.push(P('', { before: 110, after: 0 }));
    out.push(P(title, { size: 30, bold: true, color: d.accent, align: 'center', before: 60, after: 12 }));
    if (subtitle) out.push(P(subtitle, { size: 16, align: 'center', after: 36, color: '595959' }));
    out.push(P('', { after: 0, rule: d.accent2 }));
    factLines('center');
  }
  return out;
}

/** A thin mark at the top of a letter or notice, so the page carries the design. */
export function topMark(d: WordDesign): Block[] {
  if (d.cover === 'band') return [P('', { fill: d.accent, size: 3, after: 12 })];
  if (d.cover === 'line') return [P('', { rule: d.accent, after: 12 }), P('', { rule: d.accent2, after: 12, size: 3 })];
  if (d.cover === 'centre') return [P('', { rule: d.accent2, after: 12, size: 3 })];
  return [];
}

/** A line that stands out in the design, such as the subject of a letter. */
export const subjectPara = (d: WordDesign, text: string, o: Partial<Para> = {}): Para => (d.cover === 'side' ? P(text, { bold: true, color: d.accent, bar: d.accent2, ...o }) : P(text, { bold: true, color: d.accent, ...o }));

/** The sender block at the top of a letter: a name with address and contact lines, in the design. */
export function senderBlock(d: WordDesign, name: string, rest: string[]): Block[] {
  const out: Block[] = [];
  const lines = rest.filter(Boolean);
  if (d.cover === 'band') {
    out.push(P(name, { bold: true, size: 16, color: 'FFFFFF', fill: d.accent, after: 0 }));
    lines.forEach((l) => out.push(P(l, { size: 10, color: 'FFFFFF', fill: d.accent, after: 0 })));
    out.push(P('', { size: 3, fill: d.accent2, after: 0 }));
  } else if (d.cover === 'side') {
    out.push(P(name, { bold: true, size: 16, color: d.accent, bar: d.accent2, after: 0 }));
    lines.forEach((l) => out.push(P(l, { size: 10, color: '404040', bar: d.accent2, after: 0 })));
  } else if (d.cover === 'line') {
    out.push(P(name, { bold: true, size: 16, color: d.accent, after: 0 }));
    lines.forEach((l) => out.push(P(l, { size: 10, color: '404040', after: 0 })));
    out.push(P('', { rule: d.accent2, size: 3, after: 0 }));
  } else {
    out.push(P(name, { bold: true, size: 16, color: d.accent, align: 'center', after: 0 }));
    lines.forEach((l) => out.push(P(l, { size: 10, color: '404040', align: 'center', after: 0 })));
    out.push(P('', { rule: d.accent2, size: 3, after: 0 }));
  }
  return out;
}
