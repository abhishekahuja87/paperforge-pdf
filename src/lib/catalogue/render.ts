/** Draws the pages of a product catalogue on a canvas: a cover, pages of products and a page on how to order. */
import { hex, alpha, roundPath, type Ctx } from '../invites/draw';
import { stack } from '../invites/render';
import type { Pal } from '../invites/data';
import { encodeQr, type QrCode } from '../qr/encoder';
import { whatsappLink } from '../poster/links';
import { LAYOUTS, type CatalogueDesign, type LayoutId, type PageSize } from './data';

export interface CatImage { source: CanvasImageSource; width: number; height: number }
export interface CatProduct { name: string; price: string; old: string; desc: string; code: string; badge: string; section: string; image: CatImage | null }
export interface CatBusiness { title: string; subtitle: string; name: string; tagline: string; phone: string; whatsapp: string; email: string; address: string; web: string; note: string; countryCode: string }
export interface CatLabels { order: string; scan: string; phone: string; whatsapp: string; email: string; address: string; web: string; page: string; of: string }
export interface CatOptions {
  design: CatalogueDesign; pal: Pal; headFont: string; bodyFont: string; layout: LayoutId; size: PageSize; currency: string;
  showPrice: boolean; showDesc: boolean; showCode: boolean; fit: 'cover' | 'contain'; logo: CatImage | null; qr: boolean; labels: CatLabels;
}
export type PageSpec = { kind: 'cover' } | { kind: 'products'; items: CatProduct[]; section: string; number: number } | { kind: 'back' };

/** Splits the products into pages. A product that starts a section always starts a new page. */
export function buildPages(products: CatProduct[], layout: LayoutId): PageSpec[] {
  const per = LAYOUTS[layout].per, pages: PageSpec[] = [{ kind: 'cover' }];
  let items: CatProduct[] = [], section = '', n = 0;
  const flush = (): void => { if (items.length) { n += 1; pages.push({ kind: 'products', items, section, number: n }); } items = []; };
  products.forEach((p) => {
    if (p.section.trim() && (items.length || section !== p.section.trim())) { flush(); section = p.section.trim(); }
    if (items.length >= per) flush();
    items.push(p);
  });
  flush();
  pages.push({ kind: 'back' });
  return pages;
}

/** A typed price with the currency in front when it is only digits, commas and a point. Anything else is shown as typed. */
export const formatPrice = (text: string, currency: string): string => {
  const t = text.trim();
  if (!t) return '';
  return /^[\d.,\s]+$/.test(t) && currency ? `${currency}${currency.endsWith('.') ? ' ' : ''}${t}` : t;
};

function wrapLines(ctx: Ctx, text: string, maxW: number, maxLines: number): string[] {
  const out: string[] = []; let line = '';
  const words = text.split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length; i += 1) {
    const test = line ? `${line} ${words[i]}` : words[i]!;
    if (line && ctx.measureText(test).width > maxW) {
      if (out.length === maxLines - 1) { let rest = [line, ...words.slice(i)].join(' '); while (rest.length > 1 && ctx.measureText(`${rest}…`).width > maxW) rest = rest.slice(0, -1); out.push(`${rest.trimEnd()}…`); return out; }
      out.push(line); line = words[i]!;
    } else line = test;
  }
  if (line) out.push(line);
  return out;
}
function drawImageIn(ctx: Ctx, img: CatImage, x: number, y: number, w: number, h: number, fit: 'cover' | 'contain', bg: string): void {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (fit === 'contain') { ctx.fillStyle = bg; ctx.fillRect(x, y, w, h); }
  const k = fit === 'cover' ? Math.max(w / img.width, h / img.height) : Math.min(w / img.width, h / img.height);
  ctx.drawImage(img.source, x + (w - img.width * k) / 2, y + (h - img.height * k) / 2, img.width * k, img.height * k);
  ctx.restore();
}
const qrCache = new Map<string, QrCode | null>();
function qrFor(link: string): QrCode | null {
  if (!qrCache.has(link)) { let code: QrCode | null = null; try { code = encodeQr(link, 'M'); } catch { code = null; } qrCache.set(link, code); }
  return qrCache.get(link) ?? null;
}
function drawQr(ctx: Ctx, code: QrCode, x: number, y: number, size: number): void {
  const quiet = 2, total = code.size + quiet * 2, at = (i: number) => Math.round((i * size) / total);
  ctx.fillStyle = '#ffffff'; roundPath(ctx, x, y, size, size, size * 0.07); ctx.fill(); ctx.fillStyle = '#000000';
  for (let r = 0; r < code.size; r += 1) for (let c = 0; c < code.size; c += 1) { if (!code.modules[r]![c]) continue; const x0 = x + at(c + quiet), x1 = x + at(c + quiet + 1), y0 = y + at(r + quiet), y1 = y + at(r + quiet + 1); ctx.fillRect(x0, y0, x1 - x0, y1 - y0); }
}
/** Dark text on a light colour, light text on a dark one. */
const onColor = (h: string): string => { const n = parseInt(h, 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '111111' : 'FFFFFF'; };
const fontOf = (weight: number, px: number, family: string): string => `${weight} ${px}px ${family}`;

function drawCard(ctx: Ctx, p: CatProduct, x: number, y: number, w: number, h: number, o: CatOptions, list: boolean): void {
  const pal = o.pal, body = stack(o.bodyFont), head = stack(o.headFont), s = Math.min(w, h * (list ? 2.2 : 0.8)) / 400, r = o.design.card === 'round' ? 30 * s : 12 * s;
  ctx.save();
  if (o.design.card === 'shadow') { ctx.shadowColor = 'rgba(0,0,0,0.16)'; ctx.shadowBlur = 22 * s; ctx.shadowOffsetY = 6 * s; }
  ctx.fillStyle = hex(o.design.card === 'flat' ? pal.bg2 : pal.panel); roundPath(ctx, x, y, w, h, r); ctx.fill(); ctx.restore();
  if (o.design.card === 'border') { ctx.strokeStyle = hex(pal.accent); ctx.lineWidth = 3 * s; roundPath(ctx, x, y, w, h, r); ctx.stroke(); }
  const pad = 14 * s;
  const imgBox = list ? { x: x + pad, y: y + pad, w: h - pad * 2, h: h - pad * 2 } : { x: x + pad, y: y + pad, w: w - pad * 2, h: h * (o.showDesc ? 0.52 : o.showPrice ? 0.64 : 0.82) - pad };
  ctx.save(); roundPath(ctx, imgBox.x, imgBox.y, imgBox.w, imgBox.h, r * 0.6); ctx.clip();
  if (p.image) drawImageIn(ctx, p.image, imgBox.x, imgBox.y, imgBox.w, imgBox.h, o.fit, hex(pal.bg2));
  else { ctx.fillStyle = alpha(pal.accent2, 0.25); ctx.fillRect(imgBox.x, imgBox.y, imgBox.w, imgBox.h); }
  ctx.restore();
  if (p.badge.trim()) {
    ctx.font = fontOf(700, 22 * s, body); const bw = ctx.measureText(p.badge.toUpperCase()).width + 26 * s, bh = 38 * s;
    ctx.fillStyle = hex(pal.accent); roundPath(ctx, imgBox.x + 10 * s, imgBox.y + 10 * s, bw, bh, bh / 2); ctx.fill();
    ctx.fillStyle = hex(onColor(pal.accent)); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(p.badge.toUpperCase(), imgBox.x + 23 * s, imgBox.y + 10 * s + bh / 2);
  }
  const tx = list ? imgBox.x + imgBox.w + 24 * s : x + pad, tw = list ? x + w - tx - pad : w - pad * 2, ty = list ? y + pad : imgBox.y + imgBox.h + 12 * s;
  let cy = ty; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  const nameSize = (list ? 38 : 30) * s;
  const price = o.showPrice ? formatPrice(p.price, o.currency) : '';
  const ps = (list ? 46 : 36) * s, py = list ? y + h - pad - ps * 1.3 : y + h - pad - ps * 1.15;
  const nameRoom = Math.floor(((price ? py : y + h - pad) - ty - (o.showCode && p.code.trim() ? 26 * s : 0)) / (nameSize * 1.18));
  ctx.fillStyle = hex(pal.ink); ctx.font = fontOf(700, nameSize, head); const nameLines = wrapLines(ctx, p.name, tw, Math.max(1, Math.min(2, nameRoom)));
  nameLines.forEach((l) => { ctx.fillText(l, tx, cy); cy += nameSize * 1.18; });
  if (o.showCode && p.code.trim()) { ctx.fillStyle = hex(pal.soft); ctx.font = fontOf(500, 20 * s, body); ctx.fillText(p.code, tx, cy + 2 * s); cy += 26 * s; }
  if (o.showDesc && p.desc.trim()) {
    const room = Math.floor((((price ? py : y + h - pad) - cy) - 4 * s) / (27 * s)), n = Math.min(list ? 4 : 2, room);
    if (n > 0) { ctx.fillStyle = hex(pal.soft); ctx.font = fontOf(500, 22 * s, body); wrapLines(ctx, p.desc, tw, n).forEach((l) => { ctx.fillText(l, tx, cy + 4 * s); cy += 27 * s; }); }
  }
  if (price) {
    ctx.fillStyle = hex(pal.accent); ctx.font = fontOf(700, ps, body); ctx.fillText(price, tx, py);
    const old = formatPrice(p.old, o.currency);
    if (old) { const px = tx + ctx.measureText(price).width + 14 * s; ctx.fillStyle = hex(pal.soft); ctx.font = fontOf(500, 24 * s, body); ctx.fillText(old, px, py + ps * 0.18); const ow = ctx.measureText(old).width; ctx.strokeStyle = hex(pal.soft); ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(px, py + ps * 0.18 + 14 * s); ctx.lineTo(px + ow, py + ps * 0.18 + 14 * s); ctx.stroke(); }
  }
}

function chrome(ctx: Ctx, w: number, h: number, b: CatBusiness, o: CatOptions, section: string, number: number, total: number): { top: number; bottom: number } {
  const u = w / 1000, pal = o.pal, body = stack(o.bodyFont), head = stack(o.headFont);
  ctx.textBaseline = 'middle';
  let top: number;
  if (section) {
    ctx.fillStyle = hex(pal.accent); ctx.fillRect(0, 0, w, 120 * u);
    ctx.fillStyle = hex(onColor(pal.accent)); ctx.textAlign = 'left'; ctx.font = fontOf(700, 48 * u, head); ctx.fillText(section, 50 * u, 62 * u);
    top = 150 * u;
  } else {
    ctx.fillStyle = hex(pal.soft); ctx.textAlign = 'left'; ctx.font = fontOf(700, 26 * u, body); ctx.fillText(b.name, 50 * u, 52 * u);
    ctx.textAlign = 'right'; ctx.font = fontOf(500, 24 * u, body); ctx.fillText(b.title, w - 50 * u, 52 * u);
    ctx.strokeStyle = alpha(pal.accent, 0.6); ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(50 * u, 88 * u); ctx.lineTo(w - 50 * u, 88 * u); ctx.stroke();
    top = 120 * u;
  }
  ctx.fillStyle = hex(pal.soft); ctx.font = fontOf(500, 24 * u, body); ctx.textAlign = 'left';
  const contact = [b.whatsapp || b.phone, b.web].map((x) => x.trim()).filter(Boolean).join('   |   ');
  ctx.fillText(contact, 50 * u, h - 40 * u); ctx.textAlign = 'right'; ctx.fillText(`${o.labels.page} ${number} ${o.labels.of} ${total}`, w - 50 * u, h - 40 * u);
  return { top, bottom: h - 90 * u };
}

export function renderCatalogue(ctx: Ctx, w: number, h: number, spec: PageSpec, b: CatBusiness, products: CatProduct[], o: CatOptions, totalPages: number): void {
  const u = w / 1000, pal = o.pal, body = stack(o.bodyFont), head = stack(o.headFont);
  ctx.save(); ctx.clearRect(0, 0, w, h); ctx.fillStyle = hex(pal.bg); ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  if (spec.kind === 'products') {
    ctx.fillStyle = hex(pal.bg); ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, hex(pal.bg)); g.addColorStop(1, hex(pal.bg2)); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const { top, bottom } = chrome(ctx, w, h, b, o, spec.section, spec.number + 1, totalPages);
    const { cols, rows } = LAYOUTS[o.layout], gap = 26 * u, mx = 50 * u, cw = (w - mx * 2 - gap * (cols - 1)) / cols, ch = (bottom - top - gap * (rows - 1)) / rows;
    spec.items.forEach((p, i) => drawCard(ctx, p, mx + (i % cols) * (cw + gap), top + Math.floor(i / cols) * (ch + gap), cw, ch, o, o.layout === 'list'));
  } else if (spec.kind === 'back') {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, hex(pal.bg2)); g.addColorStop(1, hex(pal.bg)); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    let y = h * 0.14;
    if (o.logo) { const k = Math.min(200 * u / o.logo.width, 200 * u / o.logo.height); const lw = o.logo.width * k, lh = o.logo.height * k; ctx.drawImage(o.logo.source, w / 2 - lw / 2, y, lw, lh); y += lh + 40 * u; }
    ctx.fillStyle = hex(pal.accent); ctx.font = fontOf(700, 34 * u, body); ctx.fillText(o.labels.order.toUpperCase(), w / 2, y + 30 * u); y += 150 * u;
    ctx.fillStyle = hex(pal.ink); ctx.font = fontOf(700, 78 * u, head); wrapLines(ctx, b.name || ' ', w - 140 * u, 2).forEach((l) => { ctx.fillText(l, w / 2, y); y += 88 * u; });
    if (b.tagline.trim()) { ctx.fillStyle = hex(pal.soft); ctx.font = fontOf(500, 34 * u, body); wrapLines(ctx, b.tagline, w - 200 * u, 2).forEach((l) => { ctx.fillText(l, w / 2, y); y += 44 * u; }); }
    y += 40 * u;
    const rowsOut: [string, string][] = [[o.labels.whatsapp, b.whatsapp], [o.labels.phone, b.phone], [o.labels.email, b.email], [o.labels.web, b.web], [o.labels.address, b.address]].filter(([, v]) => (v as string).trim()) as [string, string][];
    rowsOut.forEach(([k, v]) => { ctx.fillStyle = hex(pal.accent); ctx.font = fontOf(700, 24 * u, body); ctx.fillText(k.toUpperCase(), w / 2, y); y += 36 * u; ctx.fillStyle = hex(pal.ink); ctx.font = fontOf(500, 36 * u, body); wrapLines(ctx, v, w - 160 * u, 2).forEach((l) => { ctx.fillText(l, w / 2, y); y += 46 * u; }); y += 22 * u; });
    const link = o.qr ? (whatsappLink(b.whatsapp || b.phone, b.countryCode) || (b.web.trim() ? (/^https?:\/\//i.test(b.web.trim()) ? b.web.trim() : `https://${b.web.trim()}`) : '')) : '';
    const code = link ? qrFor(link) : null;
    if (code) { const q = Math.min(260 * u, Math.max(150 * u, h - y - 190 * u)); if (q > 120 * u) { drawQr(ctx, code, w / 2 - q / 2, y + 10 * u, q); ctx.fillStyle = hex(pal.soft); ctx.font = fontOf(500, 26 * u, body); ctx.fillText(o.labels.scan, w / 2, y + q + 52 * u); y += q + 70 * u; } }
    if (b.note.trim()) { ctx.fillStyle = hex(pal.soft); ctx.font = `italic ${fontOf(500, 28 * u, body)}`; wrapLines(ctx, b.note, w - 160 * u, 3).forEach((l, i) => ctx.fillText(l, w / 2, Math.max(y + 40 * u, h - 150 * u) + i * 38 * u)); }
  } else {
    drawCover(ctx, w, h, b, products, o);
  }
  ctx.restore();
}

function drawCover(ctx: Ctx, w: number, h: number, b: CatBusiness, products: CatProduct[], o: CatOptions): void {
  const u = w / 1000, pal = o.pal, body = stack(o.bodyFont), head = stack(o.headFont), photos = products.filter((p) => p.image).map((p) => p.image!);
  const onAccent = onColor(pal.accent);
  const title = (x: number, y: number, maxW: number, align: CanvasTextAlign, color: string, size: number): number => {
    ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color; ctx.font = fontOf(700, size, head);
    let s = size; while (ctx.measureText(b.title).width > maxW && s > size * 0.55) { s *= 0.94; ctx.font = fontOf(700, s, head); }
    const lines = wrapLines(ctx, b.title || ' ', maxW, 3); lines.forEach((l, i) => ctx.fillText(l, x, y + i * s * 1.12)); return y + lines.length * s * 1.12;
  };
  if (o.design.cover === 'hero') {
    const ph = h * 0.56;
    if (photos[0]) drawImageIn(ctx, photos[0], 0, 0, w, ph, 'cover', hex(pal.bg2)); else { ctx.fillStyle = alpha(pal.accent2, 0.4); ctx.fillRect(0, 0, w, ph); }
    ctx.fillStyle = hex(pal.accent); ctx.fillRect(0, ph, w, 14 * u);
    ctx.fillStyle = hex(pal.bg); ctx.fillRect(0, ph + 14 * u, w, h - ph);
    if (o.logo) { const k = Math.min(150 * u / o.logo.width, 150 * u / o.logo.height); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(130 * u, 130 * u, 100 * u, 0, 7); ctx.fill(); ctx.drawImage(o.logo.source, 130 * u - o.logo.width * k / 2, 130 * u - o.logo.height * k / 2, o.logo.width * k, o.logo.height * k); }
    const y = title(70 * u, ph + 150 * u, w - 140 * u, 'left', hex(pal.ink), 96 * u);
    ctx.textAlign = 'left'; ctx.fillStyle = hex(pal.accent); ctx.font = fontOf(700, 38 * u, body); ctx.fillText(b.subtitle, 70 * u, y + 20 * u);
    ctx.fillStyle = hex(pal.soft); ctx.font = fontOf(500, 32 * u, body); ctx.fillText(b.name, 70 * u, h - 110 * u); if (b.tagline.trim()) ctx.fillText(b.tagline, 70 * u, h - 66 * u);
  } else if (o.design.cover === 'solid') {
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, hex(pal.bg2)); g.addColorStop(1, hex(pal.bg)); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = hex(pal.accent); ctx.lineWidth = 6 * u; ctx.strokeRect(46 * u, 46 * u, w - 92 * u, h - 92 * u); ctx.lineWidth = 2 * u; ctx.strokeRect(66 * u, 66 * u, w - 132 * u, h - 132 * u);
    if (o.logo) { const k = Math.min(180 * u / o.logo.width, 180 * u / o.logo.height); ctx.drawImage(o.logo.source, w / 2 - o.logo.width * k / 2, h * 0.1, o.logo.width * k, o.logo.height * k); }
    ctx.textAlign = 'center'; ctx.fillStyle = hex(pal.accent); ctx.font = fontOf(700, 34 * u, body); ctx.fillText(b.name.toUpperCase(), w / 2, h * 0.26);
    const y = title(w / 2, h * 0.36, w - 200 * u, 'center', hex(pal.ink), 118 * u);
    ctx.textAlign = 'center'; ctx.fillStyle = hex(pal.soft); ctx.font = fontOf(500, 40 * u, body); ctx.fillText(b.subtitle, w / 2, y + 30 * u);
    const n = Math.min(3, photos.length), pw = 250 * u, gap = 30 * u, x0 = w / 2 - (n * pw + (n - 1) * gap) / 2, py = h * 0.62;
    for (let i = 0; i < n; i += 1) { ctx.save(); roundPath(ctx, x0 + i * (pw + gap), py - (i === 1 ? 50 * u : 0), pw, pw * 1.3, 30 * u); ctx.clip(); drawImageIn(ctx, photos[i]!, x0 + i * (pw + gap), py - (i === 1 ? 50 * u : 0), pw, pw * 1.3, 'cover', hex(pal.bg2)); ctx.restore(); }
    if (b.tagline.trim()) { ctx.textAlign = 'center'; ctx.fillStyle = hex(pal.soft); ctx.font = fontOf(500, 32 * u, body); ctx.fillText(b.tagline, w / 2, h - 120 * u); }
  } else {
    const pw = w * 0.46;
    ctx.fillStyle = hex(pal.accent); ctx.fillRect(0, 0, pw, h);
    const side = [photos[0], photos[1], photos[2]];
    const th = h / 3;
    side.forEach((im, i) => { const x = pw, y = i * th; if (im) drawImageIn(ctx, im, x, y, w - pw, th, 'cover', hex(pal.bg2)); else { ctx.fillStyle = alpha(pal.accent2, 0.3 + i * 0.1); ctx.fillRect(x, y, w - pw, th); } ctx.strokeStyle = hex(pal.bg); ctx.lineWidth = 8 * u; ctx.strokeRect(x, y, w - pw, th); });
    if (o.logo) { const k = Math.min(150 * u / o.logo.width, 150 * u / o.logo.height); ctx.fillStyle = '#fff'; roundPath(ctx, 40 * u, 40 * u, o.logo.width * k + 30 * u, o.logo.height * k + 30 * u, 20 * u); ctx.fill(); ctx.drawImage(o.logo.source, 55 * u, 55 * u, o.logo.width * k, o.logo.height * k); }
    const y = title(44 * u, h * 0.4, pw - 80 * u, 'left', hex(onAccent), 84 * u);
    ctx.textAlign = 'left'; ctx.fillStyle = hex(onAccent); ctx.font = fontOf(500, 34 * u, body); ctx.fillText(b.subtitle, 44 * u, y + 24 * u);
    ctx.font = fontOf(700, 32 * u, body); ctx.fillText(b.name, 44 * u, h - 110 * u); if (b.tagline.trim()) { ctx.font = fontOf(500, 26 * u, body); wrapLines(ctx, b.tagline, pw - 80 * u, 2).forEach((l, i) => ctx.fillText(l, 44 * u, h - 66 * u + i * 32 * u)); }
  }
}
