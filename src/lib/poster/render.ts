import type { PosterTheme } from '../../config/posterThemes';
import { cleanHandle } from './discount';
import { facebookLink, instagramLink, whatsappLink } from './links';
import { encodeQr, type QrCode } from '../qr/encoder';
import { computeLayout, type PosterFormat, type Rect } from './layout';

export interface PosterProduct {
  name: string;
  original: string;
  price: string;
  image: CanvasImageSource | null;
  /** Pixel size of `image`. */
  iw: number;
  ih: number;
  /** 1 to 3; larger crops closer. */
  zoom: number;
  /** -1 (left or top) to 1 (right or bottom) when zoomed in. */
  offsetX: number;
  offsetY: number;
  fit: 'cover' | 'contain';
  /** Text on the photo corner, such as "29% OFF", "Rs 200 off" or "NEW". Empty hides it. */
  badge: string;
}

export interface PosterShop { name: string; tagline: string; headline: string; whatsapp: string; facebook: string; instagram: string; /** Added in front of a short WhatsApp number when building its QR link, e.g. 91. */ countryCode?: string }

/** Where an editable element was drawn, in poster pixels. Ids: shop.name, shop.tagline, footer.whatsapp, footer.facebook, footer.instagram, p<N>.photo, p<N>.name, p<N>.price. */
export interface Hit { id: string; rect: Rect }

/** Which part gets more room: the photos (default look), a balance, or the names and prices. */
export type Emphasis = 'photos' | 'balanced' | 'text';
const TEXT_SCALE: Record<Emphasis, number> = { photos: 0.85, balanced: 1, text: 1.3 };
const TEXT_SHARE: Record<Emphasis, number> = { photos: 0.28, balanced: 0.34, text: 0.45 };

export interface PosterInput {
  shop: PosterShop;
  products: PosterProduct[];
  emphasis: Emphasis;
  /** Text in the big header badge, such as "UP TO 30% OFF" or "DIWALI SPECIAL". Empty hides it. */
  offerBadge: string;
  /** Show a scannable QR code above each contact (WhatsApp, Facebook, Instagram). */
  qr?: boolean;
  /** Set by editors that overlay pencil buttons: draws hints for empty fields and records where each element sits. */
  edit?: { hits: Hit[] };
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const font = (weight: number | string, size: number, family: string) => `${weight} ${Math.max(6, Math.round(size))}px ${family}`;

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | [number, number, number, number]) {
  const [tl, tr, br, bl] = typeof r === 'number' ? [r, r, r, r] : r;
  const m = Math.min(w, h) / 2;
  const a = Math.min(tl, m), b = Math.min(tr, m), c = Math.min(br, m), d = Math.min(bl, m);
  ctx.beginPath();
  ctx.moveTo(x + a, y);
  ctx.lineTo(x + w - b, y);
  ctx.arcTo(x + w, y, x + w, y + b, b);
  ctx.lineTo(x + w, y + h - c);
  ctx.arcTo(x + w, y + h, x + w - c, y + h, c);
  ctx.lineTo(x + d, y + h);
  ctx.arcTo(x, y + h, x, y + h - d, d);
  ctx.lineTo(x, y + a);
  ctx.arcTo(x, y, x + a, y, a);
  ctx.closePath();
}

/** Largest font size, up to maxSize, at which the text is no wider than maxW. */
function fitSize(ctx: CanvasRenderingContext2D, text: string, weight: number | string, family: string, maxW: number, maxSize: number, minSize = 8): number {
  ctx.font = font(weight, maxSize, family);
  const width = ctx.measureText(text).width;
  return width <= maxW ? maxSize : Math.max(minSize, maxSize * (maxW / width));
}

function drawFit(ctx: CanvasRenderingContext2D, text: string, x: number, cy: number, maxW: number, maxSize: number, weight: number | string, family: string, color: string, align: CanvasTextAlign): number {
  if (!text) return 0;
  const size = fitSize(ctx, text, weight, family, maxW, maxSize);
  ctx.font = font(weight, size, family);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, cy);
  return size;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxW || !current) current = next;
    else { lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1]!;
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxW) last = last.slice(0, -1);
    kept[maxLines - 1] = `${last}…`;
    return kept;
  }
  return lines;
}

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function drawBackground(ctx: CanvasRenderingContext2D, theme: PosterTheme, w: number, h: number) {
  const { bg, bg2, accent } = theme.colors;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  switch (theme.background) {
    case 'gradient': {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, bg); g.addColorStop(1, bg2);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'dots':
      ctx.fillStyle = bg2;
      for (let y = 20; y < h; y += 44) for (let x = ((y / 44) % 2) * 22 + 20; x < w; x += 44) { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'stripes':
      ctx.save(); ctx.fillStyle = bg2; ctx.translate(w / 2, h / 2); ctx.rotate(-Math.PI / 5);
      for (let x = -Math.max(w, h); x < Math.max(w, h); x += 90) ctx.fillRect(x, -Math.max(w, h), 40, Math.max(w, h) * 2);
      ctx.restore();
      break;
    case 'grid':
      ctx.strokeStyle = bg2; ctx.lineWidth = 2;
      for (let x = 0; x < w; x += 54) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 54) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      break;
    case 'confetti': {
      const rand = seeded(7);
      const colours = [bg2, '#ffffff', '#2dd4bf', accent];
      for (let i = 0; i < 90; i += 1) {
        ctx.save(); ctx.translate(rand() * w, rand() * h); ctx.rotate(rand() * Math.PI);
        ctx.fillStyle = colours[i % colours.length]!; ctx.globalAlpha = 0.55;
        if (i % 3 === 0) { ctx.beginPath(); ctx.arc(0, 0, 8 + rand() * 8, 0, Math.PI * 2); ctx.fill(); } else ctx.fillRect(-4, -12, 8, 24 + rand() * 14);
        ctx.restore();
      }
      break;
    }
    default:
  }
}

function drawGlyph(ctx: CanvasRenderingContext2D, kind: 'whatsapp' | 'facebook' | 'instagram', cx: number, cy: number, size: number, color: string) {
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  if (kind === 'whatsapp') ctx.fill(new Path2D('M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z'));
  else if (kind === 'facebook') ctx.fill(new Path2D('M14 8h3V4.4c-.5-.1-1.6-.2-2.8-.2-2.8 0-4.7 1.7-4.7 4.8v2.7H6.4v4h3.1V24h3.8v-8.3h3.1l.5-4h-3.6V9.4c0-1.1.3-1.4.7-1.4Z'));
  else {
    ctx.lineWidth = 2; ctx.lineCap = 'round';
    rrect(ctx, 3.5, 3.5, 17, 17, 5); ctx.stroke();
    ctx.beginPath(); ctx.arc(12, 12, 4, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(17.3, 6.7, 0.9, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/** Splits badge text into up to three lines. A line with a number is drawn big: "UP TO 30% OFF" becomes UP TO / 30% / OFF. */
export function badgeLines(text: string): { t: string; big: boolean }[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const at = words.findIndex((w) => /\d/.test(w));
  if (at >= 0) {
    const lines = [] as { t: string; big: boolean }[];
    if (at > 0) lines.push({ t: words.slice(0, at).join(' '), big: false });
    lines.push({ t: words[at], big: true });
    if (at < words.length - 1) lines.push({ t: words.slice(at + 1).join(' '), big: false });
    return lines.slice(0, 3);
  }
  if (words.length <= 3) return words.length === 1 ? [{ t: words[0], big: true }] : words.map((t) => ({ t, big: false }));
  const per = Math.ceil(words.length / 3);
  return [0, 1, 2].map((i) => ({ t: words.slice(i * per, i * per + per).join(' '), big: false })).filter((l) => l.t);
}

/** Draws stacked badge text centred on (cx, cy), inside a box of the given width. */
function drawBadgeText(ctx: CanvasRenderingContext2D, theme: PosterTheme, text: string, cx: number, cy: number, w: number, size: number) {
  const lines = badgeLines(text);
  if (!lines.length) return;
  const anyBig = lines.some((l) => l.big);
  const heights = lines.map((l) => (anyBig ? (l.big ? size * 0.4 : size * 0.16) : lines.length === 1 ? size * 0.34 : size * 0.22));
  const total = heights.reduce((a, b) => a + b, 0) + (lines.length - 1) * size * 0.02;
  let y = cy - total / 2;
  lines.forEach((l, i) => {
    drawFit(ctx, l.t.toUpperCase(), cx, y + heights[i] / 2, w, heights[i], 700, l.big ? theme.fonts.headline : theme.fonts.body, theme.colors.badgeInk, 'center');
    y += heights[i] + size * 0.02;
  });
}

function drawBadge(ctx: CanvasRenderingContext2D, theme: PosterTheme, x: number, y: number, size: number, text: string, big: boolean) {
  const { badgeBg, badgeInk } = theme.colors;
  const one = text.trim().toUpperCase();
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = badgeBg;
  if (theme.badge === 'burst' || big) {
    const points = 14, outer = size / 2, inner = outer * 0.8;
    ctx.rotate(-0.14);
    ctx.beginPath();
    for (let i = 0; i < points * 2; i += 1) { const r = i % 2 === 0 ? outer : inner; const a = (Math.PI * i) / points; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill();
    drawBadgeText(ctx, theme, text, 0, 0, size * 0.66, size);
  } else if (theme.badge === 'circle') {
    ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); ctx.fill();
    drawBadgeText(ctx, theme, text, size / 2, size / 2, size * 0.7, size);
  } else if (theme.badge === 'ribbon') {
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(size * 1.15, 0); ctx.lineTo(size * 0.95, size * 0.2); ctx.lineTo(size * 1.15, size * 0.4); ctx.lineTo(0, size * 0.4); ctx.closePath(); ctx.fill();
    drawFit(ctx, one, size * 0.52, size * 0.2, size * 0.88, size * 0.24, 700, theme.fonts.headline, badgeInk, 'center');
  } else {
    rrect(ctx, 0, 0, size * 1.1, size * 0.42, size * 0.1); ctx.fill();
    drawFit(ctx, one, size * 0.55, size * 0.21, size * 0.95, size * 0.26, 700, theme.fonts.headline, badgeInk, 'center');
  }
  ctx.restore();
}

function drawPhoto(ctx: CanvasRenderingContext2D, theme: PosterTheme, p: PosterProduct, r: Rect, radius: number | [number, number, number, number]) {
  ctx.save();
  rrect(ctx, r.x, r.y, r.w, r.h, radius);
  ctx.clip();
  if (!p.image || p.iw <= 0 || p.ih <= 0) {
    ctx.fillStyle = theme.colors.bg2;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = theme.colors.accent; ctx.lineWidth = 4; ctx.globalAlpha = 0.5;
    const s = Math.min(r.w, r.h) * 0.3;
    rrect(ctx, r.x + r.w / 2 - s / 2, r.y + r.h / 2 - s / 2, s, s * 0.8, s * 0.1); ctx.stroke();
  } else if (p.fit === 'contain') {
    ctx.fillStyle = theme.colors.card === theme.colors.bg ? theme.colors.bg2 : theme.colors.card;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    const scale = Math.min(r.w / p.iw, r.h / p.ih);
    ctx.drawImage(p.image, r.x + (r.w - p.iw * scale) / 2, r.y + (r.h - p.ih * scale) / 2, p.iw * scale, p.ih * scale);
  } else {
    const scale = Math.max(r.w / p.iw, r.h / p.ih) * clamp(p.zoom, 1, 3);
    const sw = r.w / scale, sh = r.h / scale;
    const sx = (p.iw - sw) / 2 + clamp(p.offsetX, -1, 1) * ((p.iw - sw) / 2);
    const sy = (p.ih - sh) / 2 + clamp(p.offsetY, -1, 1) * ((p.ih - sh) / 2);
    ctx.drawImage(p.image, sx, sy, sw, sh, r.x, r.y, r.w, r.h);
  }
  ctx.restore();
}

function drawCard(ctx: CanvasRenderingContext2D, theme: PosterTheme, r: Rect, p0: PosterProduct, emphasis: Emphasis, index: number, hits?: Hit[]) {
  const editing = !!hits;
  const noName = editing && p0.name.trim() === '';
  const noPrice = editing && p0.price.trim() === '' && p0.original.trim() === '';
  const p: PosterProduct = { ...p0, name: noName ? 'Add name' : p0.name, price: noPrice ? 'Add price' : p0.price };
  const c = theme.colors;
  const unit = Math.min(r.w, r.h * 0.9);
  const radius = { plain: 10, rounded: 26, border: 16, hard: 14, arch: 22, dark: 18, open: 0 }[theme.card] * clamp(unit / 380, 0.45, 1);
  ctx.save();
  if (theme.card === 'hard') { ctx.fillStyle = c.accent; rrect(ctx, r.x + 9, r.y + 9, r.w, r.h, radius); ctx.fill(); }
  if (theme.card !== 'open') {
    ctx.save();
    if (theme.card === 'plain' || theme.card === 'rounded' || theme.card === 'arch') { ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6; }
    if (theme.card === 'dark') { ctx.shadowColor = c.accent; ctx.shadowBlur = 16; }
    ctx.fillStyle = c.card; rrect(ctx, r.x, r.y, r.w, r.h, radius); ctx.fill();
    ctx.restore();
    if (theme.card === 'border' || theme.card === 'dark') { ctx.strokeStyle = c.accent; ctx.lineWidth = theme.card === 'dark' ? 3 : 5; rrect(ctx, r.x, r.y, r.w, r.h, radius); ctx.stroke(); }
    if (theme.card === 'hard') { ctx.strokeStyle = '#111111'; ctx.lineWidth = 5; rrect(ctx, r.x, r.y, r.w, r.h, radius); ctx.stroke(); }
  }
  const pad = clamp(unit * 0.045, 6, 16);
  const name = p.name.trim();
  const hasPrice = p.price.trim() !== '' || p.original.trim() !== '';
  const horizontal = theme.layout === 'list' && r.w / r.h > 1.45;
  const k = TEXT_SCALE[emphasis];
  let image: Rect;
  let text: Rect;
  let nameSize: number;
  let priceSize: number;
  let lines: string[] = [];
  if (horizontal) {
    nameSize = clamp(r.h * 0.24 * k, 20, 54);
    priceSize = clamp(r.h * 0.32 * k, 28, 72);
    const iw = Math.min(r.h - pad * 2, r.w * 0.4);
    image = { x: r.x + pad, y: r.y + pad, w: iw, h: r.h - pad * 2 };
    text = { x: image.x + image.w + pad * 1.6, y: r.y + pad, w: r.w - iw - pad * 3.6, h: r.h - pad * 2 };
    ctx.font = font(700, nameSize, theme.fonts.body);
    // Name on the left, price at the right edge of the row.
    lines = name ? wrapLines(ctx, name, text.w * (hasPrice ? 0.58 : 1), 2) : [];
  } else {
    // The photo takes what the text does not need: text is capped to a share of the card, smaller when photos are favoured.
    nameSize = clamp(unit * 0.085 * k, 16, 44);
    priceSize = clamp(unit * 0.13 * k, 22, 60);
    const budget = r.h * TEXT_SHARE[emphasis] - pad;
    const measure = () => {
      ctx.font = font(700, nameSize, theme.fonts.body);
      lines = name ? wrapLines(ctx, name, r.w - pad * 2, r.w > 300 ? 2 : 1) : [];
      return (lines.length ? lines.length * nameSize * 1.15 + pad * 0.4 : 0) + (hasPrice ? priceSize * 1.3 : 0);
    };
    let need = measure();
    for (let i = 0; i < 6 && need > budget && need > 0; i += 1) { const f = Math.max(0.6, budget / need); nameSize *= f; priceSize *= f; need = measure(); }
    const textH = need > 0 ? need + pad : 0;
    image = { x: r.x + pad, y: r.y + pad, w: r.w - pad * 2, h: r.h - textH - pad * (textH ? 1 : 2) };
    text = { x: r.x + pad, y: image.y + image.h + pad * 0.5, w: r.w - pad * 2, h: Math.max(0, textH - pad * 0.5) };
  }
  const imgRadius: number | [number, number, number, number] = theme.card === 'arch' ? [image.w / 2, image.w / 2, 8, 8] : theme.card === 'open' ? 6 : Math.max(5, radius - pad * 0.6);
  drawPhoto(ctx, theme, p, image, imgRadius);

  hits?.push({ id: `p${index}.photo`, rect: image });
  const badgeText = p.badge.trim();
  if (badgeText) {
    const size = clamp(image.w * 0.3, 44, 130);
    const bx = theme.badge === 'ribbon' ? image.x : image.x + (theme.badge === 'tag' ? 8 : 6);
    const by = theme.badge === 'ribbon' ? image.y + 12 : image.y + (theme.badge === 'burst' ? size / 2 + 4 : 8);
    drawBadge(ctx, theme, theme.badge === 'burst' ? bx + size / 2 : bx, by, size, badgeText, false);
  }

  const lineH = nameSize * 1.15;
  ctx.fillStyle = c.cardInk;
  ctx.textAlign = horizontal ? 'left' : 'center';
  ctx.textBaseline = 'top';
  ctx.font = font(700, nameSize, theme.fonts.body);
  const nameTop = horizontal ? text.y + Math.max(0, (text.h - lines.length * lineH) / 2) : text.y;
  const tx = horizontal ? text.x : text.x + text.w / 2;
  if (noName) ctx.globalAlpha = 0.45;
  lines.forEach((line, i) => ctx.fillText(line, tx, nameTop + i * lineH));
  ctx.globalAlpha = 1;
  if (lines.length) hits?.push({ id: `p${index}.name`, rect: horizontal ? { x: text.x, y: nameTop, w: text.w, h: lines.length * lineH } : { x: text.x, y: text.y, w: text.w, h: lines.length * lineH } });
  if (hasPrice) {
    const priceY = horizontal ? text.y + text.h / 2 : text.y + text.h - priceSize * 0.62;
    if (noPrice) ctx.globalAlpha = 0.45;
    if (horizontal) drawPrices(ctx, theme, p, text.x + text.w, priceY, text.w * 0.42, priceSize, 'right');
    else drawPrices(ctx, theme, p, tx, priceY, text.w, priceSize, 'center');
    ctx.globalAlpha = 1;
    hits?.push({ id: `p${index}.price`, rect: horizontal ? { x: text.x + text.w * 0.58, y: priceY - priceSize * 0.65, w: text.w * 0.42, h: priceSize * 1.3 } : { x: text.x, y: priceY - priceSize * 0.65, w: text.w, h: priceSize * 1.3 } });
  }
  ctx.restore();
}

function drawPrices(ctx: CanvasRenderingContext2D, theme: PosterTheme, p: PosterProduct, x: number, cy: number, maxW: number, size: number, align: 'left' | 'center' | 'right') {
  const c = theme.colors;
  const price = p.price.trim();
  const old = p.original.trim();
  if (!price && !old) return;
  let s = size;
  const widths = (k: number) => {
    ctx.font = font(700, s * k, theme.fonts.headline);
    return { a: ctx.measureText(price).width, b: old ? (ctx.font = font(500, s * 0.62 * k, theme.fonts.body), ctx.measureText(old).width) : 0 };
  };
  let m = widths(1);
  const gap = old && price ? s * 0.35 : 0;
  while (m.a + m.b + gap > maxW && s > 12) { s *= 0.92; m = widths(1); }
  const total = m.a + m.b + gap;
  const startX = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  if (price) { ctx.font = font(700, s * 1.05, theme.fonts.headline); ctx.fillStyle = c.price; ctx.fillText(price, startX, cy); }
  if (old) {
    const ox = startX + m.a + gap;
    ctx.font = font(500, s * 0.62, theme.fonts.body); ctx.fillStyle = c.oldPrice; ctx.fillText(old, ox, cy + s * 0.04);
    ctx.strokeStyle = c.oldPrice; ctx.lineWidth = Math.max(2, s * 0.06);
    ctx.beginPath(); ctx.moveTo(ox - 2, cy + s * 0.06); ctx.lineTo(ox + m.b + 2, cy - s * 0.04); ctx.stroke();
  }
}

function drawHeader(ctx: CanvasRenderingContext2D, theme: PosterTheme, format: PosterFormat, input: PosterInput) {
  const c = theme.colors;
  const layout = computeLayout(format, 1, theme.layout, input.qr);
  const { header, headerContent } = layout;
  if (theme.header === 'band') {
    ctx.fillStyle = c.headerBg; ctx.fillRect(0, 0, header.w, header.h);
    ctx.fillStyle = c.accent === c.headerBg ? c.nameInk : c.accent; ctx.fillRect(0, header.h - 8, header.w, 8);
  } else if (theme.header === 'diagonal') {
    const slant = Math.round(header.h * 0.09);
    ctx.fillStyle = c.accent; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(header.w, 0); ctx.lineTo(header.w, header.h - slant + 12); ctx.lineTo(0, header.h + 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c.headerBg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(header.w, 0); ctx.lineTo(header.w, header.h - slant); ctx.lineTo(0, header.h); ctx.closePath(); ctx.fill();
  }
  const { shop } = input;
  const offer = input.offerBadge.trim();
  const hc = { ...headerContent };
  if (theme.header === 'diagonal') hc.h -= header.h * 0.06;
  const badgeD = offer ? Math.min(hc.h * 0.95, 250) : 0;
  const textW = hc.w - (badgeD ? badgeD + 24 : 0);
  const center = theme.header === 'center';
  const align: CanvasTextAlign = center ? 'center' : 'left';
  const tx = center ? hc.x + textW / 2 : hc.x;
  const editing = !!input.edit;
  const name = shop.name.trim() || (editing ? 'Shop name' : '');
  const headline = shop.headline.trim();
  const tagline = shop.tagline.trim() || (editing ? 'Add a line about your offer' : '');
  // Every line is optional; the ones that are filled share the header, each with a cap so a single line does not become huge.
  const weights = headline ? { name: 0.2, headline: 0.5, tagline: 0.18 } : { name: 0.46, headline: 0, tagline: 0.22 };
  const present = (['name', 'headline', 'tagline'] as const).filter((key) => ({ name, headline, tagline })[key]);
  const used = present.reduce((sum, key) => sum + weights[key], 0);
  const scale = present.length && used < 0.55 ? Math.min(1.7, 0.7 / used) : 1;
  const heights = { name: hc.h * weights.name * scale, headline: hc.h * weights.headline * scale, tagline: hc.h * weights.tagline * scale };
  const total = present.reduce((sum, key) => sum + heights[key], 0);
  const gap = Math.max(0, (hc.h - total) / (present.length + 1));
  let y = hc.y + gap;
  present.forEach((key) => {
    const h = heights[key];
    if (key === 'name' || key === 'tagline') {
      const empty = key === 'name' ? shop.name.trim() === '' : shop.tagline.trim() === '';
      if (editing && empty) ctx.globalAlpha = 0.5;
      if (key === 'name') drawFit(ctx, name, tx, y + h / 2, textW, h * 0.95, 700, theme.fonts.name, c.nameInk, align);
      else drawFit(ctx, tagline, tx, y + h / 2, textW, h * 0.85, 500, theme.fonts.body, c.taglineInk, align);
      ctx.globalAlpha = 1;
      input.edit?.hits.push({ id: key === 'name' ? 'shop.name' : 'shop.tagline', rect: { x: hc.x, y, w: textW, h } });
    }
    else if (key === 'headline') {
      if (center) {
        const size = fitSize(ctx, headline, 700, theme.fonts.headline, textW - 70, h * 1.05);
        ctx.font = font(700, size, theme.fonts.headline);
        const w = ctx.measureText(headline).width + 70;
        ctx.fillStyle = c.headerBg; rrect(ctx, tx - w / 2, y, w, h, h * 0.22); ctx.fill();
        drawFit(ctx, headline, tx, y + h * 0.54, textW - 70, h * 1.05, 700, theme.fonts.headline, c.headlineInk, 'center');
      } else {
        drawFit(ctx, headline, tx, y + h * 0.52, textW, h * 1.1, 700, theme.fonts.headline, c.headlineInk, 'left');
      }
    }
    y += h + gap;
  });
  if (offer) drawBadge(ctx, theme, hc.x + hc.w - badgeD / 2, hc.y + hc.h / 2, badgeD, offer, true);
}

const qrCache = new Map<string, QrCode | null>();
function qrFor(link: string): QrCode | null {
  if (!qrCache.has(link)) {
    let code: QrCode | null = null;
    try { code = encodeQr(link, 'M'); } catch { code = null; }
    qrCache.set(link, code);
  }
  return qrCache.get(link) ?? null;
}

/** A QR code on a white rounded plate (dark modules on light, so every phone can scan it), pixel-aligned so edges stay sharp. */
function drawQr(ctx: CanvasRenderingContext2D, code: QrCode, x: number, y: number, size: number) {
  const quiet = 2;
  const total = code.size + quiet * 2;
  ctx.fillStyle = '#ffffff';
  rrect(ctx, x, y, size, size, size * 0.07); ctx.fill();
  ctx.fillStyle = '#000000';
  const at = (i: number) => Math.round((i * size) / total);
  for (let r = 0; r < code.size; r += 1) {
    for (let c = 0; c < code.size; c += 1) {
      if (!code.modules[r][c]) continue;
      const x0 = x + at(c + quiet), x1 = x + at(c + quiet + 1);
      const y0 = y + at(r + quiet), y1 = y + at(r + quiet + 1);
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
  }
}

function drawFooter(ctx: CanvasRenderingContext2D, theme: PosterTheme, format: PosterFormat, input: PosterInput) {
  const c = theme.colors;
  const layout = computeLayout(format, 1, theme.layout, input.qr);
  const { footer, footerContent } = layout;
  ctx.fillStyle = c.footerBg;
  ctx.fillRect(0, footer.y, footer.w, format.h - footer.y);
  const editing = !!input.edit;
  const items = [
    { kind: 'whatsapp' as const, text: input.shop.whatsapp.trim(), hint: 'WhatsApp number', link: whatsappLink(input.shop.whatsapp, input.shop.countryCode) },
    { kind: 'facebook' as const, text: cleanHandle(input.shop.facebook, 'facebook'), hint: 'Facebook page', link: facebookLink(input.shop.facebook) },
    { kind: 'instagram' as const, text: cleanHandle(input.shop.instagram, 'instagram'), hint: 'Instagram ID', link: instagramLink(input.shop.instagram) },
  ].map((item) => ({ ...item, empty: !item.text, text: item.text || (editing ? item.hint : '') })).filter((item) => item.text);
  if (items.length === 0) return;
  if (input.qr) {
    // Each contact gets a QR code with its icon and name underneath.
    const h = footerContent.h;
    const slot = footerContent.w / items.length;
    const top = h * 0.07;
    const q = Math.min(Math.round(h * 0.6), Math.round(slot * 0.8));
    const rest = h - top - q;
    const d = rest * 0.62;
    items.forEach((item, i) => {
      const cx = footerContent.x + slot * i + slot / 2;
      const code = item.empty ? null : qrFor(item.link);
      if (code) drawQr(ctx, code, Math.round(cx - q / 2), Math.round(footerContent.y + top), q);
      else if (editing) { ctx.strokeStyle = c.footerInk; ctx.globalAlpha = 0.4; ctx.setLineDash([8, 6]); ctx.lineWidth = 3; rrect(ctx, cx - q / 2, footerContent.y + top, q, q, q * 0.07); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
      const cy = footerContent.y + top + q + rest / 2;
      let size = Math.min(rest * 0.52, 34);
      const maxText = slot * 0.92 - d - 10;
      ctx.font = font(700, size, theme.fonts.body);
      while (size > 10 && ctx.measureText(item.text).width > maxText) { size *= 0.94; ctx.font = font(700, size, theme.fonts.body); }
      const tw = ctx.measureText(item.text).width;
      const start = cx - (d + 10 + tw) / 2;
      ctx.fillStyle = c.footerInk;
      ctx.beginPath(); ctx.arc(start + d / 2, cy, d / 2, 0, Math.PI * 2); ctx.fill();
      drawGlyph(ctx, item.kind, start + d / 2, cy, d * 0.56, c.footerBg);
      ctx.fillStyle = c.footerInk; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      if (editing && item.empty) ctx.globalAlpha = 0.5;
      ctx.fillText(item.text, start + d + 10, cy);
      ctx.globalAlpha = 1;
      input.edit?.hits.push({ id: `footer.${item.kind}`, rect: { x: footerContent.x + slot * i, y: footerContent.y, w: slot, h } });
    });
    return;
  }
  // Icon plus text for each contact, sized to its own text and spread evenly across the footer.
  const d = footerContent.h * 0.5;
  const icon = d + 14;
  let size = footerContent.h * 0.34;
  const widthAt = (px: number) => items.map((item) => { ctx.font = font(700, px, theme.fonts.body); return icon + ctx.measureText(item.text).width; });
  const minGap = footerContent.w * 0.03;
  while (size > 12 && widthAt(size).reduce((a, b) => a + b, 0) + minGap * (items.length + 1) > footerContent.w) size *= 0.94;
  const widths = widthAt(size);
  const gap = Math.max(minGap, (footerContent.w - widths.reduce((a, b) => a + b, 0)) / (items.length + 1));
  const cy = footerContent.y + footerContent.h / 2;
  let x = footerContent.x + gap;
  items.forEach((item, i) => {
    ctx.fillStyle = c.footerInk;
    ctx.beginPath(); ctx.arc(x + d / 2, cy, d / 2, 0, Math.PI * 2); ctx.fill();
    drawGlyph(ctx, item.kind, x + d / 2, cy, d * 0.56, c.footerBg);
    ctx.font = font(700, size, theme.fonts.body);
    ctx.fillStyle = c.footerInk; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    if (editing && item.empty) ctx.globalAlpha = 0.5;
    ctx.fillText(item.text, x + icon, cy);
    ctx.globalAlpha = 1;
    input.edit?.hits.push({ id: `footer.${item.kind}`, rect: { x, y: footerContent.y, w: widths[i], h: footerContent.h } });
    x += widths[i] + gap;
  });
}

/** Draws the whole poster at format size. Callers scale the context to draw a smaller copy. */
export function renderPoster(ctx: CanvasRenderingContext2D, theme: PosterTheme, format: PosterFormat, input: PosterInput, count: number) {
  ctx.save();
  ctx.imageSmoothingQuality = 'high';
  drawBackground(ctx, theme, format.w, format.h);
  const layout = computeLayout(format, count, theme.layout, input.qr);
  input.products.slice(0, count).forEach((product, i) => {
    const cell = layout.cells[i];
    if (cell) drawCard(ctx, theme, cell, product, input.emphasis, i, input.edit?.hits);
  });
  drawHeader(ctx, theme, format, input);
  drawFooter(ctx, theme, format, input);
  ctx.restore();
}
