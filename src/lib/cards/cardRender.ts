import { FONT_STACKS, readableOn, readableOnGradient, shade, tint } from '../careers/resumeTemplates';
import type { QrCode } from '../qr/encoder';
import type { CardFill, CardTemplateSpec } from './cardTemplates';

/** Card size in pixels: 3.5 x 2 inches at 300 dpi. */
export const CARD_W = 1050;
export const CARD_H = 600;
const PAD = 64;
const QR_SIZE = 150;

export interface CardData {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

type Ctx = CanvasRenderingContext2D;

const setFont = (ctx: Ctx, weight: number | string, size: number, family: string) => { ctx.font = `${weight} ${size}px ${family}`; };

/** Draws one line of text, shrinking the font until it fits the width. */
function line(ctx: Ctx, text: string, x: number, y: number, o: { align: CanvasTextAlign; color: string; weight: number | string; size: number; family: string; maxW: number }) {
  if (!text) return;
  let size = o.size;
  setFont(ctx, o.weight, size, o.family);
  while (size > 16 && ctx.measureText(text).width > o.maxW) { size -= 2; setFont(ctx, o.weight, size, o.family); }
  ctx.textAlign = o.align;
  ctx.fillStyle = o.color;
  ctx.fillText(text, x, y);
}

/** Sets the context fill to the colour or gradient for an area. */
function paintFill(ctx: Ctx, fill: CardFill, accent: string, x: number, y: number, w: number, h: number): void {
  if (fill === 'solid') { ctx.fillStyle = accent; return; }
  const light = shade(accent, 0.22);
  const dark = shade(accent, -0.38);
  const gradient = fill === 'h' ? ctx.createLinearGradient(x, y, x + w, y) : fill === 'v' ? ctx.createLinearGradient(x, y, x, y + h) : ctx.createLinearGradient(x, y, x + w, y + h);
  gradient.addColorStop(0, light);
  gradient.addColorStop(1, dark);
  ctx.fillStyle = gradient;
}

const onFill = (fill: CardFill, accent: string) => (fill === 'solid' ? readableOn(accent) : readableOnGradient(shade(accent, 0.22), shade(accent, -0.38)));

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]?.toUpperCase() ?? '').join('') || '·';

export const cardContactLines = (d: CardData) => [d.phone, d.email, d.website, d.address].map((item) => item.trim()).filter(Boolean);

function stackedContacts(ctx: Ctx, lines: string[], x: number, bottom: number, align: 'left' | 'center', color: string, dot: string, family: string, maxW: number) {
  const gap = 40;
  lines.forEach((text, index) => {
    const y = bottom - (lines.length - 1 - index) * gap;
    setFont(ctx, 400, 24, family);
    let size = 24;
    while (size > 14 && ctx.measureText(text).width > maxW - 28) { size -= 1; setFont(ctx, 400, size, family); }
    const width = ctx.measureText(text).width + 28;
    const start = align === 'center' ? x - width / 2 : x;
    ctx.fillStyle = dot;
    ctx.beginPath();
    ctx.arc(start + 6, y - 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = color;
    ctx.fillText(text, start + 28, y);
  });
}

function drawQr(ctx: Ctx, qr: QrCode, x: number, y: number) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(x, y, QR_SIZE, QR_SIZE, 10);
  ctx.fill();
  const inner = QR_SIZE - 20;
  const cell = inner / qr.size;
  ctx.fillStyle = '#000000';
  for (let row = 0; row < qr.size; row += 1) {
    for (let col = 0; col < qr.size; col += 1) {
      if (!qr.modules[row][col]) continue;
      const x0 = Math.round(x + 10 + col * cell);
      const y0 = Math.round(y + 10 + row * cell);
      ctx.fillRect(x0, y0, Math.round(x + 10 + (col + 1) * cell) - x0, Math.round(y + 10 + (row + 1) * cell) - y0);
    }
  }
}

/** Paints a whole card at 1050 x 600 from the top left corner of the context. */
export function drawCard(ctx: Ctx, spec: CardTemplateSpec, data: CardData, accent: string, qr: QrCode | null): void {
  const family = FONT_STACKS[spec.font];
  const W = CARD_W;
  const H = CARD_H;
  const accentColour = spec.colour ? accent : spec.accent;
  const lines = cardContactLines(data);
  const name = data.name.trim();
  const title = data.title.trim();
  const company = data.company.trim().toUpperCase();

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = spec.page;
  ctx.fillRect(0, 0, W, H);

  const pageInk = readableOn(spec.page);
  let ink = pageInk;
  let titleColour = accentColour;
  let dot = accentColour;
  let x = PAD;
  let align: 'left' | 'center' = 'left';
  let nameBase = 170;
  let rightEdge = W - PAD;
  let qrAt = { x: W - PAD - QR_SIZE, y: H - PAD - QR_SIZE };
  let ruleColour = accentColour;
  let contactsBottom = H - PAD;
  let companyColour = ink;

  switch (spec.layout) {
    case 'plain':
    case 'center': {
      if (spec.layout === 'center') { align = 'center'; x = W / 2; nameBase = 190; }
      if (spec.bar) { ctx.fillStyle = accentColour; ctx.fillRect(0, 0, 18, H); x = PAD + 28; }
      break;
    }
    case 'top-band': {
      const bandInk = onFill(spec.fill, accentColour);
      paintFill(ctx, spec.fill, accentColour, 0, 0, W, 250);
      ctx.fillRect(0, 0, W, 250);
      line(ctx, name, x, 130, { align, color: bandInk, weight: 700, size: 64, family, maxW: W - PAD * 2 });
      line(ctx, title, x, 184, { align, color: tint(bandInk, 0.88), weight: 400, size: 30, family, maxW: W - PAD * 2 });
      line(ctx, company, x, 326, { align, color: accentColour === '#111111' ? ink : accentColour, weight: 700, size: 28, family, maxW: W - PAD * 2 - (qr ? 190 : 0) });
      break;
    }
    case 'left-panel': {
      const panelInk = onFill(spec.fill, accentColour);
      paintFill(ctx, spec.fill, accentColour, 0, 0, 340, H);
      ctx.fillRect(0, 0, 340, H);
      ctx.fillStyle = tint(panelInk, 0.16);
      ctx.beginPath();
      ctx.arc(170, 230, 92, 0, Math.PI * 2);
      ctx.fill();
      line(ctx, initials(name), 170, 258, { align: 'center', color: panelInk, weight: 700, size: 72, family, maxW: 150 });
      line(ctx, company, 170, 410, { align: 'center', color: panelInk, weight: 700, size: 26, family, maxW: 280 });
      x = 340 + 56;
      nameBase = 150;
      break;
    }
    case 'full': {
      paintFill(ctx, spec.fill, accentColour, 0, 0, W, H);
      ctx.fillRect(0, 0, W, H);
      ink = onFill(spec.fill, accentColour);
      ctx.fillStyle = tint(ink, 0.09);
      ctx.beginPath();
      ctx.arc(W - 40, -20, 280, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(W - 200, H + 60, 150, 0, Math.PI * 2);
      ctx.fill();
      titleColour = tint(ink, 0.9);
      dot = ink;
      ruleColour = ink;
      companyColour = ink;
      break;
    }
    case 'bottom-band': {
      const bandInk = onFill(spec.fill, accentColour);
      ctx.fillStyle = accentColour;
      ctx.fillRect(0, H - 130, W, 130);
      const strip = [data.phone, data.email, data.website].map((item) => item.trim()).filter(Boolean);
      if (strip.length) line(ctx, strip.join('     •     '), W / 2, H - 52, { align: 'center', color: bandInk, weight: 400, size: 26, family, maxW: W - PAD * 2 });
      line(ctx, data.address.trim(), PAD, H - 130 - 40, { align: 'left', color: ink, weight: 400, size: 24, family, maxW: W - PAD * 2 });
      qrAt = { x: W - PAD - QR_SIZE, y: PAD - 8 };
      contactsBottom = -1;
      break;
    }
    case 'corner': {
      ctx.fillStyle = accentColour;
      ctx.beginPath();
      ctx.moveTo(W - 400, 0);
      ctx.lineTo(W, 0);
      ctx.lineTo(W, 320);
      ctx.closePath();
      ctx.fill();
      rightEdge = 760;
      break;
    }
    case 'stripe': {
      paintFill(ctx, spec.fill, accentColour, W - 120, 0, 120, H);
      ctx.fillRect(W - 120, 0, 120, H);
      rightEdge = W - 120 - 48;
      qrAt = { x: W - 120 - 40 - QR_SIZE, y: H - PAD - QR_SIZE };
      break;
    }
  }

  companyColour = spec.layout === 'full' ? ink : companyColour;
  const textW = Math.max(220, rightEdge - (align === 'center' ? PAD : x));
  const bodyW = align === 'center' ? (qr ? 560 : 820) : textW;

  // Name block for the layouts that do not draw it inside a band.
  if (spec.layout !== 'top-band') {
    line(ctx, name, x, nameBase, { align, color: ink, weight: 700, size: 66, family, maxW: align === 'center' ? 820 : textW });
    line(ctx, title, x, nameBase + 48, { align, color: titleColour, weight: 400, size: 30, family, maxW: align === 'center' ? 820 : textW });
    if (spec.layout !== 'left-panel') line(ctx, company, x, nameBase + 94, { align, color: companyColour, weight: 700, size: 26, family, maxW: align === 'center' ? 820 : textW });
    if (spec.rule) {
      ctx.fillStyle = ruleColour;
      const ruleY = nameBase + (spec.layout === 'left-panel' ? 78 : 130);
      ctx.fillRect(align === 'center' ? x - 45 : x, ruleY, 90, 4);
    }
  } else if (spec.rule) {
    ctx.fillStyle = ruleColour;
    ctx.fillRect(x, 346, 90, 4);
  }

  // Contact lines, stacked up from the bottom, leaving room for the code.
  if (contactsBottom >= 0) {
    const qrLeft = qr && spec.layout !== 'center' ? qrAt.x - 30 : rightEdge;
    const width = align === 'center' ? bodyW : Math.max(200, qrLeft - x);
    stackedContacts(ctx, lines, x, contactsBottom, align, ink, dot, family, width);
  }

  if (qr) drawQr(ctx, qr, qrAt.x, qrAt.y);
  ctx.restore();
}
