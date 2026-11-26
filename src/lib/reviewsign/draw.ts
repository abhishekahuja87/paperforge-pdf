/** Drawing the "Review us" desk sign: a headline, a QR code that opens your review page, and your details. */
import { encodeQr } from '../qr/encoder';

export type ThemeId = 'darkgold' | 'royal' | 'white' | 'orange' | 'green' | 'maroon' | 'black' | 'pink' | 'teal' | 'plum' | 'cream' | 'mint' | 'sky';
export type SizeId = 'tent' | 'a6' | 'a5' | 'a4' | 'four';
export type BorderId = 'auto' | 'double' | 'single' | 'corners' | 'dotted' | 'rounded' | 'none';
export interface Theme { bg: string; text: string; muted: string; accent: string; ring: string; light: boolean; border: Exclude<BorderId, 'auto'> }
export const THEMES: Record<ThemeId, Theme> = {
  darkgold: { bg: '#1c2b38', text: '#ffffff', muted: '#cbd5e1', accent: '#e9c24f', ring: '#e9c24f', light: false, border: 'double' },
  royal: { bg: '#1e1b4b', text: '#ffffff', muted: '#ddd6fe', accent: '#fbbf24', ring: '#fbbf24', light: false, border: 'corners' },
  white: { bg: '#ffffff', text: '#111827', muted: '#4b5563', accent: '#c2410c', ring: '#c2410c', light: true, border: 'single' },
  orange: { bg: '#c2410c', text: '#ffffff', muted: '#ffedd5', accent: '#fde68a', ring: '#fde68a', light: false, border: 'dotted' },
  green: { bg: '#14532d', text: '#ffffff', muted: '#dcfce7', accent: '#fde047', ring: '#fde047', light: false, border: 'double' },
  maroon: { bg: '#5b1a1a', text: '#ffffff', muted: '#fde8e8', accent: '#f2c75c', ring: '#f2c75c', light: false, border: 'corners' },
  black: { bg: '#111111', text: '#ffffff', muted: '#d4d4d4', accent: '#f0b9a0', ring: '#f0b9a0', light: false, border: 'single' },
  teal: { bg: '#0f4c4c', text: '#ffffff', muted: '#ccfbf1', accent: '#f4d35e', ring: '#f4d35e', light: false, border: 'rounded' },
  plum: { bg: '#3b0764', text: '#ffffff', muted: '#f3e8ff', accent: '#f5c451', ring: '#f5c451', light: false, border: 'double' },
  cream: { bg: '#fff7ed', text: '#431407', muted: '#78350f', accent: '#9a3412', ring: '#b45309', light: true, border: 'corners' },
  mint: { bg: '#ecfdf5', text: '#064e3b', muted: '#065f46', accent: '#047857', ring: '#047857', light: true, border: 'dotted' },
  sky: { bg: '#f0f9ff', text: '#0c4a6e', muted: '#075985', accent: '#0369a1', ring: '#0369a1', light: true, border: 'rounded' },
  pink: { bg: '#fdf2f8', text: '#500724', muted: '#831843', accent: '#be185d', ring: '#be185d', light: true, border: 'double' },
};
/** Paper sizes in millimetres. "four" is four small A6 signs on one A4 page. "tent" is two A6 panels in one strip that folds into a stand. */
export const SIZES: Record<SizeId, { w: number; h: number; pageW: number; pageH: number }> = {
  tent: { w: 105, h: 148, pageW: 210, pageH: 297 }, a6: { w: 105, h: 148, pageW: 105, pageH: 148 }, a5: { w: 148, h: 210, pageW: 148, pageH: 210 }, a4: { w: 210, h: 297, pageW: 210, pageH: 297 }, four: { w: 105, h: 148, pageW: 210, pageH: 297 },
};

export interface SignInput {
  theme: ThemeId; border: BorderId; showRating: boolean; headline: string; scanLabel: string; subline: string; business: string; address: string; tagline: string; link: string;
  rating: string; count: string; reviewsWord: string; caps: boolean;
  logo: { source: CanvasImageSource; width: number; height: number } | null;
}

const FONT = 'Poppins, "Segoe UI", system-ui, "Noto Sans", "Noto Sans Devanagari", sans-serif';

/** A link that a phone can open, or '' when what was typed is not a web address. */
export function normaliseLink(raw: string): string {
  const text = raw.trim(); if (!text || text.length > 300 || /\s/.test(text)) return '';
  const full = /^https?:\/\//i.test(text) ? text : /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$|\?|#)/i.test(text) ? `https://${text}` : '';
  try { return full ? new URL(full).href : ''; } catch { return ''; }
}
/** The rating if it is a number from 1 to 5, else null. */
export function parseRating(raw: string): number | null { const n = Number(raw.trim().replace(',', '.')); return raw.trim() && n >= 1 && n <= 5 ? Math.round(n * 10) / 10 : null; }
export const parseCount = (raw: string): number | null => { const n = Number(raw.replace(/[,\s]/g, '')); return raw.trim() && Number.isInteger(n) && n > 0 && n < 100000000 ? n : null; };

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) { const next = line ? `${line} ${word}` : word; if (line && ctx.measureText(next).width > width) { out.push(line); line = word; } else line = next; }
    out.push(line);
  }
  return out.filter((l, i, all) => l || (i > 0 && i < all.length - 1));
}
function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath(); for (let i = 0; i < 10; i += 1) { const a = -Math.PI / 2 + (i * Math.PI) / 5, d = i % 2 ? r * 0.42 : r; ctx.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); } ctx.closePath();
}
const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };

function drawBorder(ctx: CanvasRenderingContext2D, W: number, H: number, u: number, t: Theme, style: Exclude<BorderId, 'auto'>) {
  ctx.strokeStyle = t.ring; ctx.fillStyle = t.ring; const m = 5 * u, thin = Math.max(1, 0.4 * u);
  if (style === 'none') return;
  if (style === 'single') { ctx.lineWidth = thin * 1.6; ctx.strokeRect(m, m, W - 2 * m, H - 2 * m); }
  if (style === 'double') { ctx.lineWidth = thin * 1.6; ctx.strokeRect(m, m, W - 2 * m, H - 2 * m); ctx.lineWidth = thin * 0.7; ctx.strokeRect(m + 1.8 * u, m + 1.8 * u, W - 2 * m - 3.6 * u, H - 2 * m - 3.6 * u); }
  if (style === 'rounded') { ctx.lineWidth = thin * 1.8; roundRect(ctx, m, m, W - 2 * m, H - 2 * m, 6 * u); ctx.stroke(); ctx.lineWidth = thin * 0.7; roundRect(ctx, m + 1.8 * u, m + 1.8 * u, W - 2 * m - 3.6 * u, H - 2 * m - 3.6 * u, 4.4 * u); ctx.stroke(); }
  if (style === 'dotted') { const r = 0.55 * u, step = 2.6 * u; for (let x = m; x <= W - m + 0.1; x += step) for (const y of [m, H - m]) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); } for (let y = m + step; y < H - m - 0.1; y += step) for (const x of [m, W - m]) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); } }
  if (style === 'corners') {
    ctx.lineWidth = thin * 0.8; ctx.strokeRect(m + 1.2 * u, m + 1.2 * u, W - 2 * m - 2.4 * u, H - 2 * m - 2.4 * u); ctx.lineWidth = thin * 2.2; const k = 12 * u;
    for (const [x, y, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]] as const) { ctx.beginPath(); ctx.moveTo(x + dx * k, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * k); ctx.stroke(); }
  }
}

/** The sign as a canvas `px` pixels wide. */
export function drawSign(input: SignInput, size: SizeId, px: number): HTMLCanvasElement {
  const dims = SIZES[size], W = Math.round(px), H = Math.round((px * dims.h) / dims.w), u = W / 100, t = THEMES[input.theme];
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = t.bg; ctx.fillRect(0, 0, W, H);
  drawBorder(ctx, W, H, u, t, input.border === 'auto' ? t.border : input.border);
  const cx = W / 2, up = (s: string) => (input.caps ? s.toUpperCase() : s);
  const rating = input.showRating ? parseRating(input.rating) : null, count = input.showRating ? parseCount(input.count) : null;
  const link = normaliseLink(input.link), qr = encodeQr(link || 'https://example.com/review', 'M');
  // Headline: as large as fits in three lines.
  const headline = up(input.headline.trim() || ' ');
  let headSize = 11 * u, lines: string[] = [];
  for (; headSize >= 5.5 * u; headSize -= 0.5 * u) { ctx.font = `700 ${headSize}px ${FONT}`; lines = wrap(ctx, headline, 74 * u); if (lines.length <= 3 && Math.max(...lines.map((l) => ctx.measureText(l).width)) <= 74 * u) break; }
  const headH = lines.length * headSize * 1.14;
  const addressLines = (() => { ctx.font = `400 ${3 * u}px ${FONT}`; return input.address.trim() ? wrap(ctx, input.address.trim(), 76 * u).slice(0, 4) : []; })();
  // Everything below the headline, measured so the tile can shrink when the details are long.
    let tile = 50 * u;
  const need = (tileSize: number) => 12 * u + headH + 4 * u + 5 * u + tileSize + 5 * u + 3.4 * u + 6 * u + 7 * u + addressLines.length * 4.1 * u + (rating ? (count ? 17 * u : 11 * u) : 0) + 10 * u;
  while (tile > 28 * u && need(tile) > H) tile -= 2 * u;
  let y = 12 * u + headSize * 0.95;
  ctx.fillStyle = t.accent; ctx.font = `700 ${headSize}px ${FONT}`; lines.forEach((l) => { ctx.fillText(l, cx, y); y += headSize * 1.14; });
  y = y - headSize * 1.14 + 6 * u;
  ctx.fillStyle = t.text; ctx.font = `600 ${3.6 * u}px ${FONT}`; ctx.fillText(up(input.scanLabel.trim()), cx, y + 3 * u); y += 6 * u;
  // QR tile: white with a quiet border so phones read it on any colour.
  const tx = cx - tile / 2; ctx.fillStyle = '#ffffff'; roundRect(ctx, tx, y, tile, tile, 2.2 * u); ctx.fill();
  const pad = tile * 0.07, mod = Math.max(1, Math.floor((tile - pad * 2) / qr.size)), qrSide = mod * qr.size, qx = Math.round(cx - qrSide / 2), qy = Math.round(y + (tile - qrSide) / 2);
  ctx.fillStyle = '#000000'; for (let r = 0; r < qr.size; r += 1) for (let c = 0; c < qr.size; c += 1) if (qr.modules[r]![c]) ctx.fillRect(qx + c * mod, qy + r * mod, mod, mod);
  y += tile + 5 * u;
  ctx.fillStyle = t.text; ctx.font = `600 ${2.9 * u}px ${FONT}`; ctx.fillText(up(input.subline.trim()), cx, y); y += 7 * u;
  // Business name with the small logo to its left, centred together.
  const logo = input.logo, logoGap = 2.4 * u, logoMax = { w: 14 * u, h: 10 * u };
  const logoSize = logo ? (() => { const k = Math.min(logoMax.w / logo.width, logoMax.h / logo.height); return { w: logo.width * k, h: logo.height * k }; })() : { w: 0, h: 0 };
  const room = 82 * u - (logo ? logoSize.w + logoGap : 0);
  let nameSize = 6 * u; ctx.font = `700 ${nameSize}px ${FONT}`; while (ctx.measureText(input.business || ' ').width > room && nameSize > 3.2 * u) { nameSize -= 0.3 * u; ctx.font = `700 ${nameSize}px ${FONT}`; }
  const nameW = ctx.measureText(input.business.trim()).width, rowW = nameW + (logo ? logoSize.w + logoGap : 0), rowX = cx - rowW / 2;
  if (logo) ctx.drawImage(logo.source, rowX, y - nameSize * 0.36 - logoSize.h / 2, logoSize.w, logoSize.h);
  ctx.fillStyle = t.text; ctx.textAlign = 'left'; ctx.fillText(input.business.trim(), rowX + (logo ? logoSize.w + logoGap : 0), y); ctx.textAlign = 'center';
  y += Math.max(4.6 * u, logo ? logoSize.h / 2 - nameSize * 0.36 + 3 * u : 0);
  ctx.fillStyle = t.muted; ctx.font = `400 ${3 * u}px ${FONT}`; addressLines.forEach((l) => { ctx.fillText(l, cx, y); y += 4.1 * u; });
  // Rating row: the number and the stars are centred as one group, and the count sits under the middle star.
  if (rating) {
    y += 4 * u; const r = 3 * u, gap = 7 * u, starsW = gap * 4 + 2 * r, numSize = 6 * u;
    ctx.font = `700 ${numSize}px ${FONT}`; const numW = ctx.measureText(rating.toFixed(1)).width, space = 3 * u, groupW = numW + space + starsW, gx = cx - groupW / 2;
    ctx.fillStyle = t.text; ctx.textAlign = 'left'; ctx.fillText(rating.toFixed(1), gx, y + numSize * 0.36); ctx.textAlign = 'center';
    const sx = gx + numW + space + r;
    for (let i = 0; i < 5; i += 1) {
      const fill = Math.max(0, Math.min(1, rating - i)), x = sx + i * gap;
      ctx.save(); star(ctx, x, y, r); ctx.fillStyle = 'rgba(255,255,255,0.22)'; if (t.light) ctx.fillStyle = '#e5e7eb'; ctx.fill(); ctx.clip(); ctx.fillStyle = '#f5b50a'; ctx.fillRect(x - r, y - r, 2 * r * fill, 2 * r); ctx.restore();
    }
    y += r + 5.6 * u;
    if (count) { ctx.fillStyle = t.muted; ctx.font = `500 ${3.4 * u}px ${FONT}`; ctx.fillText(`${count.toLocaleString('en-IN')} ${input.reviewsWord.trim() || 'Reviews'}`, sx + 2 * gap, y); y += 2 * u; }
  }
  if (input.tagline.trim() && y < H - 14 * u) { ctx.fillStyle = t.muted; ctx.font = `500 ${2.3 * u}px ${FONT}`; ctx.fillText(up(input.tagline.trim()), cx, H - 10 * u); }
  return canvas;
}

/** The whole printed page at `dpi`. "four" is four signs with cut marks. "tent" is two fold-and-stand strips: the lower panel is turned upside down so both faces stand upright. */
export function drawPage(input: SignInput, size: SizeId, dpi: number): HTMLCanvasElement {
  const dims = SIZES[size], mm = dpi / 25.4;
  if (size !== 'four' && size !== 'tent') return drawSign(input, size, Math.round(dims.w * mm));
  const page = document.createElement('canvas'); page.width = Math.round(dims.pageW * mm); page.height = Math.round(dims.pageH * mm);
  const ctx = page.getContext('2d')!; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, page.width, page.height);
  const one = drawSign(input, size, Math.round(dims.w * mm)), cw = one.width, ch = one.height, top = Math.round((page.height - 2 * ch) / 2);
  ctx.strokeStyle = '#9ca3af'; ctx.fillStyle = '#6b7280'; ctx.lineWidth = Math.max(1, mm * 0.2); const k = mm * 3;
  const marks = (x: number, y: number) => { for (const [px, py] of [[x, y], [x + cw, y], [x, y + ch], [x + cw, y + ch]] as const) { ctx.beginPath(); ctx.moveTo(px - k, py); ctx.lineTo(px + k, py); ctx.moveTo(px, py - k); ctx.lineTo(px, py + k); ctx.stroke(); } };
  if (size === 'four') { for (let r = 0; r < 2; r += 1) for (let c = 0; c < 2; c += 1) { ctx.drawImage(one, c * cw, top + r * ch); marks(c * cw, top + r * ch); } return page; }
  for (let c = 0; c < 2; c += 1) {
    const x = c * cw; ctx.drawImage(one, x, top);
    ctx.save(); ctx.translate(x + cw / 2, top + ch + ch / 2); ctx.rotate(Math.PI); ctx.drawImage(one, -cw / 2, -ch / 2); ctx.restore();
    ctx.setLineDash([mm * 2, mm * 1.5]); ctx.beginPath(); ctx.moveTo(x, top + ch); ctx.lineTo(x + cw, top + ch); ctx.stroke(); ctx.setLineDash([]);
    marks(x, top);
  }
  return page;
}
