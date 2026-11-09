import type { PosterTheme } from '../../config/posterThemes';
import { bestDiscount, cleanHandle, discountPercent } from './discount';
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
}

export interface PosterShop { name: string; tagline: string; headline: string; whatsapp: string; facebook: string; instagram: string }

export interface PosterInput {
  shop: PosterShop;
  products: PosterProduct[];
  showBadges: boolean;
  showOfferBadge: boolean;
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

function drawBadge(ctx: CanvasRenderingContext2D, theme: PosterTheme, x: number, y: number, size: number, pct: number, big: boolean) {
  const { badgeBg, badgeInk } = theme.colors;
  const font0 = theme.fonts.headline;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = badgeBg;
  const label = `${pct}%`;
  if (theme.badge === 'burst' || big) {
    const points = 14, outer = size / 2, inner = outer * 0.8;
    ctx.rotate(-0.14);
    ctx.beginPath();
    for (let i = 0; i < points * 2; i += 1) { const r = i % 2 === 0 ? outer : inner; const a = (Math.PI * i) / points; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = badgeInk;
    drawFit(ctx, big ? 'UP TO' : '', 0, -size * 0.27, size * 0.55, size * 0.15, 700, theme.fonts.body, badgeInk, 'center');
    drawFit(ctx, label, 0, big ? size * 0.02 : -size * 0.04, size * 0.7, size * 0.42, 700, font0, badgeInk, 'center');
    drawFit(ctx, 'OFF', 0, big ? size * 0.28 : size * 0.26, size * 0.5, size * 0.17, 700, theme.fonts.body, badgeInk, 'center');
  } else if (theme.badge === 'circle') {
    ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); ctx.fill();
    drawFit(ctx, `-${label}`, size / 2, size / 2, size * 0.78, size * 0.36, 700, font0, badgeInk, 'center');
  } else if (theme.badge === 'ribbon') {
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(size * 1.15, 0); ctx.lineTo(size * 0.95, size * 0.2); ctx.lineTo(size * 1.15, size * 0.4); ctx.lineTo(0, size * 0.4); ctx.closePath(); ctx.fill();
    drawFit(ctx, `${label} OFF`, size * 0.52, size * 0.2, size * 0.88, size * 0.24, 700, font0, badgeInk, 'center');
  } else {
    rrect(ctx, 0, 0, size * 1.1, size * 0.42, size * 0.1); ctx.fill();
    drawFit(ctx, `${label} OFF`, size * 0.55, size * 0.21, size * 0.95, size * 0.26, 700, font0, badgeInk, 'center');
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

function drawCard(ctx: CanvasRenderingContext2D, theme: PosterTheme, r: Rect, p: PosterProduct, showBadge: boolean) {
  const c = theme.colors;
  const unit = Math.min(r.w, r.h * 0.9);
  const radius = { plain: 10, rounded: 26, border: 16, hard: 14, arch: 22, dark: 18, open: 0 }[theme.card];
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
  const pad = clamp(unit * 0.05, 8, 18);
  const horizontal = r.w / r.h > 1.45;
  // Text sizes follow the card, so small cards (many products) stay readable and big cards do not look empty.
  const base = horizontal ? r.h : unit;
  let nameSize = horizontal ? clamp(base * 0.2, 22, 46) : clamp(base * 0.1, 18, 40);
  let priceSize = horizontal ? clamp(base * 0.3, 30, 66) : clamp(base * 0.15, 24, 58);
  let image: Rect;
  let text: Rect;
  if (horizontal) {
    const iw = Math.min(r.h - pad * 2, r.w * 0.42);
    image = { x: r.x + pad, y: r.y + pad, w: iw, h: r.h - pad * 2 };
    text = { x: image.x + image.w + pad * 1.4, y: r.y + pad, w: r.w - iw - pad * 3.4, h: r.h - pad * 2 };
  } else {
    let textH = pad + nameSize * 2.3 + priceSize * 1.25;
    if (textH > r.h * 0.46) { const k = (r.h * 0.46) / textH; nameSize *= k; priceSize *= k; textH = r.h * 0.46; }
    image = { x: r.x + pad, y: r.y + pad, w: r.w - pad * 2, h: r.h - textH - pad };
    text = { x: r.x + pad, y: image.y + image.h + pad * 0.4, w: r.w - pad * 2, h: textH - pad * 0.4 };
  }
  const imgRadius: number | [number, number, number, number] = theme.card === 'arch' ? [image.w / 2, image.w / 2, 8, 8] : theme.card === 'open' ? 6 : Math.max(6, radius - pad * 0.6);
  drawPhoto(ctx, theme, p, image, imgRadius);

  const pct = discountPercent(p.original, p.price);
  if (showBadge && pct > 0) {
    const size = clamp(image.w * 0.27, 54, 124);
    const bx = theme.badge === 'ribbon' ? image.x : image.x + (theme.badge === 'tag' ? 8 : 6);
    const by = theme.badge === 'ribbon' ? image.y + 12 : image.y + (theme.badge === 'burst' ? size / 2 + 4 : 8);
    drawBadge(ctx, theme, theme.badge === 'burst' ? bx + size / 2 : bx, by, size, pct, false);
  }

  // Name (up to two lines), then prices.
  ctx.font = font(700, nameSize, theme.fonts.body);
  const lines = wrapLines(ctx, p.name, text.w, horizontal ? 3 : 2);
  const lineH = nameSize * 1.15;
  ctx.fillStyle = c.cardInk;
  ctx.textAlign = horizontal ? 'left' : 'center';
  ctx.textBaseline = 'top';
  const nameTop = horizontal ? text.y + Math.max(0, (text.h - lines.length * lineH - priceSize * 1.5) / 2) : text.y;
  const tx = horizontal ? text.x : text.x + text.w / 2;
  lines.forEach((line, i) => ctx.fillText(line, tx, nameTop + i * lineH));
  const priceY = horizontal ? nameTop + lines.length * lineH + priceSize * 0.65 : text.y + text.h - priceSize * 0.62;
  drawPrices(ctx, theme, p, tx, priceY, text.w, priceSize, horizontal ? 'left' : 'center');
  ctx.restore();
}

function drawPrices(ctx: CanvasRenderingContext2D, theme: PosterTheme, p: PosterProduct, x: number, cy: number, maxW: number, size: number, align: 'left' | 'center') {
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
  const startX = align === 'center' ? x - total / 2 : x;
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
  const layout = computeLayout(format, 1, theme.layout);
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
  const top = bestDiscount(input.products);
  const showOffer = input.showOfferBadge && input.showBadges && top > 0;
  const hc = { ...headerContent };
  if (theme.header === 'diagonal') hc.h -= header.h * 0.06;
  const badgeD = showOffer ? Math.min(hc.h * 0.95, 250) : 0;
  const textW = hc.w - (badgeD ? badgeD + 24 : 0);
  const center = theme.header === 'center';
  const align: CanvasTextAlign = center ? 'center' : 'left';
  const tx = center ? hc.x + textW / 2 : hc.x;
  const hasHeadline = shop.headline.trim() !== '';
  const name = shop.name.trim();
  const tagline = shop.tagline.trim();
  const rows = hasHeadline ? { name: 0.2, headline: 0.5, tagline: 0.18 } : { name: 0.46, headline: 0, tagline: 0.22 };
  const used = rows.name + rows.headline + rows.tagline;
  const gap = (1 - used) / 4;
  let y = hc.y + hc.h * gap * 1.5;
  const nameH = hc.h * rows.name;
  drawFit(ctx, name, tx, y + nameH / 2, textW, nameH * 0.95, 700, theme.fonts.name, c.nameInk, align);
  y += nameH + hc.h * gap;
  if (hasHeadline) {
    const headH = hc.h * rows.headline;
    const text = shop.headline.trim();
    if (center) {
      const size = fitSize(ctx, text, 700, theme.fonts.headline, textW - 70, headH * 1.05);
      ctx.font = font(700, size, theme.fonts.headline);
      const w = ctx.measureText(text).width + 70;
      ctx.fillStyle = c.headerBg; rrect(ctx, tx - w / 2, y, w, headH, headH * 0.22); ctx.fill();
      drawFit(ctx, text, tx, y + headH * 0.54, textW - 70, headH * 1.05, 700, theme.fonts.headline, c.headlineInk, 'center');
    } else {
      drawFit(ctx, text, tx, y + headH * 0.52, textW, headH * 1.1, 700, theme.fonts.headline, c.headlineInk, 'left');
    }
    y += headH + hc.h * gap;
  }
  drawFit(ctx, tagline, tx, y + (hc.h * rows.tagline) / 2, textW, hc.h * rows.tagline * 0.85, 500, theme.fonts.body, c.taglineInk, align);
  if (showOffer) drawBadge(ctx, theme, hc.x + hc.w - badgeD / 2, hc.y + hc.h / 2, badgeD, top, true);
}

function drawFooter(ctx: CanvasRenderingContext2D, theme: PosterTheme, format: PosterFormat, input: PosterInput) {
  const c = theme.colors;
  const layout = computeLayout(format, 1, theme.layout);
  const { footer, footerContent } = layout;
  ctx.fillStyle = c.footerBg;
  ctx.fillRect(0, footer.y, footer.w, format.h - footer.y);
  const items = [
    { kind: 'whatsapp' as const, text: input.shop.whatsapp.trim() },
    { kind: 'facebook' as const, text: cleanHandle(input.shop.facebook, 'facebook') },
    { kind: 'instagram' as const, text: cleanHandle(input.shop.instagram, 'instagram') },
  ].filter((item) => item.text);
  if (items.length === 0) return;
  const slot = footerContent.w / items.length;
  const d = footerContent.h * 0.5;
  items.forEach((item, i) => {
    const sx = footerContent.x + i * slot;
    const cy = footerContent.y + footerContent.h / 2;
    ctx.fillStyle = c.footerInk;
    ctx.beginPath(); ctx.arc(sx + d / 2, cy, d / 2, 0, Math.PI * 2); ctx.fill();
    drawGlyph(ctx, item.kind, sx + d / 2, cy, d * 0.56, c.footerBg);
    drawFit(ctx, item.text, sx + d + 12, cy, slot - d - 24, footerContent.h * 0.3, 600, theme.fonts.body, c.footerInk, 'left');
  });
}

/** Draws the whole poster at format size. Callers scale the context to draw a smaller copy. */
export function renderPoster(ctx: CanvasRenderingContext2D, theme: PosterTheme, format: PosterFormat, input: PosterInput, count: number) {
  ctx.save();
  ctx.imageSmoothingQuality = 'high';
  drawBackground(ctx, theme, format.w, format.h);
  const layout = computeLayout(format, count, theme.layout);
  input.products.slice(0, count).forEach((product, i) => {
    const cell = layout.cells[i];
    if (cell) drawCard(ctx, theme, cell, product, input.showBadges);
  });
  drawHeader(ctx, theme, format, input);
  drawFooter(ctx, theme, format, input);
  ctx.restore();
}
