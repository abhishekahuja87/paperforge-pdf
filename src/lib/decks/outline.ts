/** Turns a plain-text outline into slides. One text box drives every PowerPoint maker, so a deck is easy to type, paste and fix on a phone. */
import type { DeckModel, Slide } from '../pptx/model';
import { themeOf } from '../pptx/model';
import { clean, longDate } from '../docs/kit';
import type { Region } from '../workbooks/region';

export interface DeckInput {
  title: string; subtitle: string; author: string; date: string; closing: string; contact: string;
  outline: string; look: string; font: string; agenda: boolean;
  /** For quiz decks: show the answer after each question, all at the end, or not at all. */
  answers: 'each' | 'end' | 'none';
  region: Region;
}

export const MAX_SLIDES = 60;
const MAX_ITEMS = 12;
const bullet = /^[-*•]\s+(.*)$/;
const cell = (s: string) => s.trim();

interface Draft { kind: 'bullets' | 'section' | 'big' | 'quiz'; title: string; lines: string[]; rows: string[][]; cols: { head: string; bullets: string[] }[]; answer?: string }

/** Splits the outline into drafts, one for each slide. */
function drafts(text: string): Draft[] {
  const out: Draft[] = [];
  const start = (kind: Draft['kind'], title: string) => { out.push({ kind, title: title.trim(), lines: [], rows: [], cols: [] }); };
  for (const raw of text.split('\n')) {
    const line = raw.trim(); if (!line) continue;
    let m: RegExpExecArray | null;
    if ((m = /^##\s+(.*)$/.exec(line))) { start('section', m[1]!); continue; }
    if ((m = /^#\s+(.*)$/.exec(line))) { start('bullets', m[1]!); continue; }
    if ((m = /^>\s*(.*)$/.exec(line))) { start('big', m[1]!); continue; }
    if ((m = /^Q\s*:\s*(.*)$/i.exec(line))) { start('quiz', m[1]!); continue; }
    const cur = out[out.length - 1];
    if (!cur) continue;
    if ((m = /^(?:answer|ans)\s*:\s*(.*)$/i.exec(line)) && cur.kind === 'quiz') { cur.answer = m[1]!.trim(); continue; }
    if ((m = /^==\s*(.*)$/.exec(line))) { cur.cols.push({ head: m[1]!.trim(), bullets: [] }); continue; }
    if (line.startsWith('|')) {
      const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell);
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
      cur.rows.push(cells); continue;
    }
    const text2 = (m = bullet.exec(line)) ? m[1]!.trim() : line;
    if (cur.cols.length) cur.cols[cur.cols.length - 1]!.bullets.push(text2); else cur.lines.push(text2);
  }
  return out;
}

/** Splits a list that is too long into several slides, so nothing is squeezed to a tiny size. */
function chunks<T>(items: T[], size: number): T[][] {
  if (items.length <= size) return [items];
  const parts = Math.ceil(items.length / size), each = Math.ceil(items.length / parts);
  return Array.from({ length: parts }, (_, i) => items.slice(i * each, (i + 1) * each));
}

export interface OutlineResult { slides: Slide[]; answers: { n: number; answer: string }[]; cut: boolean }

export function parseOutline(text: string, mode: DeckInput['answers']): OutlineResult {
  const slides: Slide[] = [];
  const answers: { n: number; answer: string }[] = [];
  let q = 0;
  for (const d of drafts(text)) {
    if (d.kind === 'section') { slides.push({ kind: 'section', title: d.title, sub: d.lines.join('\n') }); continue; }
    if (d.kind === 'big') { slides.push({ kind: 'big', title: d.title, sub: d.lines.join('\n') }); continue; }
    if (d.kind === 'quiz') {
      q += 1;
      slides.push({ kind: 'bullets', title: `Q${q}. ${d.title}`, bullets: d.lines });
      if (d.answer) {
        answers.push({ n: q, answer: d.answer });
        if (mode === 'each') slides.push({ kind: 'big', title: `Answer: ${d.answer}`, sub: `Q${q}. ${d.title}` });
      }
      continue;
    }
    if (d.rows.length) { chunks(d.rows.slice(1), 9).forEach((part, i) => slides.push({ kind: 'table', title: i === 0 ? d.title : `${d.title} (continued)`, table: [d.rows[0]!, ...part] })); continue; }
    if (d.cols.length >= 2) { slides.push({ kind: 'two', title: d.title, columns: d.cols.slice(0, 2).map((c) => ({ head: c.head, bullets: c.bullets.slice(0, MAX_ITEMS) })) }); continue; }
    const items = [...d.lines, ...d.cols.flatMap((c) => c.bullets)];
    chunks(items.length ? items : [''], MAX_ITEMS).forEach((part, i) => slides.push({ kind: 'bullets', title: i === 0 ? d.title : `${d.title} (continued)`, bullets: part }));
  }
  return { slides: slides.slice(0, MAX_SLIDES), answers, cut: slides.length > MAX_SLIDES };
}

export function buildDeck(i: DeckInput): { deck: DeckModel; cut: boolean } {
  const parsed = parseOutline(i.outline, i.answers);
  const slides: Slide[] = [];
  const when = longDate(i.date, i.region);
  const sub = [clean(i.subtitle), [clean(i.author), when].filter(Boolean).join('  |  ')].filter(Boolean).join('\n');
  slides.push({ kind: 'title', title: clean(i.title) || 'Untitled', sub });
  if (i.agenda) {
    const heads = parsed.slides.filter((s) => s.kind === 'section' || s.kind === 'bullets' || s.kind === 'two' || s.kind === 'table').filter((s) => !/\(continued\)$/.test(s.title)).map((s) => s.title);
    const secs = parsed.slides.filter((s) => s.kind === 'section').map((s) => s.title);
    const list = (secs.length >= 2 ? secs : heads).slice(0, 10);
    if (list.length >= 2) slides.push({ kind: 'bullets', title: 'Agenda', bullets: list });
  }
  slides.push(...parsed.slides);
  if (i.answers === 'end' && parsed.answers.length) {
    chunks(parsed.answers, 9).forEach((part, k) => slides.push({ kind: 'table', title: k === 0 ? 'Answers' : 'Answers (continued)', table: [['Question', 'Answer'], ...part.map((a) => [`Q${a.n}`, a.answer])] }));
  }
  if (clean(i.closing)) slides.push({ kind: 'closing', title: clean(i.closing), sub: clean(i.contact) });
  const cut = parsed.cut || slides.length > MAX_SLIDES;
  return { deck: { title: clean(i.title) || 'Untitled', slides: slides.slice(0, MAX_SLIDES), theme: themeOf(i.look, i.font) }, cut };
}
