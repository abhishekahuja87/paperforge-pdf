/** Drawing report cards and the rank list on canvases. A page is 1240 by 1754 (150 dots an inch, A4 upright). */
import { round1, type Student } from './marks';

export const PAGE = { width: 1240, height: 1754, points: [595.28, 841.89] as [number, number] };
const SANS = 'Poppins, "Segoe UI", system-ui, "Noto Sans", "Noto Sans Devanagari", sans-serif';

export interface CardOptions {
  school: string;
  exam: string;
  classLabel: string;
  subjects: string[];
  max: number[];
  gradesOnly: boolean;
  showPass: boolean;
  showRank: boolean;
  total: number;
  /** How many students are in the class, for "rank 3 of 40". */
  count: number;
  /** The grade for a percentage, using the person's own bands. */
  gradeOf: (percent: number) => string;
  labels: CardLabels;
}
export interface CardLabels {
  reportCard: string; student: string; roll: string; classWord: string; subject: string; marks: string; outOf: string; grade: string; totalWord: string; percentage: string; rank: string; rankOf: string; result: string; pass: string; fail: string; absent: string;
  remarks: string; teacher: string; principal: string; parent: string; rankList: string; summary: string; average: string; highest: string; passed: string; name: string;
}

function fit(ctx: CanvasRenderingContext2D, text: string, width: number): string {
  if (ctx.measureText(text).width <= width) return text;
  let out = text; while (out.length > 1 && ctx.measureText(`${out}…`).width > width) out = out.slice(0, -1); return `${out}…`;
}

export function newPage(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas'); canvas.width = PAGE.width; canvas.height = PAGE.height;
  const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, PAGE.width, PAGE.height); ctx.textBaseline = 'alphabetic';
  return { canvas, ctx };
}

function header(ctx: CanvasRenderingContext2D, o: CardOptions, title: string): number {
  const W = PAGE.width;
  ctx.strokeStyle = '#111827'; ctx.lineWidth = 4; ctx.strokeRect(50, 50, W - 100, PAGE.height - 100);
  ctx.textAlign = 'center'; ctx.fillStyle = '#111827'; ctx.font = `700 52px ${SANS}`; ctx.fillText(fit(ctx, o.school || ' ', W - 220), W / 2, 150);
  ctx.fillStyle = '#374151'; ctx.font = `500 32px ${SANS}`; ctx.fillText(fit(ctx, o.exam || ' ', W - 220), W / 2, 205);
  ctx.fillStyle = '#ea580c'; ctx.fillRect(W / 2 - 160, 232, 320, 6);
  ctx.fillStyle = '#111827'; ctx.font = `700 40px ${SANS}`; ctx.fillText(title.toUpperCase(), W / 2, 305); ctx.textAlign = 'left';
  return 350;
}

/** One student's report card. */
export function drawCard(student: Student, o: CardOptions): HTMLCanvasElement {
  const { canvas, ctx } = newPage(), W = PAGE.width, L = o.labels, left = 100, right = W - 100;
  let y = header(ctx, o, L.reportCard);
  ctx.fillStyle = '#111827'; ctx.font = `600 34px ${SANS}`;
  ctx.fillText(`${L.student}: ${fit(ctx, student.name, 560)}`, left, y + 40);
  ctx.textAlign = 'right'; ctx.fillText(student.roll ? `${L.roll}: ${student.roll}` : '', right, y + 40); ctx.textAlign = 'left';
  if (o.classLabel.trim()) { ctx.fillStyle = '#374151'; ctx.font = `500 30px ${SANS}`; ctx.fillText(`${L.classWord}: ${o.classLabel.trim()}`, left, y + 88); }
  y += 130;
  const cols = o.gradesOnly ? [left, right - 160] : [left, right - 560, right - 360, right - 160], rowH = 62;
  ctx.fillStyle = '#111827'; ctx.fillRect(left, y, right - left, rowH);
  ctx.fillStyle = '#ffffff'; ctx.font = `600 28px ${SANS}`;
  const heads = o.gradesOnly ? [L.subject, L.grade] : [L.subject, L.marks, L.outOf, L.grade];
  heads.forEach((text, n) => { ctx.fillText(text, cols[n]! + 18, y + 42); });
  y += rowH;
  o.subjects.forEach((subject, n) => {
    const mark = student.marks[n] ?? null, max = o.max[n] ?? 100;
    ctx.fillStyle = n % 2 === 0 ? '#f9fafb' : '#ffffff'; ctx.fillRect(left, y, right - left, rowH);
    ctx.fillStyle = '#111827'; ctx.font = `500 30px ${SANS}`; ctx.fillText(fit(ctx, subject, (o.gradesOnly ? right - 160 : cols[1]!) - left - 40), left + 18, y + 42);
    const failed = o.showPass && student.failed.includes(subject);
    const pct = mark === null ? 0 : (mark / (max || 1)) * 100;
    if (!o.gradesOnly) {
      ctx.fillStyle = failed ? '#b91c1c' : '#111827'; ctx.fillText(mark === null ? L.absent : round1(mark), cols[1]! + 18, y + 42);
      ctx.fillStyle = '#111827'; ctx.fillText(round1(max), cols[2]! + 18, y + 42);
    }
    const gradeCell = o.gradesOnly ? cols[1]! : cols[3]!;
    ctx.fillStyle = failed ? '#b91c1c' : '#111827'; ctx.fillText(mark === null ? (o.gradesOnly ? L.absent : '') : o.gradeOf(pct), gradeCell + 18, y + 42);
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(left, y + rowH); ctx.lineTo(right, y + rowH); ctx.stroke();
    y += rowH;
  });
  if (!o.gradesOnly) {
    ctx.fillStyle = '#fff7ed'; ctx.fillRect(left, y, right - left, rowH + 4); ctx.fillStyle = '#111827'; ctx.font = `700 30px ${SANS}`;
    ctx.fillText(L.totalWord, left + 18, y + 44); ctx.fillText(round1(student.total), cols[1]! + 18, y + 44); ctx.fillText(round1(o.total), cols[2]! + 18, y + 44); ctx.fillText(student.grade, cols[3]! + 18, y + 44);
    y += rowH + 4;
  }
  y += 40;
  const box = (x: number, w: number, label: string, value: string, color = '#111827') => {
    ctx.fillStyle = '#f3f4f6'; ctx.beginPath(); ctx.roundRect?.(x, y, w, 130, 16); if (!ctx.roundRect) ctx.rect(x, y, w, 130); ctx.fill();
    ctx.fillStyle = '#6b7280'; ctx.font = `500 24px ${SANS}`; ctx.fillText(label, x + 22, y + 40); ctx.fillStyle = color; ctx.font = `700 44px ${SANS}`; ctx.fillText(fit(ctx, value, w - 44), x + 22, y + 100);
  };
  const items: [string, string, string?][] = [[L.percentage, `${round1(student.percent)}%`], [L.grade, student.grade || '-']];
  if (o.showRank) items.push([L.rank, L.rankOf.replace('{rank}', String(student.rank)).replace('{n}', String(o.count))]);
  if (o.showPass) items.push([L.result, student.failed.length === 0 ? L.pass : L.fail, student.failed.length === 0 ? '#15803d' : '#b91c1c']);
  const gap = 20, bw = (right - left - gap * (items.length - 1)) / items.length;
  items.forEach(([label, value, color], n) => box(left + n * (bw + gap), bw, label, value, color));
  y += 130 + 50;
  ctx.fillStyle = '#374151'; ctx.font = `500 30px ${SANS}`; ctx.fillText(`${L.remarks}: ${student.remark}`, left, y);
  ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 2; for (let n = 1; n <= 2; n += 1) { ctx.beginPath(); ctx.moveTo(left, y + n * 56); ctx.lineTo(right, y + n * 56); ctx.stroke(); }
  const base = PAGE.height - 190, slot = (right - left) / 3;
  [L.teacher, L.principal, L.parent].forEach((text, n) => {
    const cx = left + slot * n + slot / 2; ctx.strokeStyle = '#111827'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 140, base); ctx.lineTo(cx + 140, base); ctx.stroke();
    ctx.fillStyle = '#374151'; ctx.font = `500 26px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText(text, cx, base + 40); ctx.textAlign = 'left';
  });
  return canvas;
}

export interface RankPageOptions extends CardOptions { students: Student[] }
export const RANK_ROWS_FIRST = 24, RANK_ROWS = 30;
export const rankPageCount = (n: number) => (n <= RANK_ROWS_FIRST ? 1 : 1 + Math.ceil((n - RANK_ROWS_FIRST) / RANK_ROWS));

/** One page of the rank list. */
export function drawRankPage(page: number, o: RankPageOptions): HTMLCanvasElement {
  const { canvas, ctx } = newPage(), W = PAGE.width, L = o.labels, left = 100, right = W - 100;
  let y = header(ctx, o, L.rankList);
  const sorted = [...o.students].sort((a, b) => a.rank - b.rank || 0);
  if (page === 0) {
    const average = sorted.reduce((sum, s) => sum + s.percent, 0) / Math.max(1, sorted.length), passed = sorted.filter((s) => s.failed.length === 0).length;
    ctx.fillStyle = '#374151'; ctx.font = `500 28px ${SANS}`;
    const bits = [`${L.classWord}: ${o.classLabel.trim() || '-'}`, `${L.average}: ${round1(average)}%`, `${L.highest}: ${round1(sorted[0]?.percent ?? 0)}%`];
    if (o.showPass) bits.push(`${L.passed}: ${passed}/${sorted.length}`);
    ctx.fillText(bits.join('    '), left, y + 20); y += 60;
  }
  const from = page === 0 ? 0 : RANK_ROWS_FIRST + (page - 1) * RANK_ROWS, count = page === 0 ? RANK_ROWS_FIRST : RANK_ROWS;
  const cols = [left, left + 110, right - 560, right - 410, right - 260], rowH = 52;
  ctx.fillStyle = '#111827'; ctx.fillRect(left, y, right - left, rowH); ctx.fillStyle = '#ffffff'; ctx.font = `600 26px ${SANS}`;
  [L.rank, L.name, L.roll, L.totalWord, `${L.percentage}`].forEach((text, n) => ctx.fillText(text, cols[n]! + 14, y + 36)); y += rowH;
  sorted.slice(from, from + count).forEach((s, n) => {
    ctx.fillStyle = n % 2 === 0 ? '#f9fafb' : '#ffffff'; ctx.fillRect(left, y, right - left, rowH);
    ctx.fillStyle = '#111827'; ctx.font = `600 27px ${SANS}`; ctx.fillText(String(s.rank), cols[0]! + 14, y + 36);
    ctx.font = `500 27px ${SANS}`; ctx.fillText(fit(ctx, s.name, cols[2]! - cols[1]! - 30), cols[1]! + 14, y + 36); ctx.fillText(fit(ctx, s.roll, 130), cols[2]! + 14, y + 36);
    ctx.fillText(round1(s.total), cols[3]! + 14, y + 36); ctx.fillText(`${round1(s.percent)}%  ${s.grade}`, cols[4]! + 14, y + 36); y += rowH;
  });
  return canvas;
}
