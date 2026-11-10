import type { Margin, Variant } from './courtData';
import { CHECKED_ON, SOURCES } from './courtData';
import { buildDiagram, xml } from './diagram';
import { spaceNeeded } from './fit';
import { formatLength } from './units';

/** Words for one court's sheet, taken from the locale file by the page. */
export interface SheetText {
  title: string; version: string;
  ui: Record<string, string>;
  facts: Record<string, string>; marks: Record<string, string>; margin: string; notes: string[];
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
export function buildSheet(variant: Variant, margin: Margin, text: SheetText): string {
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

/** Draws the sheet on a canvas (A4 at 200 dpi) and returns it as a PNG. */
export async function sheetToPng(svg: string): Promise<Blob> {
  const width = 1654;
  const height = 2339;
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
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Could not encode the picture.');
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** The PNG page placed on one A4 page of a PDF. */
export async function pngToPdf(png: Blob, title: string): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  const image = await doc.embedPng(new Uint8Array(await png.arrayBuffer()));
  const pt = 72 / 25.4;
  doc.addPage([PAGE_W * pt, PAGE_H * pt]).drawImage(image, { x: 0, y: 0, width: PAGE_W * pt, height: PAGE_H * pt });
  doc.setTitle(title);
  doc.setCreator('MyDailyUtils');
  return doc.save();
}
