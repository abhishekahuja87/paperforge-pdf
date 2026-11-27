/** Builds a long document skeleton (cover page, contents, numbered headings, prompts and tables) for the Word templates. */
import type { Block, Cell, DocModel, Para } from '../docx/model';
import type { Region } from '../workbooks/region';
import { clean, longDate, P } from './kit';
import { designOf, headingPara, titleBlocks } from './designs';

export interface TplTable { headers: string[]; rows: number; widths?: number[] }
export interface TplSection { id: string; h: string; text: string; level: 1 | 2; table?: TplTable }
export interface TplPick { section: TplSection; on: boolean; text: string }
export interface TplInput {
  title: string; subtitle: string; org: string; author: string; date: string; version: string;
  cover: boolean; contents: boolean; pageNumbers: boolean; numbered: boolean; contentsHeading: string; preparedBy: string; versionLabel: string;
  font: string; design: string; picks: TplPick[]; custom: { h: string; text: string }[]; region: Region;
}

/** Lines of a box as paragraphs. A line that starts with a dash or a bullet becomes a bullet. */
function body(text: string): Para[] {
  const out: Para[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim(); if (!line) continue;
    const m = /^[-*•]\s+(.*)$/.exec(line);
    out.push(m ? P(m[1]!, { bullet: true, after: 3 }) : P(line, { after: 6 }));
  }
  return out;
}

function tableOf(t: TplTable, accent: string): Block {
  const head: Cell[] = t.headers.map((h) => ({ runs: h, bold: true, fill: accent, color: 'FFFFFF' }));
  const rows: Cell[][] = Array.from({ length: Math.max(1, t.rows) }, () => t.headers.map(() => ({ runs: '' })));
  return { type: 'table', rows: [head, ...rows], widths: t.widths && t.widths.length === t.headers.length ? t.widths : t.headers.map(() => 1), lines: 'A6A6A6', header: true };
}

export function buildTemplate(i: TplInput): DocModel {
  const d = designOf(i.design), accent = d.accent;
  const chosen: { h: string; text: string; level: 1 | 2; table?: TplTable }[] = [
    ...i.picks.filter((p) => p.on).map((p) => ({ h: p.section.h, text: p.text, level: p.section.level, table: p.section.table })),
    ...i.custom.filter((c) => clean(c.h) || clean(c.text)).map((c) => ({ h: clean(c.h) || ' ', text: c.text, level: 1 as const })),
  ];
  let a = 0, b = 0;
  const numbered = chosen.map((s) => {
    if (s.level === 1) { a += 1; b = 0; } else { if (a === 0) a = 1; b += 1; }
    const num = i.numbered ? (s.level === 1 ? `${a}. ` : `${a}.${b} `) : '';
    return { ...s, label: `${num}${s.h}` };
  });
  const blocks: Block[] = [];
  const title = clean(i.title) || ' ';
  const when = longDate(i.date, i.region);
  if (i.cover) {
    const facts = [clean(i.org), clean(i.author) ? `${i.preparedBy} ${clean(i.author)}` : '', when, clean(i.version) ? `${i.versionLabel} ${clean(i.version)}` : ''].filter(Boolean);
    blocks.push(...titleBlocks(d, title, clean(i.subtitle), facts));
    blocks.push({ type: 'break' });
  } else {
    blocks.push(P(title, { size: 24, bold: true, color: accent, after: 4, ...(d.cover === 'side' ? { bar: d.accent2 } : {}) }));
    if (clean(i.subtitle)) blocks.push(P(clean(i.subtitle), { size: 13, color: '595959', after: 4 }));
    const meta = [clean(i.org), clean(i.author), when, clean(i.version) ? `${i.versionLabel} ${clean(i.version)}` : ''].filter(Boolean).join('  |  ');
    if (meta) blocks.push(P(meta, { size: 10, color: '595959', after: 8 }));
    blocks.push(P('', { after: 4, rule: d.accent2 }));
  }
  if (i.contents && numbered.length) {
    blocks.push({ ...headingPara(d, i.contentsHeading, 1), style: undefined });
    blocks.push({ type: 'toc', entries: numbered.map((s) => ({ text: s.label, level: s.level })) });
    blocks.push({ type: 'break' });
  }
  numbered.forEach((s) => {
    blocks.push(headingPara(d, s.label, s.level));
    blocks.push(...body(s.text));
    if (s.table) { blocks.push(tableOf(s.table, accent)); blocks.push(P('', { after: 6 })); }
  });
  return { title, blocks, paper: i.region.paper === 'letter' ? 'letter' : 'a4', font: i.font || d.font, size: 11, margin: 22, pageNumbers: i.pageNumbers, coverPage: i.cover };
}
