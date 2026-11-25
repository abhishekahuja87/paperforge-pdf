/** Drawing the answer sheet that the tool prints, and the made-up filled sheet used for the sample. */
import { BIG_MARKER, BUBBLE_R, LETTERS, MARKERS, PAGE_MM, type SheetLayout } from './layout';
import { canvasesToPdf } from '../pdf/pagesPdf';

const SANS = 'Poppins, "Segoe UI", system-ui, "Noto Sans", "Noto Sans Devanagari", sans-serif';
export interface SheetText { title: string; exam: string; labels: { name: string; className: string; date: string; roll: string; rollHint: string; instructions: string } }
/** Marks to draw for a filled sample: for each question the option numbers that are filled (none, one, or two for a double mark), and the roll number. */
export interface SheetFill { answers: number[][]; roll: string }
export const PX_PER_MM = 6;

/** One A4 sheet as a canvas. */
export function drawSheet(layout: SheetLayout, text: SheetText, fill?: SheetFill, scale = PX_PER_MM): HTMLCanvasElement {
  const canvas = document.createElement('canvas'); canvas.width = Math.round(PAGE_MM.width * scale); canvas.height = Math.round(PAGE_MM.height * scale);
  const ctx = canvas.getContext('2d')!, mm = (v: number) => v * scale;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  MARKERS.forEach((m) => ctx.fillRect(mm(m.x - m.size / 2), mm(m.y - m.size / 2), mm(m.size), mm(m.size)));
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center'; ctx.fillStyle = '#111827';
  ctx.font = `700 ${mm(6.5)}px ${SANS}`; ctx.fillText(text.title, mm(105), mm(24));
  ctx.fillStyle = '#374151'; ctx.font = `500 ${mm(4)}px ${SANS}`; ctx.fillText(text.exam, mm(105), mm(31));
  ctx.textAlign = 'left'; ctx.fillStyle = '#111827'; ctx.font = `500 ${mm(3.6)}px ${SANS}`; ctx.strokeStyle = '#111827'; ctx.lineWidth = Math.max(1, mm(0.25));
  [[text.labels.name, 46], [text.labels.className, 62], [text.labels.date, 78]].forEach(([label, y]) => {
    ctx.fillText(String(label), mm(16), mm(Number(y))); ctx.beginPath(); ctx.moveTo(mm(16), mm(Number(y) + 3)); ctx.lineTo(mm(104), mm(Number(y) + 3)); ctx.stroke();
  });
  ctx.fillStyle = '#4b5563'; ctx.font = `400 ${mm(2.9)}px ${SANS}`;
  wrap(ctx, text.labels.instructions, mm(88)).forEach((line, n) => ctx.fillText(line, mm(16), mm(92 + n * 4.2)));
  // Roll number grid.
  ctx.fillStyle = '#111827'; ctx.font = `600 ${mm(3.4)}px ${SANS}`; ctx.textAlign = 'center';
  const rollLeft = layout.rollDigits[0]![0]!.x, rollRight = layout.rollDigits[layout.digits - 1]![0]!.x;
  ctx.fillText(text.labels.roll, mm((rollLeft + rollRight) / 2), mm(46));
  ctx.strokeStyle = '#111827';
  layout.rollBoxes.forEach((box, d) => {
    ctx.strokeRect(mm(box.x - 3.4), mm(box.y - 3.6), mm(6.8), mm(7.2));
    if (fill?.roll[d]) { ctx.font = `600 ${mm(4.6)}px ${SANS}`; ctx.fillText(fill.roll[d]!, mm(box.x), mm(box.y + 1.6)); }
  });
  ctx.fillStyle = '#4b5563'; ctx.font = `500 ${mm(2.6)}px ${SANS}`; ctx.textAlign = 'right';
  for (let n = 0; n < 10; n += 1) ctx.fillText(String(n), mm(rollLeft - 4.6), mm(layout.rollDigits[0]![n]!.y + 0.9));
  ctx.textAlign = 'center';
  layout.rollDigits.forEach((column, d) => column.forEach((b, n) => { ring(ctx, b.x, b.y, scale); if (fill?.roll[d] === String(n)) disc(ctx, b.x, b.y, scale, 0.98); }));
  // Answers.
  ctx.fillStyle = '#111827'; ctx.font = `600 ${mm(3.2)}px ${SANS}`;
  layout.columnHeads.forEach((heads) => heads.forEach((h, o) => ctx.fillText(LETTERS[o]!, mm(h.x), mm(h.y))));
  ctx.textAlign = 'right'; ctx.fillStyle = '#374151'; ctx.font = `500 ${mm(3.2)}px ${SANS}`;
  layout.labels.forEach((l) => ctx.fillText(String(l.number), mm(l.x + 3), mm(l.y + 1.1)));
  layout.answers.forEach((row, q) => row.forEach((b, o) => { ring(ctx, b.x, b.y, scale); if (fill?.answers[q]?.includes(o)) disc(ctx, b.x, b.y, scale, 0.95 + ((q * 7 + o * 3) % 5) * 0.03); }));
  ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'center'; ctx.font = `400 ${mm(2.4)}px ${SANS}`; ctx.fillText('Fill one circle for each question. Please do not fold this sheet.', mm(105), mm(292.4));
  void BIG_MARKER; return canvas;
}

function ring(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.strokeStyle = '#111827'; ctx.lineWidth = Math.max(1, 0.3 * scale); ctx.beginPath(); ctx.arc(x * scale, y * scale, BUBBLE_R * scale, 0, Math.PI * 2); ctx.stroke();
}
function disc(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, size: number) {
  ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.arc(x * scale, y * scale, BUBBLE_R * scale * size, 0, Math.PI * 2); ctx.fill();
}
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = []; let line = '';
  for (const word of text.split(/\s+/)) { const next = line ? `${line} ${word}` : word; if (line && ctx.measureText(next).width > width) { lines.push(line); line = word; } else line = next; }
  if (line) lines.push(line); return lines;
}

/** The blank sheet as a PDF, once or several times. */
export function makeSheetPdf(layout: SheetLayout, text: SheetText, copies: number, onProgress: (done: number) => void, cancelled: () => boolean): Promise<Blob | null> {
  return canvasesToPdf(copies, () => drawSheet(layout, text), [595.28, 841.89], text.title, onProgress, cancelled, 0.92);
}
