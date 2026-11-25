/**
 * Reads slide text into slides. A slide is a title and rows; each line (left, right, arrow, bullet, big text, image, pause) is one step that
 * appears in turn. A row holds at most one left, one arrow and one right item: a second one of the same kind starts a new row.
 * No drawing happens here. Problems are collected with their line number.
 */

export type Zone = 'left' | 'right' | 'center';

export interface Cell { text: string; /** Name of an added picture, or ''. */ image: string; step: number; line: number }
export interface Arrow { label: string; back: boolean; step: number; line: number }
export interface PairRow { kind: 'pair'; left?: Cell; right?: Cell; arrow?: Arrow }
export interface CenterRow { kind: 'center'; cell: Cell }
export interface BulletRow { kind: 'bullet'; text: string; step: number; line: number }
export interface BigRow { kind: 'big'; text: string; step: number; line: number }
export interface DownRow { kind: 'down'; label: string; step: number; line: number }
export type Row = PairRow | CenterRow | BulletRow | BigRow | DownRow;

export interface Slide { title: string; rows: Row[]; /** First and last step numbers on this slide. */ firstStep: number; lastStep: number }
export interface StepInfo { slide: number; kind: 'left' | 'right' | 'center' | 'arrow' | 'bullet' | 'big' | 'down' | 'pause'; text: string; seconds: number }
export interface ParseIssue { line: number; message: string }
export interface Deck { slides: Slide[]; steps: StepInfo[]; issues: ParseIssue[] }

export const LIMITS = { slides: 12, steps: 60, text: 120 };

const clean = (text: string) => text.replace(/\\n/g, '\n').trim();

export function parseDeck(source: string, images: string[]): Deck {
  const deck: Deck = { slides: [], steps: [], issues: [] };
  const issue = (line: number, message: string) => { if (deck.issues.length < 20) deck.issues.push({ line, message }); };
  let slide: Slide | null = null; let row: PairRow | null = null;

  const begin = () => { if (deck.slides.length >= LIMITS.slides) { issue(0, `Too many slides. The most is ${LIMITS.slides}.`); return false; } slide = { title: '', rows: [], firstStep: -1, lastStep: -1 }; deck.slides.push(slide); row = null; return true; };
  const ensure = () => (slide ? true : begin());
  const step = (kind: StepInfo['kind'], text: string, line: number, seconds = 0): number => {
    if (deck.steps.length >= LIMITS.steps) { issue(line, `Too many steps. The most is ${LIMITS.steps}.`); return -1; }
    deck.steps.push({ slide: deck.slides.length - 1, kind, text, seconds });
    const n = deck.steps.length - 1; if (slide!.firstStep < 0) slide!.firstStep = n; slide!.lastStep = n; return n;
  };
  const pair = (slot: 'left' | 'right' | 'arrow'): PairRow => {
    if (!row || row[slot]) { row = { kind: 'pair' }; slide!.rows.push(row); }
    return row;
  };
  const cell = (zone: Zone, text: string, image: string, line: number) => {
    if (!ensure()) return;
    if (image && !images.includes(image)) issue(line, `There is no picture called "${image}". Add a picture below, then use the button that appears under it.`);
    if (text.length > LIMITS.text) issue(line, `Text can be ${LIMITS.text} letters at most.`);
    const n = step(zone, text, line); if (n < 0) return;
    const value: Cell = { text: text.slice(0, LIMITS.text), image, step: n, line };
    if (zone === 'center') { slide!.rows.push({ kind: 'center', cell: value }); row = null; return; }
    pair(zone)[zone] = value;
  };

  const lines = source.replace(/\r/g, '').split('\n');
  lines.forEach((raw, index) => {
    const lineNo = index + 1; const text = raw.trim();
    if (!text || text.startsWith('#')) return;
    let m: RegExpMatchArray | null;
    if (/^(---+|slide)(\s.*)?$/i.test(text)) { begin(); const t = text.replace(/^(---+|slide)\s*/i, '').trim(); if (t && slide) slide.title = clean(t).slice(0, 80); return; }
    if ((m = text.match(/^title\s*:\s*(.*)$/i))) { if (ensure()) slide!.title = clean(m[1]!).slice(0, 80); return; }
    if ((m = text.match(/^(left|right|center|centre|middle)-image\s*:\s*(.*)$/i))) {
      const zone = (m[1]!.toLowerCase() === 'left' ? 'left' : m[1]!.toLowerCase() === 'right' ? 'right' : 'center') as Zone;
      const rest = m[2]!.trim(); const [name, ...caption] = rest.split(/\s+/);
      cell(zone, clean(caption.join(' ')), name ?? '', lineNo); return;
    }
    if ((m = text.match(/^(left|right|center|centre|middle)\s*:\s*(.*)$/i))) {
      const word = m[1]!.toLowerCase(); cell(word === 'left' ? 'left' : word === 'right' ? 'right' : 'center', clean(m[2]!), '', lineNo); return;
    }
    if ((m = text.match(/^arrow(-back)?\s*:\s*(.*)$/i))) {
      if (!ensure()) return;
      const label = clean(m[2]!); const n = step('arrow', label, lineNo); if (n < 0) return;
      pair('arrow').arrow = { label: label.slice(0, 60), back: !!m[1], step: n, line: lineNo }; return;
    }
    if ((m = text.match(/^down\s*:\s*(.*)$/i))) {
      if (!ensure()) return; const label = clean(m[1]!); const n = step('down', label, lineNo); if (n < 0) return;
      slide!.rows.push({ kind: 'down', label: label.slice(0, 60), step: n, line: lineNo }); row = null; return;
    }
    if ((m = text.match(/^big\s*:\s*(.*)$/i))) {
      if (!ensure()) return; const value = clean(m[1]!); const n = step('big', value, lineNo); if (n < 0) return;
      slide!.rows.push({ kind: 'big', text: value.slice(0, 60), step: n, line: lineNo }); row = null; return;
    }
    if ((m = text.match(/^[-*•]\s+(.*)$/))) {
      if (!ensure()) return; const value = clean(m[1]!); const n = step('bullet', value, lineNo); if (n < 0) return;
      slide!.rows.push({ kind: 'bullet', text: value.slice(0, LIMITS.text), step: n, line: lineNo }); row = null; return;
    }
    if ((m = text.match(/^pause(?:\s+(\d+(?:\.\d+)?))?$/i))) {
      if (!ensure()) return; step('pause', '', lineNo, Math.min(10, Math.max(0.5, m[1] ? Number(m[1]) : 2))); return;
    }
    issue(lineNo, `I could not read this line: "${text.slice(0, 40)}${text.length > 40 ? '…' : ''}". Start it with left:, right:, center:, arrow:, big:, down:, title:, a dash for a bullet, or slide.`);
  });

  // A slide with only a title still needs a moment on screen.
  deck.slides.forEach((s, k) => {
    if (s.firstStep >= 0) return;
    if (!s.title) return;
    // Add an implicit hold step. Steps are kept in slide order, so insert it before the next slide's first step.
    const at = deck.slides.slice(k + 1).find((later) => later.firstStep >= 0)?.firstStep ?? deck.steps.length;
    deck.steps.splice(at, 0, { slide: k, kind: 'pause', text: '', seconds: 2 });
    for (const later of deck.slides) {
      const bump = (n: number) => (n >= at ? n + 1 : n);
      if (later === s) { later.firstStep = at; later.lastStep = at; continue; }
      if (later.firstStep >= 0) { later.firstStep = bump(later.firstStep); later.lastStep = bump(later.lastStep); }
      for (const r of later.rows) {
        if (r.kind === 'pair') { for (const c of [r.left, r.right]) if (c) c.step = bump(c.step); if (r.arrow) r.arrow.step = bump(r.arrow.step); }
        else if (r.kind === 'center') r.cell.step = bump(r.cell.step); else r.step = bump(r.step);
      }
    }
  });
  if (deck.steps.length === 0 && deck.issues.length === 0) issue(1, 'Write a first line, for example: left: Factory');
  return deck;
}
