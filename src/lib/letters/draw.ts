/** Drawing a letter as one or more pages: letterhead, date, address, subject, body that flows onto more pages, and a sign-off. */
export type PaperId = 'a4' | 'a5';
export type AccentId = 'navy' | 'maroon' | 'green' | 'orange' | 'teal' | 'black';
export type TextSizeId = 'small' | 'normal' | 'large';
export interface LetterLook { paper: PaperId; accent: AccentId; size: TextSizeId; letterhead: boolean }
export interface LetterWords { business: string; tagline: string; contact: string; closing: string; signName: string; signRole: string; footer: string }
/** What changes from letter to letter. */
export interface Letter { dateText: string; addressee: string; subject: string; body: string }
export interface LetterLogo { source: CanvasImageSource; width: number; height: number }

export const PAPER: Record<PaperId, { width: number; height: number; points: [number, number] }> = {
  a4: { width: 1240, height: 1754, points: [595.28, 841.89] }, a5: { width: 874, height: 1240, points: [419.53, 595.28] },
};
export const ACCENT: Record<AccentId, string> = { navy: '#1e3a5f', maroon: '#7f1d1d', green: '#14532d', orange: '#c2410c', teal: '#0f5c5c', black: '#111827' };
const BASE = { small: 22, normal: 25, large: 29 } as const;
const FONT = (weight: number, size: number) => `${weight} ${size}px Poppins, "Noto Sans Devanagari", "Segoe UI", system-ui, sans-serif`;

interface Item { page: number; x: number; y: number; text?: string; font?: string; color?: string; align?: CanvasTextAlign; rule?: { w: number; color: string; thick: number }; logo?: { w: number; h: number } }

function wrapText(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const out: string[] = []; let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    let piece = word;
    while (ctx.measureText(piece).width > width && piece.length > 1) { // a very long word with no spaces
      let cut = piece.length - 1; while (cut > 1 && ctx.measureText(piece.slice(0, cut)).width > width) cut -= 1;
      if (line) { out.push(line); line = ''; } out.push(piece.slice(0, cut)); piece = piece.slice(cut);
    }
    const next = line ? `${line} ${piece}` : piece;
    if (line && ctx.measureText(next).width > width) { out.push(line); line = piece; } else line = next;
  }
  if (line) out.push(line); return out;
}

/** The pages of one letter. */
export function drawLetter(look: LetterLook, words: LetterWords, letter: Letter, logo: LetterLogo | null): HTMLCanvasElement[] {
  const paper = PAPER[look.paper], s = paper.width / 1240, W = paper.width, H = paper.height, accent = ACCENT[look.accent];
  const margin = 110 * s, contentW = W - margin * 2, bottom = H - 150 * s, size = BASE[look.size] * s, lineH = size * 1.55;
  const scratch = document.createElement('canvas').getContext('2d')!;
  const items: Item[] = []; let page = 0, y = 100 * s;
  const newPage = () => { page += 1; y = 100 * s; };
  const need = (h: number) => { if (y + h > bottom) newPage(); };
  const line = (text: string, o: { x?: number; align?: CanvasTextAlign; weight?: number; size?: number; color?: string; gap?: number } = {}) => {
    const px = o.size ?? size, h = px * 1.55; need(h);
    items.push({ page, x: o.x ?? margin, y: y + px, text, font: FONT(o.weight ?? 500, px), color: o.color ?? '#111827', align: o.align ?? 'left' }); y += h + (o.gap ?? 0);
  };
  const paragraph = (text: string, o: { weight?: number; color?: string } = {}) => {
    scratch.font = FONT(o.weight ?? 500, size);
    for (const raw of text.split('\n')) { if (raw.trim() === '') { y += lineH * 0.55; continue; } for (const l of wrapText(scratch, raw.trim(), contentW)) line(l, o); }
  };

  // Letterhead on the first page.
  if (look.letterhead && (words.business.trim() || logo)) {
    const top = y; let textX = margin;
    if (logo) { const k = Math.min(190 * s / logo.width, 120 * s / logo.height); items.push({ page, x: margin, y: top, logo: { w: logo.width * k, h: logo.height * k } }); textX = margin + logo.width * k + 30 * s; }
    const maxText = W - margin - textX; let ty = top;
    const add = (text: string, px: number, weight: number, color: string) => { scratch.font = FONT(weight, px); for (const l of wrapText(scratch, text, maxText)) { items.push({ page, x: textX, y: ty + px, text: l, font: FONT(weight, px), color }); ty += px * 1.4; } };
    if (words.business.trim()) add(words.business.trim(), 42 * s, 700, accent);
    if (words.tagline.trim()) add(words.tagline.trim(), 21 * s, 500, '#4b5563');
    if (words.contact.trim()) add(words.contact.trim(), 19 * s, 500, '#4b5563');
    y = Math.max(ty, top + (logo ? 120 * s : 0)) + 16 * s;
    items.push({ page, x: margin, y, rule: { w: contentW, color: accent, thick: 3 * s } }); y += 40 * s;
  }
  if (letter.dateText.trim()) line(letter.dateText.trim(), { x: W - margin, align: 'right', gap: size * 0.4 });
  if (letter.addressee.trim()) { paragraph(letter.addressee); y += lineH * 0.45; }
  if (letter.subject.trim()) { paragraph(`Subject: ${letter.subject.trim()}`, { weight: 700 }); y += lineH * 0.35; }
  paragraph(letter.body);
  // Sign-off stays together on one page.
  y += lineH * 0.5; const closing = [words.closing.trim(), words.signName.trim(), words.signRole.trim()].filter(Boolean);
  if (closing.length > 0) {
    need(lineH * (closing.length + 2.5));
    if (words.closing.trim()) line(words.closing.trim());
    y += lineH * 1.6;
    if (words.signName.trim()) line(words.signName.trim(), { weight: 700 });
    if (words.signRole.trim()) line(words.signRole.trim(), { color: '#4b5563' });
  }

  const total = page + 1, canvases: HTMLCanvasElement[] = [];
  for (let p = 0; p < total; p += 1) {
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); ctx.textBaseline = 'alphabetic';
    for (const it of items.filter((i) => i.page === p)) {
      if (it.rule) { ctx.fillStyle = it.rule.color; ctx.fillRect(it.x, it.y, it.rule.w, it.rule.thick); }
      else if (it.logo && logo) ctx.drawImage(logo.source, it.x, it.y, it.logo.w, it.logo.h);
      else if (it.text !== undefined) { ctx.font = it.font!; ctx.fillStyle = it.color!; ctx.textAlign = it.align!; ctx.fillText(it.text, it.x, it.y); }
    }
    ctx.textAlign = 'center'; ctx.fillStyle = '#6b7280'; ctx.font = FONT(500, 18 * s);
    if (words.footer.trim()) ctx.fillText(words.footer.trim(), W / 2, H - 70 * s);
    if (total > 1) { ctx.textAlign = 'right'; ctx.fillText(`${p + 1} / ${total}`, W - margin, H - 70 * s); }
    canvases.push(canvas);
  }
  return canvases;
}
