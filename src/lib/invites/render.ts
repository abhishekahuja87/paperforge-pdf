/** Draws an invitation card on a canvas. One function is used for the preview, the small design pictures and the download. */
import { archPath, drawBackground, drawBottom, drawCorners, drawDivider, drawFrame, drawTop, hex, roundPath, type Ctx } from './draw';
import type { Design, Pal, PhotoShape } from './data';

export interface InviteContent { heading: string; line: string; names: string; tagline: string; message: string; date: string; time: string; venue: string; address: string; footer: string }
export interface InvitePhoto { source: CanvasImageSource; width: number; height: number; zoom: number; x: number; y: number }
export interface InviteOptions {
  design: Design; pal: Pal; headFont: string; bodyFont: string;
  /** 0.7 to 1.4. The text is made smaller if it would not fit. */
  scale: number; decorations: boolean; border: boolean; photo: InvitePhoto | null; photoShape: PhotoShape;
}

const SERIF = new Set(['Playfair Display', 'Rozha One', 'DM Serif Display', 'Abril Fatface']);
const SCRIPT = new Set(['Dancing Script', 'Lobster', 'Pacifico']);
/** A font stack: the chosen font, a sensible fallback, and system fonts that can show Hindi and other Indian scripts. */
export const stack = (name: string): string => `"${name}", ${SERIF.has(name) ? 'Georgia, serif' : SCRIPT.has(name) ? '"Brush Script MT", cursive' : '"Segoe UI", Arial, sans-serif'}, "Noto Sans Devanagari", "Nirmala UI", Mangal, sans-serif`;

type Block =
  | { kind: 'text'; text: string; font: string; weight: number; size: number; color: string; lh: number; gap: number; tracked?: boolean; italic?: boolean }
  | { kind: 'photo'; w: number; h: number; gap: number }
  | { kind: 'divider'; gap: number };

function wrap(ctx: Ctx, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(test).width > maxW) { out.push(line); line = word; } else line = test;
    }
    out.push(line);
  }
  return out;
}
function drawTracked(ctx: Ctx, text: string, cx: number, y: number, spacing: number): void {
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (widths.length - 1);
  let x = cx - total / 2; ctx.textAlign = 'left';
  [...text].forEach((ch, i) => { ctx.fillText(ch, x, y); x += widths[i]! + spacing; });
  ctx.textAlign = 'center';
}

export function renderInvite(ctx: Ctx, w: number, h: number, c: InviteContent, o: InviteOptions, seed = 11): void {
  const u = w / 1000, { design: d, pal: p } = o;
  ctx.save(); ctx.clearRect(0, 0, w, h);
  drawBackground(ctx, w, h, d.bg, p, seed);
  const frame = o.border ? drawFrame(ctx, w, h, d.frame, p) : 0;
  const safe = { x0: w * 0.1, x1: w * 0.9, y0: h * 0.1, y1: h * 0.86 };
  const topH = o.decorations ? drawTop(ctx, w, h, d.top, p, seed, safe) : 0;
  const botH = o.decorations ? drawBottom(ctx, w, h, d.bottom, p) : 0;
  if (o.decorations && o.border) drawCorners(ctx, w, h, d.corners, p, frame);

  const band = o.decorations && d.top === 'band';
  const top = Math.max(frame + 60 * u, topH, band ? 300 * u : 0), bottom = h - Math.max(frame + 60 * u, botH + 20 * u);
  const maxW = w - 2 * Math.max(frame + 70 * u, 100 * u);
  const caps = d.caps;
  const T = (text: string, font: string, size: number, color: string, gap: number, extra: Partial<Extract<Block, { kind: 'text' }>> = {}): Block | null =>
    (text.trim() ? { kind: 'text', text, font, weight: 500, size, color, lh: 1.28, gap, ...extra } : null);
  const bodyF = stack(o.bodyFont), headF = stack(o.headFont);
  const photoBlock = (): Block | null => {
    if (!o.photo) return null;
    // A little smaller on a square card, where there is less height to share with the words.
    const f = h / w < 1.2 ? 0.78 : 0.92;
    return o.photoShape === 'arch' ? { kind: 'photo', w: 300 * f, h: 380 * f, gap: 30 } : o.photoShape === 'round' ? { kind: 'photo', w: 340 * f, h: 300 * f, gap: 30 } : { kind: 'photo', w: 320 * f, h: 320 * f, gap: 30 };
  };
  const blocks: Block[] = [];
  const push = (b: Block | null): void => { if (b) blocks.push(b); };
  if (!band) push(T(caps ? c.heading.toUpperCase() : c.heading, bodyF, 30, hex(p.accent), 26, { tracked: true, weight: 700 }));
  push(T(c.line, bodyF, 32, hex(p.soft), 22, { italic: !SCRIPT.has(o.bodyFont) }));
  push(photoBlock());
  push(T(caps ? c.names.toUpperCase() : c.names, headF, 118, hex(p.ink), 18, { weight: 700 }));
  push(T(c.tagline, bodyF, 32, hex(p.soft), 20, { italic: !SCRIPT.has(o.bodyFont) }));
  if (d.divider !== 'none' && blocks.length) blocks.push({ kind: 'divider', gap: 26 });
  push(T(c.message, bodyF, 31, hex(p.soft), 30));
  push(T(c.date, bodyF, 44, hex(p.accent), 8, { weight: 700 }));
  push(T(c.time, bodyF, 36, hex(p.ink), 24));
  push(T(c.venue, bodyF, 38, hex(p.ink), 6, { weight: 700 }));
  push(T(c.address, bodyF, 30, hex(p.soft), 26));
  push(T(c.footer, bodyF, 29, hex(p.soft), 0, { italic: !SCRIPT.has(o.bodyFont) }));

  // Measure at a scale, and shrink until the text fits between the decorations.
  const measure = (k: number): { total: number; lines: (string[] | null)[]; px: number[] } => {
    let total = 0; const lines: (string[] | null)[] = [], px: number[] = [];
    for (const b of blocks) {
      if (b.kind === 'text') {
        let size = b.size * k * u; ctx.font = `${b.italic ? 'italic ' : ''}${b.weight} ${size}px ${b.font}`;
        let ls = wrap(ctx, b.text, maxW);
        // Long names get smaller before they wrap onto many lines.
        // Names shrink a little to stay on one line, and further if they would still wrap onto many lines.
        const nominal = size;
        while (b.size > 100 && ((ls.length > 1 && size > nominal * 0.66) || (ls.length > 2 && size > 54 * u))) { size *= 0.94; ctx.font = `${b.weight} ${size}px ${b.font}`; ls = wrap(ctx, b.text, maxW); }
        lines.push(ls); px.push(size); total += ls.length * size * b.lh + b.gap * k * u;
      } else if (b.kind === 'photo') { lines.push(null); px.push(0); total += b.h * k * u + b.gap * k * u; } else { lines.push(null); px.push(0); total += 30 * k * u + b.gap * k * u; }
    }
    return { total, lines, px };
  };
  let k = Math.min(1.4, Math.max(0.6, o.scale)), m = measure(k);
  const avail = bottom - top;
  for (let i = 0; i < 40 && m.total > avail && k > 0.3; i += 1) { k *= 0.95; m = measure(k); }
  let y = top + Math.max(0, (avail - m.total) / 2);

  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  if (band && c.heading.trim()) {
    ctx.fillStyle = hex(p.accent); ctx.font = `700 ${34 * u}px ${bodyF}`; ctx.textBaseline = 'middle';
    drawTracked(ctx, caps ? c.heading.toUpperCase() : c.heading, w / 2, 125 * u, 7 * u); ctx.textBaseline = 'alphabetic';
  }
  blocks.forEach((b, i) => {
    if (b.kind === 'text') {
      const size = m.px[i]!, ls = m.lines[i]!;
      ctx.fillStyle = b.color; ctx.font = `${b.italic ? 'italic ' : ''}${b.weight} ${size}px ${b.font}`;
      ls.forEach((line, n) => {
        const base = y + size * b.lh * n + size * 0.95;
        if (b.tracked) { ctx.font = `${b.weight} ${size}px ${b.font}`; const sp = size * 0.18; drawTracked(ctx, line, w / 2, base, ctx.measureText(line).width + sp * (line.length - 1) > maxW ? 0 : sp); } else ctx.fillText(line, w / 2, base);
      });
      y += ls.length * size * b.lh + b.gap * k * u;
    } else if (b.kind === 'photo') {
      const pw = b.w * k * u, ph = b.h * k * u, x = w / 2 - pw / 2;
      ctx.save();
      if (o.photoShape === 'arch') archPath(ctx, x, y, pw, ph); else if (o.photoShape === 'round') roundPath(ctx, x, y, pw, ph, 40 * u); else { ctx.beginPath(); ctx.arc(w / 2, y + ph / 2, pw / 2, 0, Math.PI * 2); }
      ctx.fillStyle = hex(p.bg2); ctx.fill(); ctx.clip();
      const ph0 = o.photo!, cover = Math.max(pw / ph0.width, ph / ph0.height) * ph0.zoom, dw = ph0.width * cover, dh = ph0.height * cover;
      ctx.drawImage(ph0.source, x + (pw - dw) / 2 + ph0.x * (dw - pw) / 2, y + (ph - dh) / 2 + ph0.y * (dh - ph) / 2, dw, dh);
      ctx.restore();
      ctx.save(); ctx.lineWidth = 7 * u; ctx.strokeStyle = hex(p.accent);
      if (o.photoShape === 'arch') archPath(ctx, x, y, pw, ph); else if (o.photoShape === 'round') roundPath(ctx, x, y, pw, ph, 40 * u); else { ctx.beginPath(); ctx.arc(w / 2, y + ph / 2, pw / 2, 0, Math.PI * 2); }
      ctx.stroke(); ctx.restore();
      y += ph + b.gap * k * u;
    } else {
      drawDivider(ctx, w / 2, y + 15 * k * u, Math.min(maxW * 0.5, 420 * u), d.divider, p, u * Math.max(k, 0.7)); y += 30 * k * u + b.gap * k * u;
    }
  });
  ctx.restore();
}
