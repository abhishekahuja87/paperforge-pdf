/**
 * Laying a chat out on pages and drawing them. Pages are drawn on a canvas, so Hindi, other scripts and emoji come out exactly as the device shows them.
 * Sizes are in "units" where a page is always 1000 units wide, so the same layout is used for the preview and for the full size pages.
 */
import { maskNumbers, type ChatMessage, type Summary } from './parse';

export type StyleId = 'bubbles' | 'plain';
export type SizeId = 'small' | 'medium' | 'large';
export type PaperId = 'a4' | 'letter';

export interface Look { style: StyleId; size: SizeId; paper: PaperId; times: boolean; pageNumbers: boolean; hideNumbers: boolean; summary: boolean }
export interface Photo { source: CanvasImageSource; width: number; height: number }

export interface Labels {
  media: string; mediaWithName: string; deleted: string; page: string;
  summaryTitle: string; messages: string; days: string; busiest: string; people: string; range: string;
}

type Op =
  | { t: 'date'; y: number; h: number; text: string }
  | { t: 'system'; y: number; h: number; lines: string[] }
  | { t: 'bubble'; y: number; h: number; right: boolean; w: number; name: string; color: string; lines: string[]; time: string; photo: Photo | null; photoW: number; photoH: number; italic: boolean; last: boolean; mine: boolean }
  | { t: 'plain'; y: number; h: number; time: string; name: string; color: string; nameW: number; lines: string[]; italic: boolean; first: boolean };

export interface Page { ops: Op[]; summary: boolean; heading: boolean }
export interface Built { tooLong: boolean; pages: Page[]; width: number; height: number; title: string; look: Look; labels: Labels; summary: Summary; rangeText: string }

export const PAGE_WIDTH = 1000;
export const RATIO: Record<PaperId, number> = { a4: 297 / 210, letter: 11 / 8.5 };
const FONT = '"Segoe UI", system-ui, -apple-system, "Noto Sans", "Noto Sans Devanagari", "Nirmala UI", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
const BASE: Record<SizeId, number> = { small: 16, medium: 19, large: 23 };
const COLORS = ['#c2410c', '#7e22ce', '#be185d', '#0f766e', '#a16207', '#4d7c0f', '#b91c1c', '#6d28d9'];
const MARGIN = 56, TOP = 64, BOTTOM = 70;

const font = (size: number, weight = 400, italic = false) => `${italic ? 'italic ' : ''}${weight} ${size}px ${FONT}`;
const pad2 = (n: number) => String(n).padStart(2, '0');

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24, m = minutes % 60;
  return `${h % 12 || 12}:${pad2(m)} ${h < 12 ? 'am' : 'pm'}`;
}
export function formatDay(day: string, long = true): string {
  const [y, m, d] = day.split('-').map(Number);
  if (!y || !m || !d) return day;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, long ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'short', year: 'numeric' });
}

let measuring: CanvasRenderingContext2D | null = null;
const measurer = () => { if (!measuring) measuring = document.createElement('canvas').getContext('2d')!; return measuring; };

const pieces = (text: string): string[] => {
  const Seg = (Intl as unknown as { Segmenter?: new (locale?: string, options?: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter;
  return Seg ? [...new Seg(undefined, { granularity: 'grapheme' }).segment(text)].map((part) => part.segment) : Array.from(text);
};

/** Breaks text into lines no wider than `width`. The first line may start `offset` units in. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, offset = 0): string[] {
  const out: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (paragraph.trim() === '') { out.push(''); continue; }
    let line = '';
    const limit = () => (out.length === 0 ? width - offset : width);
    for (const word of paragraph.split(' ')) {
      const attempt = line === '' ? word : `${line} ${word}`;
      if (ctx.measureText(attempt).width <= limit()) { line = attempt; continue; }
      if (line !== '') { out.push(line); line = ''; }
      if (ctx.measureText(word).width <= limit()) { line = word; continue; }
      for (const part of pieces(word)) {
        if (line !== '' && ctx.measureText(line + part).width > limit()) { out.push(line); line = ''; }
        line += part;
      }
    }
    out.push(line);
  }
  return out;
}

export interface BuildInput {
  messages: ChatMessage[];
  summary: Summary;
  title: string;
  senders: string[];
  /** The person whose messages sit on the right in the bubble style. */
  me: string | null;
  look: Look;
  labels: Labels;
  photos: Map<string, Photo>;
  /** Stop laying out once this many pages are needed, so a huge chat does not freeze the page. */
  stopAt: number;
}

/** Works out which message goes on which page. */
export function buildPages(input: BuildInput): Built {
  const { messages, look, labels, photos } = input;
  const ctx = measurer();
  const B = BASE[look.size];
  const width = PAGE_WIDTH, height = Math.round(PAGE_WIDTH * RATIO[look.paper]);
  const bottom = height - BOTTOM;
  const lineH = Math.round(B * 1.38);
  const show = (name: string) => (look.hideNumbers ? maskNumbers(name) : name);
  const body = (text: string) => (look.hideNumbers ? maskNumbers(text) : text);
  const group = input.senders.length > 2;
  const colorOf = (name: string) => COLORS[Math.max(0, input.senders.indexOf(name)) % COLORS.length]!;
  const rangeText = input.summary.first ? labels.range.replace('{from}', formatDay(input.summary.first, false)).replace('{to}', formatDay(input.summary.last, false)) : '';

  const pages: Page[] = [];
  let page: Page = { ops: [], summary: false, heading: false };
  let y = TOP;
  const fresh = () => { page = { ops: [], summary: false, heading: false }; pages.push(page); y = TOP; };
  if (look.summary) { pages.push({ ops: [], summary: true, heading: false }); fresh(); }
  else { pages.push(page); page.heading = true; y = TOP + 110; }

  const maxBubble = Math.round((width - MARGIN * 2) * 0.74);
  const padX = Math.round(B * 0.75), padY = Math.round(B * 0.5);
  const nameH = Math.round(B * 1.2), timeH = Math.round(B * 1.1);
  const timeWidthPlain = Math.round(B * 4.9);
  let previous: ChatMessage | null = null;

  let tooLong = false;
  for (const message of messages) {
    if (pages.length > input.stopAt) { tooLong = true; break; }
    if (!previous || previous.day !== message.day) {
      if (y + lineH * 5 > bottom) fresh();
      ctx.font = font(B * 0.95, 600);
      const h = Math.round(B * 2.2);
      page.ops.push({ t: 'date', y: y + Math.round(B * 0.6), h, text: formatDay(message.day) });
      y += h + Math.round(B * 1.1);
    }
    const sameRun = previous && previous.day === message.day && previous.sender === message.sender && previous.kind !== 'system';
    const gap = sameRun ? Math.round(B * 0.35) : Math.round(B * 0.8);

    if (message.kind === 'system') {
      ctx.font = font(B * 0.82, 400, true);
      const lines = wrap(ctx, body(message.text), width - MARGIN * 2 - 80);
      const h = lines.length * Math.round(B * 1.2) + Math.round(B * 0.8);
      if (y + h + gap > bottom) fresh();
      page.ops.push({ t: 'system', y: y + gap, h, lines });
      y += h + gap; previous = message; continue;
    }

    const name = show(message.sender ?? '');
    const mine = look.style === 'bubbles' && input.me !== null && message.sender === input.me;
    const color = colorOf(message.sender ?? '');
    const showName = look.style === 'plain' || (group && !mine);
    let text = message.kind === 'deleted' ? labels.deleted : message.kind === 'media' ? '' : body(message.text);
    const italic = message.kind === 'deleted';
    const photo = look.style === 'bubbles' && message.kind === 'media' && message.file ? photos.get(message.file) ?? null : null;
    if (message.kind === 'media') {
      const note = photo ? '' : message.file ? labels.mediaWithName.replace('{name}', message.file) : labels.media;
      text = [note, body(message.text)].filter(Boolean).join('\n');
    }
    const time = look.times ? formatTime(message.minutes) : '';

    if (look.style === 'bubbles') {
      ctx.font = font(B);
      const inner = maxBubble - padX * 2;
      const lines = text === '' ? [] : wrap(ctx, text, inner);
      const widest = lines.reduce((max, line) => Math.max(max, ctx.measureText(line).width), 0);
      ctx.font = font(B * 0.85, 700);
      const nameWidth = showName ? ctx.measureText(name).width : 0;
      ctx.font = font(B * 0.7);
      const timeWidth = time ? ctx.measureText(time).width + 4 : 0;
      let photoW = 0, photoH = 0;
      if (photo) { photoW = Math.min(inner, 420); photoH = Math.round(photoW * photo.height / photo.width); if (photoH > 520) { photoH = 520; photoW = Math.round(photoH * photo.width / photo.height); } }
      const contentW = Math.max(widest, nameWidth, timeWidth + 8, photoW);
      const w = Math.min(maxBubble, Math.ceil(contentW) + padX * 2);
      let remaining = lines.slice(); let first = true;
      for (;;) {
        const top = (first && showName ? nameH : 0) + (first && photo ? photoH + Math.round(B * 0.3) : 0);
        const need = padY * 2 + top + remaining.length * lineH + (time ? timeH : 0);
        const g = first ? gap : 0;
        if (y + g + need <= bottom) {
          page.ops.push({ t: 'bubble', y: y + g, h: need, right: mine, w, name: first && showName ? name : '', color, lines: remaining, time, photo: first ? photo : null, photoW, photoH, italic, last: true, mine });
          y += g + need; break;
        }
        const avail = bottom - y - g - padY * 2 - top;
        const fit = Math.floor(avail / lineH);
        if ((fit < 2 || (photo && first && avail < 0)) && y > TOP + 4) { fresh(); continue; }
        if (remaining.length === 0) { fresh(); continue; }
        const take = Math.max(1, Math.min(fit, remaining.length));
        const chunk = remaining.splice(0, take);
        const h = padY * 2 + top + chunk.length * lineH;
        page.ops.push({ t: 'bubble', y: y + g, h, right: mine, w: maxBubble, name: first && showName ? name : '', color, lines: chunk, time: '', photo: first ? photo : null, photoW, photoH, italic, last: false, mine });
        fresh(); first = false;
      }
    } else {
      ctx.font = font(B * 0.95, 700);
      let shown = name;
      const textLeft = MARGIN + (look.times ? timeWidthPlain : 0);
      const roomW = width - MARGIN - textLeft;
      while (shown.length > 1 && ctx.measureText(`${shown}: `).width > roomW * 0.5) shown = `${shown.slice(0, -2)}…`;
      const nameW = Math.ceil(ctx.measureText(`${shown}: `).width);
      ctx.font = font(B * 0.95, 400, italic);
      const lines = wrap(ctx, text === '' ? ' ' : text, roomW, nameW);
      const remaining = lines.slice(); let first = true;
      const plainGap = sameRun ? Math.round(B * 0.2) : Math.round(B * 0.55);
      for (;;) {
        const need = remaining.length * lineH;
        const g = first ? plainGap : 0;
        if (y + g + need <= bottom) { page.ops.push({ t: 'plain', y: y + g, h: need, time, name: first ? shown : '', color, nameW, lines: remaining, italic, first }); y += g + need; break; }
        const fit = Math.floor((bottom - y - g) / lineH);
        if (fit < 2 && y > TOP + 4) { fresh(); continue; }
        const chunk = remaining.splice(0, Math.max(1, Math.min(fit, remaining.length)));
        page.ops.push({ t: 'plain', y: y + g, h: chunk.length * lineH, time, name: first ? shown : '', color, nameW, lines: chunk, italic, first });
        fresh(); first = false;
      }
    }
    previous = message;
  }
  // A last page with nothing on it (a message ended exactly at the bottom) is dropped.
  if (pages.length > 1 && pages[pages.length - 1]!.ops.length === 0 && !pages[pages.length - 1]!.summary) pages.pop();
  return { tooLong, pages, width, height, title: input.title, look, labels, summary: input.summary, rangeText };
}

const round = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.arcTo(x + w, y, x + w, y + h, radius); ctx.arcTo(x + w, y + h, x, y + h, radius); ctx.arcTo(x, y + h, x, y, radius); ctx.arcTo(x, y, x + w, y, radius); ctx.closePath();
};

/** Draws one page. The canvas must already be scaled so a page is 1000 units wide. */
export function paintPage(ctx: CanvasRenderingContext2D, built: Built, index: number): void {
  const { look, labels } = built;
  const B = BASE[look.size], page = built.pages[index]!;
  const bubbles = look.style === 'bubbles';
  const lineH = Math.round(B * 1.38);
  ctx.fillStyle = bubbles ? '#efeae2' : '#ffffff'; ctx.fillRect(0, 0, built.width, built.height);
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const ink = '#111827', soft = '#6b7280';

  if (page.summary) { paintSummary(ctx, built, B); }
  if (page.heading) {
    ctx.fillStyle = ink; ctx.font = font(34, 700); ctx.fillText(fit(ctx, built.title, built.width - MARGIN * 2), MARGIN, TOP + 34);
    ctx.fillStyle = soft; ctx.font = font(17); ctx.fillText(`${built.rangeText}  ·  ${built.summary.total} ${labels.messages}`, MARGIN, TOP + 68);
  }
  for (const op of page.ops) {
    if (op.t === 'date') {
      ctx.font = font(B * 0.95, 600);
      if (bubbles) {
        const w = ctx.measureText(op.text).width + 40;
        ctx.fillStyle = '#ffffff'; round(ctx, (built.width - w) / 2, op.y, w, op.h, op.h / 2); ctx.fill();
        ctx.fillStyle = '#54656f'; ctx.textAlign = 'center'; ctx.fillText(op.text, built.width / 2, op.y + op.h * 0.67); ctx.textAlign = 'left';
      } else {
        ctx.fillStyle = ink; ctx.fillText(op.text, MARGIN, op.y + op.h * 0.62);
        ctx.fillStyle = '#d1d5db'; ctx.fillRect(MARGIN, op.y + op.h * 0.8, built.width - MARGIN * 2, 1.5);
      }
    } else if (op.t === 'system') {
      ctx.font = font(B * 0.82, 400, true);
      const widest = Math.max(...op.lines.map((line) => ctx.measureText(line).width));
      if (bubbles) { ctx.fillStyle = '#fff5c4'; round(ctx, (built.width - widest) / 2 - 18, op.y, widest + 36, op.h, 12); ctx.fill(); }
      ctx.fillStyle = bubbles ? '#54656f' : soft; ctx.textAlign = 'center';
      op.lines.forEach((line, n) => ctx.fillText(line, built.width / 2, op.y + Math.round(B * 0.4) + Math.round(B * 1.2) * (n + 0.85)));
      ctx.textAlign = 'left';
    } else if (op.t === 'bubble') {
      const padX = Math.round(B * 0.75), padY = Math.round(B * 0.5), nameH = Math.round(B * 1.2), timeH = Math.round(B * 1.1);
      const x = op.right ? built.width - MARGIN - op.w : MARGIN;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1;
      ctx.fillStyle = op.mine ? '#d9fdd3' : '#ffffff'; round(ctx, x, op.y, op.w, op.h, 14); ctx.fill(); ctx.restore();
      let cursor = op.y + padY;
      if (op.name) { ctx.font = font(B * 0.85, 700); ctx.fillStyle = op.color; ctx.fillText(op.name, x + padX, cursor + nameH * 0.78); cursor += nameH; }
      if (op.photo) { ctx.save(); round(ctx, x + padX, cursor, op.photoW, op.photoH, 8); ctx.clip(); ctx.drawImage(op.photo.source, x + padX, cursor, op.photoW, op.photoH); ctx.restore(); cursor += op.photoH + Math.round(B * 0.3); }
      ctx.font = font(B, 400, op.italic); ctx.fillStyle = op.italic ? soft : ink;
      op.lines.forEach((line, n) => ctx.fillText(line, x + padX, cursor + lineH * (n + 0.74)));
      if (op.time) { ctx.font = font(B * 0.7); ctx.fillStyle = soft; ctx.textAlign = 'right'; ctx.fillText(op.time, x + op.w - padX, op.y + op.h - padY - timeH * 0.18); ctx.textAlign = 'left'; }
    } else {
      const left = MARGIN + (look.times ? Math.round(B * 4.9) : 0);
      if (op.time) { ctx.font = font(B * 0.75); ctx.fillStyle = soft; ctx.fillText(op.time, MARGIN, op.y + lineH * 0.72); }
      if (op.name) { ctx.font = font(B * 0.95, 700); ctx.fillStyle = ink; ctx.fillText(`${op.name}: `, left, op.y + lineH * 0.74); }
      ctx.font = font(B * 0.95, 400, op.italic); ctx.fillStyle = op.italic ? soft : ink;
      op.lines.forEach((line, n) => ctx.fillText(line, left + (n === 0 && op.name ? op.nameW : 0), op.y + lineH * (n + 0.74)));
    }
  }
  if (look.pageNumbers) {
    ctx.font = font(14); ctx.fillStyle = soft;
    ctx.fillText(fit(ctx, built.title, built.width * 0.55), MARGIN, built.height - 30);
    ctx.textAlign = 'right'; ctx.fillText(labels.page.replace('{n}', String(index + 1)).replace('{total}', String(built.pages.length)), built.width - MARGIN, built.height - 30); ctx.textAlign = 'left';
  }
}

/** Shortens text with "…" so it is no wider than `width`. */
function fit(ctx: CanvasRenderingContext2D, text: string, width: number): string {
  if (ctx.measureText(text).width <= width) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > width) out = out.slice(0, -1);
  return `${out}…`;
}

function paintSummary(ctx: CanvasRenderingContext2D, built: Built, B: number): void {
  const { summary, labels } = built;
  const W = built.width;
  ctx.fillStyle = '#111827'; ctx.font = font(40, 700); ctx.fillText(fit(ctx, built.title, W - MARGIN * 2), MARGIN, 150);
  ctx.fillStyle = '#6b7280'; ctx.font = font(20); ctx.fillText(labels.summaryTitle, MARGIN, 190);
  ctx.fillText(built.rangeText, MARGIN, 220);
  const boxes: [string, string][] = [[String(summary.total), labels.messages], [String(summary.days), labels.days], [summary.busiest ? formatDay(summary.busiest.day, false) : '-', summary.busiest ? labels.busiest.replace('{n}', String(summary.busiest.count)) : labels.busiest.replace('{n}', '0')]];
  const gap = 18, bw = (W - MARGIN * 2 - gap * 2) / 3;
  boxes.forEach(([big, small], n) => {
    const x = MARGIN + n * (bw + gap);
    ctx.fillStyle = built.look.style === 'bubbles' ? '#ffffff' : '#f3f4f6'; round(ctx, x, 270, bw, 120, 16); ctx.fill();
    ctx.fillStyle = '#111827'; ctx.font = font(n === 2 ? 26 : 38, 700); ctx.fillText(fit(ctx, big, bw - 36), x + 18, 332);
    ctx.fillStyle = '#6b7280'; ctx.font = font(16); ctx.fillText(fit(ctx, small, bw - 36), x + 18, 366);
  });
  ctx.fillStyle = '#111827'; ctx.font = font(24, 700); ctx.fillText(labels.people, MARGIN, 460);
  const top = summary.people.slice(0, 8), most = Math.max(1, ...top.map((person) => person.count));
  top.forEach((person, n) => {
    const y = 500 + n * 84;
    ctx.fillStyle = '#111827'; ctx.font = font(19, 600); ctx.fillText(fit(ctx, built.look.hideNumbers ? maskNumbers(person.name) : person.name, W - MARGIN * 2 - 140), MARGIN, y + 20);
    ctx.fillStyle = '#6b7280'; ctx.textAlign = 'right'; ctx.font = font(18); ctx.fillText(String(person.count), W - MARGIN, y + 20); ctx.textAlign = 'left';
    ctx.fillStyle = '#e5e7eb'; round(ctx, MARGIN, y + 34, W - MARGIN * 2, 16, 8); ctx.fill();
    ctx.fillStyle = COLORS[n % COLORS.length]!; round(ctx, MARGIN, y + 34, Math.max(16, (W - MARGIN * 2) * person.count / most), 16, 8); ctx.fill();
  });
  void B;
}
