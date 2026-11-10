import type { Margin, Variant } from './courtData';
import { CHECKED_ON, SOURCES } from './courtData';
import { labelNames } from './annotate';
import { buildDiagram, xml } from './diagram';
import { spaceNeeded } from './fit';
import { markingSteps, netPositions, type MarkingText } from './marking';
import { formatLength } from './units';

/** Words for one court's sheet, taken from the locale file by the page. */
export interface SheetText {
  title: string; version: string;
  ui: Record<string, string>;
  facts: Record<string, string>; marks: Record<string, string>; margin: string; notes: string[];
  parts: Record<string, string>;
  refs?: { net?: string };
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

const LAND_W = 297;
const LAND_H = 210;

/** Page 1, landscape: the court drawn to scale with the name and measurement of everything written on it. */
export function buildDrawingPage(variant: Variant, margin: Margin, text: SheetText): string {
  const { ui } = text;
  const diagram = buildDiagram(variant, margin, ui.clearCaption, { annotate: { captions: { endA: ui.fromEndA, endB: ui.fromEndB, sideA: ui.fromSideA, sideB: ui.fromSideB }, names: labelNames(text.marks, text.parts, ui, text.refs) } });
  const { x, y, w, h } = diagram.box;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${LAND_W}mm" height="${LAND_H}mm" viewBox="0 0 ${LAND_W} ${LAND_H}">`;
  out += `<rect width="${LAND_W}" height="${LAND_H}" fill="#ffffff"/>`;
  out += t(MX, 11, 7, text.title, 'font-weight="700"');
  out += t(MX, 17, 3.6, `${text.version} - ${ui.drawingNote.split('.')[0]}.`, 'fill="#475569"');
  out += `<svg x="${MX}" y="20" width="${LAND_W - 2 * MX}" height="${LAND_H - 20 - 10}" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid meet">${diagram.body}</svg>`;
  out += '</svg>';
  return out;
}

/** Page 2: sizes in words, notes and risks, sources and the date they were checked. */
export function buildNotesPage(variant: Variant, margin: Margin, text: SheetText): string {
  const { ui } = text;
  const [needLong, needShort] = spaceNeeded(variant, margin, 0);
  const pitch = 4.6;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}mm" height="${PAGE_H}mm" viewBox="0 0 ${PAGE_W} ${PAGE_H}"><rect width="${PAGE_W}" height="${PAGE_H}" fill="#ffffff"/>`;
  out += t(MX, 15, 8, text.title, 'font-weight="700"');
  out += t(MX, 22, 4, text.version, 'fill="#475569"');
  out += `<path d="M${MX} 25.5H${PAGE_W - MX}" stroke="#cbd5e1" stroke-width="0.3"/>`;
  let cy = 35;
  const block = (lines: string[], size: number, extra = '') => lines.forEach((line) => { out += t(MX, cy, size, line, extra); cy += pitch; });
  block([`${ui.courtSize}: ${formatLength(variant.length)} x ${formatLength(variant.width)}`, `${ui.spaceNeeded}: ${formatLength(needLong)} x ${formatLength(needShort)}`], 3.4, 'font-weight="700"');
  block(wrap(text.margin, 120), 3.2);
  if (!variant.round) block([`${ui.diagonal}: ${formatLength(Math.hypot(variant.length, variant.width))}`], 3.2);
  cy += 4;
  out += t(MX, cy, 3.6, ui.notes, 'font-weight="700" fill="#065f46"');
  cy += pitch + 1;
  text.notes.forEach((note) => block(wrap(note, 120).map((line, i) => (i === 0 ? `- ${line}` : `  ${line}`)), 3.2));
  cy += 4;
  out += t(MX, cy, 3.6, ui.sources, 'font-weight="700" fill="#065f46"');
  cy += pitch + 1;
  const sources = Array.from(new Set([...variant.sources, ...variant.margins.map((m) => m.source)])).map((id) => SOURCES[id]);
  sources.forEach((source) => { out += t(MX, cy, 2.9, `${source.name} - ${source.url}`.slice(0, 150), 'fill="#334155"'); cy += pitch; });
  out += t(MX, cy, 2.9, `${ui.checked} ${CHECKED_ON}. ${ui.madeBy}`, 'fill="#475569"');
  cy += pitch + 3;
  block(wrap(ui.disclaimer, 140), 2.7, 'fill="#64748b"');
  out += '</svg>';
  return out;
}

/** Puts markup just before the closing tag of the page (the last </svg>, since pages hold a nested drawing). */
const withEnd = (svg: string, markup: string): string => { const at = svg.lastIndexOf('</svg>'); return svg.slice(0, at) + markup + svg.slice(at); };

/** Page footer shown on every page. */
const footer = (page: number, pages: number, title: string) => t(MX, page === 1 ? LAND_H - 4 : PAGE_H - 6, 2.6, `${title} - ${page} / ${pages}`, 'fill="#64748b"');

/** The set-out guide: a numbered drawing with both diagonals, then every line, circle, arc and spot with its exact position. Flows over as many A4 pages as it needs. */
export function buildSetOutPages(variant: Variant, margin: Margin, text: SheetText): string[] {
  const { ui, marking } = text;
  const [needLong, needShort] = spaceNeeded(variant, margin, 0);
  const steps = markingSteps(variant, marking, (id) => text.marks[id] ?? id, netPositions(variant));
  const diagram = buildDiagram(variant, margin, ui.clearCaption, { steps, diagonals: true, hideKeyPoints: true, annotate: { captions: { endA: ui.fromEndA, endB: ui.fromEndB, sideA: ui.fromSideA, sideB: ui.fromSideB } } });
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

  return pages.map((items) => `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}mm" height="${PAGE_H}mm" viewBox="0 0 ${PAGE_W} ${PAGE_H}"><rect width="${PAGE_W}" height="${PAGE_H}" fill="#ffffff"/>${items.join('')}</svg>`);
}

/** Every page of the sheet: the labelled drawing, the notes, then the set-out guide. */
export function buildSheetPages(variant: Variant, margin: Margin, text: SheetText): string[] {
  const all = [buildDrawingPage(variant, margin, text), buildNotesPage(variant, margin, text), ...buildSetOutPages(variant, margin, text)];
  return all.map((svg, i) => withEnd(svg, footer(i + 1, all.length, text.title)));
}

/** Size of a page in millimetres, read from its SVG. */
const pageSize = (svg: string): { w: number; h: number } => {
  const match = /width="([\d.]+)mm" height="([\d.]+)mm"/.exec(svg);
  return match ? { w: Number(match[1]), h: Number(match[2]) } : { w: PAGE_W, h: PAGE_H };
};

/** Draws one page on a canvas at `ppm` pixels per millimetre. */
async function drawPage(svg: string, ppm: number): Promise<HTMLCanvasElement> {
  const size = pageSize(svg);
  const width = Math.round(size.w * ppm);
  const height = Math.round(size.h * ppm);
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
  const sizes = svgs.map(pageSize);
  const widthMm = Math.max(...sizes.map((size) => size.w));
  const heightMm = sizes.reduce((sum, size) => sum + size.h, 0);
  const ppm = Math.min(8, Math.sqrt(MAX_PIXELS / (widthMm * heightMm)));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(widthMm * ppm);
  canvas.height = Math.round(heightMm * ppm);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let top = 0;
  for (let i = 0; i < svgs.length; i += 1) {
    const page = await drawPage(svgs[i], ppm);
    ctx.drawImage(page, Math.round((canvas.width - page.width) / 2), top);
    top += page.height;
  }
  return toBlob(canvas);
}

/** One PDF page per sheet page, each at its own size (the drawing is landscape). */
export async function pagesToPdf(svgs: string[], title: string): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  const pt = 72 / 25.4;
  for (const svg of svgs) {
    const size = pageSize(svg);
    const png = await toBlob(await drawPage(svg, 8));
    const image = await doc.embedPng(new Uint8Array(await png.arrayBuffer()));
    doc.addPage([size.w * pt, size.h * pt]).drawImage(image, { x: 0, y: 0, width: size.w * pt, height: size.h * pt });
  }
  doc.setTitle(title);
  doc.setCreator('MyDailyUtils');
  return doc.save();
}
