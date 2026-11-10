import type { Margin, Variant } from './courtData';
import { CHECKED_ON, SOURCES } from './courtData';
import { buildDiagram, xml } from './diagram';
import { spaceNeeded } from './fit';
import { markingSteps, netPositions, type MarkingText } from './marking';
import { formatLength } from './units';

/** Words for one court's sheet, taken from the locale file by the page. */
export interface SheetText {
  title: string; version: string;
  ui: Record<string, string>;
  facts: Record<string, string>; marks: Record<string, string>; margin: string; notes: string[];
  marking: MarkingText;
}

const PAGE_W = 210;
const PAGE_H = 297;
const MX = 10;
const FONT = 'Arial, Helvetica, sans-serif';

/** Splits text into lines of about `chars` characters, at spaces. */
export function wrap(text: string, chars: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (line && line.length + word.length + 1 > chars) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

const t = (x: number, y: number, size: number, content: string, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" font-family="${FONT}" ${extra.includes('fill=') ? '' : 'fill="#0f172a"'} ${extra}>${xml(content)}</text>`;

/** One A4 page (an SVG in millimetres) with the court drawn to scale, every measurement, the marking plan, notes, sources and date. */
export function buildOverviewPage(variant: Variant, margin: Margin, text: SheetText): string {
  const { ui } = text;
  const [needLong, needShort] = spaceNeeded(variant, margin, 0);
  const diagonal = Math.hypot(variant.length, variant.width);
  const body = 3.1;
  const pitch = 4.3;

  // Text blocks first, so the drawing gets whatever height is left.
  const colChars = 52;
  const left: { text: string; bold?: boolean; head?: boolean }[] = [{ text: ui.facts, head: true }];
  for (const fact of variant.facts) {
    const label = wrap(text.facts[fact.id] ?? fact.id, colChars - 18);
    label.forEach((line, i) => left.push({ text: i === 0 ? `${line}` : line }));
    left.push({ text: `   ${formatLength(fact.m)}`, bold: true });
  }
  const right: { text: string; bold?: boolean; head?: boolean }[] = [{ text: ui.courtSize, head: true }, { text: `${formatLength(variant.length)} x ${formatLength(variant.width)}`, bold: true }, { text: ui.spaceNeeded, head: true }, { text: `${formatLength(needLong)} x ${formatLength(needShort)}`, bold: true }];
  wrap(text.margin, colChars).forEach((line) => right.push({ text: line }));
  if (!variant.round) {
    right.push({ text: ui.marking, head: true });
    right.push({ text: `${ui.diagonal}:` });
    right.push({ text: `   ${formatLength(diagonal)}`, bold: true });
    variant.marks.forEach((mark, i) => {
      wrap(`${i + 1}. ${text.marks[mark.id] ?? mark.id} (${mark.from === 'end' ? ui.fromEnd : ui.fromSide})`, colChars).forEach((line) => right.push({ text: line }));
      right.push({ text: `   ${formatLength(mark.m)}`, bold: true });
    });
  }
  const colLines = Math.max(left.length, right.length) + 2;

  const noteLines: string[] = [];
  text.notes.forEach((note) => wrap(note, 125).forEach((line, i) => noteLines.push(i === 0 ? `- ${line}` : `  ${line}`)));
  const sources = Array.from(new Set([...variant.sources, ...variant.margins.map((m) => m.source)])).map((id) => SOURCES[id]);
  const disclaimer = wrap(ui.disclaimer, 140);

  const textHeight = colLines * pitch + (noteLines.length + 2) * pitch + (sources.length + 2) * pitch + disclaimer.length * 3.6 + 8;
  const diagramTop = 30;
  const diagramHeight = Math.max(55, Math.min(105, PAGE_H - diagramTop - textHeight - 14));

  const diagram = buildDiagram(variant, margin, ui.clearCaption);
  const { x, y, w, h } = diagram.box;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}mm" height="${PAGE_H}mm" viewBox="0 0 ${PAGE_W} ${PAGE_H}">`;
  out += `<rect width="${PAGE_W}" height="${PAGE_H}" fill="#ffffff"/>`;
  out += t(MX, 15, 8, text.title, 'font-weight="700"');
  out += t(MX, 22, 4, text.version, 'fill="#475569"');
  out += `<path d="M${MX} 25.5H${PAGE_W - MX}" stroke="#cbd5e1" stroke-width="0.3"/>`;
  out += `<svg x="${MX}" y="${diagramTop}" width="${PAGE_W - 2 * MX}" height="${diagramHeight}" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid meet">${diagram.body}</svg>`;

  let cy = diagramTop + diagramHeight + 8;
  const draw = (lines: typeof left, x0: number, y0: number) => lines.forEach((line, i) => {
    out += t(x0, y0 + i * pitch, body, line.text, line.head ? 'font-weight="700" fill="#065f46"' : line.bold ? 'font-weight="700"' : '');
  });
  draw(left, MX, cy);
  draw(right, PAGE_W / 2 + 2, cy);
  cy += colLines * pitch;

  out += t(MX, cy, body, ui.notes, 'font-weight="700" fill="#065f46"');
  noteLines.forEach((line, i) => { out += t(MX, cy + (i + 1) * pitch, 2.9, line); });
  cy += (noteLines.length + 2) * pitch;

  out += t(MX, cy, body, ui.sources, 'font-weight="700" fill="#065f46"');
  sources.forEach((source, i) => { out += t(MX, cy + (i + 1) * pitch, 2.8, `${source.name} - ${source.url}`.slice(0, 150), 'fill="#334155"'); });
  cy += (sources.length + 1) * pitch;
  out += t(MX, cy, 2.8, `${ui.checked} ${CHECKED_ON}. ${ui.madeBy}`, 'fill="#475569"');
  cy += 5;
  disclaimer.forEach((line, i) => { out += t(MX, cy + i * 3.6, 2.6, line, 'fill="#64748b"'); });
  out += '</svg>';
  return out;
}

/** Puts markup just before the closing tag of the page (the last </svg>, since pages hold a nested drawing). */
const withEnd = (svg: string, markup: string): string => { const at = svg.lastIndexOf('</svg>'); return svg.slice(0, at) + markup + svg.slice(at); };

/** Page footer shown on every page. */
const footer = (page: number, pages: number, title: string) => t(MX, PAGE_H - 6, 2.6, `${title} - ${page} / ${pages}`, 'fill="#64748b"');

/** The set-out guide: a numbered drawing with both diagonals, then every line, circle, arc and spot with its exact position. Flows over as many A4 pages as it needs. */
export function buildSetOutPages(variant: Variant, margin: Margin, text: SheetText): string[] {
  const { ui, marking } = text;
  const [needLong, needShort] = spaceNeeded(variant, margin, 0);
  const steps = markingSteps(variant, marking, (id) => text.marks[id] ?? id, netPositions(variant));
  const diagram = buildDiagram(variant, margin, ui.clearCaption, { steps, diagonals: true, hideKeyPoints: true, annotate: { endA: ui.fromEndA, endB: ui.fromEndB, sideA: ui.fromSideA, sideB: ui.fromSideB } });
  const { x, y, w, h } = diagram.box;
  const pages: string[][] = [];
  let cur: string[] = [];
  let cy = 0;
  const startPage = (first: boolean) => {
    cur = [];
    pages.push(cur);
    cur.push(t(MX, 12, first ? 7 : 4.5, first ? marking.heading : `${text.title}: ${marking.heading}`, 'font-weight="700"'));
    if (first) cur.push(t(MX, 18, 3.6, `${text.title} - ${text.version}`, 'fill="#475569"'));
    cur.push(`<path d="M${MX} ${first ? 21 : 15}H${PAGE_W - MX}" stroke="#cbd5e1" stroke-width="0.3"/>`);
    cy = first ? 27 : 21;
  };
  const room = (height: number) => { if (cy + height > PAGE_H - 12) startPage(false); };
  const paragraph = (lines: string[], size: number, extra = '', indent = 0) => lines.forEach((line) => {
    room(pitch);
    cur.push(t(MX + indent, cy, size, line, extra));
    cy += pitch;
  });
  const pitch = 4.3;
  const body = 3.1;

  startPage(true);
  paragraph(wrap(marking.intro, 140), body);
  cy += 2;
  const diagH = Math.min(150, (PAGE_W - 2 * MX) * (h / w));
  room(diagH + 6);
  cur.push(`<svg x="${MX}" y="${cy}" width="${PAGE_W - 2 * MX}" height="${diagH}" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid meet">${diagram.body}</svg>`);
  cy += diagH + 2;
  paragraph(wrap(marking.setOutDiagram, 150), 2.7, 'fill="#475569"');
  cy += 3;

  room(pitch * 3);
  cur.push(t(MX, cy, 3.6, marking.prepTitle, 'font-weight="700" fill="#065f46"'));
  cy += pitch + 1;
  marking.prep.forEach((item) => paragraph(wrap(item, 134).map((line, i) => (i === 0 ? `- ${line}` : `  ${line}`)), body));
  cy += 3;

  for (const step of steps) {
    const wrapped = step.lines.map((line) => wrap(line, 130));
    const height = pitch * (1 + wrapped.reduce((n, lines) => n + lines.length, 0)) + 2.5;
    room(height);
    cur.push(`<circle cx="${MX + 2.4}" cy="${cy - 1}" r="2.4" fill="${step.prim ? '#b45309' : '#065f46'}"/>` + t(MX + 2.4, cy - 0.1, 2.9, String(step.n), 'font-weight="700" fill="#ffffff" text-anchor="middle"'));
    cur.push(t(MX + 7, cy, body, step.title, 'font-weight="700"'));
    cy += pitch;
    wrapped.forEach((lines) => lines.forEach((line) => { cur.push(t(MX + 7, cy, 2.9, line)); cy += pitch; }));
    cy += 2.5;
  }

  room(pitch * 4);
  cur.push(t(MX, cy, 3.6, marking.checkTitle, 'font-weight="700" fill="#065f46"'));
  cy += pitch + 1;
  marking.check.forEach((item) => paragraph(wrap(item.replace('{need}', `${formatLength(needLong)} x ${formatLength(needShort)}`).replace('{diag}', formatLength(Math.hypot(variant.length, variant.width))), 134).map((line, i) => (i === 0 ? `- ${line}` : `  ${line}`)), body));
  cy += 3;
  paragraph(wrap(ui.disclaimer, 140), 2.6, 'fill="#64748b"');

  return pages.map((items, i) => `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}mm" height="${PAGE_H}mm" viewBox="0 0 ${PAGE_W} ${PAGE_H}"><rect width="${PAGE_W}" height="${PAGE_H}" fill="#ffffff"/>${items.join('')}${footer(i + 2, pages.length + 1, text.title)}</svg>`);
}

/** Every page of the sheet: the overview, then the set-out guide. */
export function buildSheetPages(variant: Variant, margin: Margin, text: SheetText): string[] {
  const overview = buildOverviewPage(variant, margin, text);
  const setOut = buildSetOutPages(variant, margin, text);
  const total = setOut.length + 1;
  return [withEnd(overview, footer(1, total, text.title)), ...setOut];
}

const A4_RATIO = PAGE_H / PAGE_W;

/** Draws one page on a canvas of the given pixel width. */
async function drawPage(svg: string, width: number): Promise<HTMLCanvasElement> {
  const height = Math.round(width * A4_RATIO);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    image.width = width;
    image.height = height;
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('The picture could not be drawn.')); image.src = url; });
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const toBlob = (canvas: HTMLCanvasElement): Promise<Blob> => new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the picture.'))), 'image/png'));

/** Largest canvas area phones allow is about 16 million pixels; stay under it. */
const MAX_PIXELS = 14_000_000;

/** All pages stacked into one tall PNG, so a single saved image holds the whole sheet. */
export async function pagesToPng(svgs: string[]): Promise<Blob> {
  const width = Math.min(1654, Math.floor(Math.sqrt(MAX_PIXELS / (svgs.length * A4_RATIO))));
  const pageHeight = Math.round(width * A4_RATIO);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = pageHeight * svgs.length;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available.');
  for (let i = 0; i < svgs.length; i += 1) ctx.drawImage(await drawPage(svgs[i], width), 0, i * pageHeight);
  return toBlob(canvas);
}

/** One A4 page per sheet page. */
export async function pagesToPdf(svgs: string[], title: string): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  const pt = 72 / 25.4;
  for (const svg of svgs) {
    const png = await toBlob(await drawPage(svg, 1654));
    const image = await doc.embedPng(new Uint8Array(await png.arrayBuffer()));
    doc.addPage([PAGE_W * pt, PAGE_H * pt]).drawImage(image, { x: 0, y: 0, width: PAGE_W * pt, height: PAGE_H * pt });
  }
  doc.setTitle(title);
  doc.setCreator('MyDailyUtils');
  return doc.save();
}
