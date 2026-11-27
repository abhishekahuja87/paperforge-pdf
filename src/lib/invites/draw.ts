/** Drawing helpers and decorations for the invitation card maker. Everything is drawn with canvas shapes, so there are no picture files to load. */
import type { BgKind, BottomKind, CornerKind, DividerKind, FrameKind, Pal, TopKind } from './data';

export const hex = (c: string): string => `#${c}`;
export const alpha = (c: string, a: number): string => {
  const n = parseInt(c, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/** A small repeatable random number generator, so a design always draws the same way. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Ctx = CanvasRenderingContext2D;
export interface Safe { x0: number; x1: number; y0: number; y1: number }

export function roundPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y); ctx.arcTo(x + w, y, x + w, y + h, k); ctx.arcTo(x + w, y + h, x, y + h, k); ctx.arcTo(x, y + h, x, y, k); ctx.arcTo(x, y, x + w, y, k); ctx.closePath();
}
/** A tall window with a round top. */
export function archPath(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  const r = w / 2;
  ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + r); ctx.arc(x + r, y + r, r, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.closePath();
}
const circle = (ctx: Ctx, x: number, y: number, r: number, fill: string): void => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); };
function star(ctx: Ctx, x: number, y: number, r: number, points: number, fill: string, inner = 0.45): void {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) { const a = (Math.PI / points) * i - Math.PI / 2, d = i % 2 ? r * inner : r; ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
function diamond(ctx: Ctx, x: number, y: number, r: number, fill: string): void {
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.7, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.7, y); ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
function flower(ctx: Ctx, x: number, y: number, r: number, petals: number, color: string, centre: string, rot = 0): void {
  for (let i = 0; i < petals; i += 1) {
    const a = rot + (Math.PI * 2 * i) / petals;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(r * 0.55, 0, r * 0.5, r * 0.28, 0, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }
  circle(ctx, x, y, r * 0.22, centre);
}
function leaf(ctx: Ctx, x: number, y: number, len: number, ang: number, color: string): void {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -len * 0.28, len, 0); ctx.quadraticCurveTo(len * 0.5, len * 0.28, 0, 0); ctx.fillStyle = color; ctx.fill(); ctx.restore();
}

export function drawBackground(ctx: Ctx, w: number, h: number, kind: BgKind, p: Pal, seed: number): void {
  ctx.fillStyle = hex(p.bg); ctx.fillRect(0, 0, w, h);
  if (kind === 'gradient') { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, hex(p.bg)); g.addColorStop(1, hex(p.bg2)); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
  if (kind === 'radial') { const g = ctx.createRadialGradient(w / 2, h * 0.42, w * 0.05, w / 2, h * 0.5, Math.max(w, h) * 0.75); g.addColorStop(0, hex(p.bg2)); g.addColorStop(1, hex(p.bg)); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
  if (kind === 'dots') { const step = w / 22; ctx.fillStyle = alpha(p.accent2, 0.16); for (let y = step / 2, r = 0; y < h; y += step, r += 1) for (let x = (r % 2 ? step : step / 2); x < w; x += step) { ctx.beginPath(); ctx.arc(x, y, w * 0.0045, 0, Math.PI * 2); ctx.fill(); } }
  if (kind === 'stripes') { ctx.save(); ctx.fillStyle = alpha(p.bg2, 0.7); const s = w / 14; ctx.rotate(-0.5); for (let x = -h; x < w + h; x += s * 2) ctx.fillRect(x, -h, s, h * 3); ctx.restore(); }
  if (kind === 'paper') { const r = rng(seed); ctx.fillStyle = alpha(p.accent, 0.07); for (let i = 0; i < 520; i += 1) ctx.fillRect(r() * w, r() * h, 2 + r() * 3, 2 + r() * 3); const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, alpha(p.bg2, 0)); g.addColorStop(1, alpha(p.bg2, 0.8)); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
  if (kind === 'rays') { ctx.save(); ctx.translate(w / 2, h * 0.28); const n = 20; for (let i = 0; i < n; i += 2) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, h * 1.2, (Math.PI * 2 * i) / n, (Math.PI * 2 * (i + 1)) / n); ctx.closePath(); ctx.fillStyle = alpha(p.bg2, 0.8); ctx.fill(); } ctx.restore(); }
}

/** Returns how far the frame reaches in from the edge. */
export function drawFrame(ctx: Ctx, w: number, h: number, kind: FrameKind, p: Pal): number {
  const u = w / 1000;
  if (kind === 'none') return 0;
  ctx.save();
  let reach = 36 * u;
  if (kind === 'thin') { ctx.strokeStyle = hex(p.accent); ctx.lineWidth = 3 * u; ctx.strokeRect(36 * u, 36 * u, w - 72 * u, h - 72 * u); }
  else if (kind === 'double') { ctx.strokeStyle = hex(p.accent); ctx.lineWidth = 7 * u; ctx.strokeRect(34 * u, 34 * u, w - 68 * u, h - 68 * u); ctx.lineWidth = 2.5 * u; ctx.strokeRect(54 * u, 54 * u, w - 108 * u, h - 108 * u); reach = 54 * u; }
  else if (kind === 'thick') { ctx.strokeStyle = hex(p.accent); ctx.lineWidth = 16 * u; ctx.strokeRect(24 * u, 24 * u, w - 48 * u, h - 48 * u); reach = 32 * u; }
  else if (kind === 'round') { ctx.strokeStyle = hex(p.accent2); ctx.lineWidth = 6 * u; roundPath(ctx, 34 * u, 34 * u, w - 68 * u, h - 68 * u, 60 * u); ctx.stroke(); reach = 40 * u; }
  else if (kind === 'dotted') { ctx.strokeStyle = hex(p.accent); ctx.lineWidth = 7 * u; ctx.lineCap = 'round'; ctx.setLineDash([0.1, 16 * u]); roundPath(ctx, 40 * u, 40 * u, w - 80 * u, h - 80 * u, 30 * u); ctx.stroke(); reach = 40 * u; }
  else {
    ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 28 * u; ctx.shadowOffsetY = 8 * u; ctx.fillStyle = hex(p.panel); roundPath(ctx, 52 * u, 52 * u, w - 104 * u, h - 104 * u, 10 * u); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.strokeStyle = hex(p.accent2); ctx.lineWidth = 2.5 * u; roundPath(ctx, 76 * u, 76 * u, w - 152 * u, h - 152 * u, 4 * u); ctx.stroke(); reach = 76 * u;
  }
  ctx.restore();
  return reach;
}

export function drawCorners(ctx: Ctx, w: number, h: number, kind: CornerKind, p: Pal, inset: number): void {
  if (kind === 'none') return;
  const u = w / 1000, o = Math.max(inset, 36 * u);
  const corner = (cx: number, cy: number, sx: number, sy: number): void => {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sx, sy);
    if (kind === 'ornate') {
      ctx.strokeStyle = hex(p.accent); ctx.lineWidth = 3.5 * u;
      [70, 105, 140].forEach((r, i) => { ctx.beginPath(); ctx.arc(0, 0, r * u, 0, Math.PI / 2); ctx.globalAlpha = 1 - i * 0.25; ctx.stroke(); });
      ctx.globalAlpha = 1; circle(ctx, 0, 0, 12 * u, hex(p.accent)); diamond(ctx, 160 * u, 0, 9 * u, hex(p.accent)); diamond(ctx, 0, 160 * u, 9 * u, hex(p.accent));
    } else if (kind === 'floral') {
      leaf(ctx, 20 * u, 20 * u, 150 * u, 0.25, alpha(p.accent2, 0.55)); leaf(ctx, 20 * u, 20 * u, 150 * u, Math.PI / 2 - 0.25, alpha(p.accent2, 0.55)); leaf(ctx, 20 * u, 20 * u, 110 * u, Math.PI / 4, alpha(p.accent, 0.5));
      flower(ctx, 40 * u, 40 * u, 62 * u, 6, alpha(p.accent2, 0.95), hex(p.accent), 0.2); flower(ctx, 120 * u, 42 * u, 36 * u, 5, alpha(p.accent, 0.8), hex(p.accent2)); flower(ctx, 42 * u, 120 * u, 36 * u, 5, alpha(p.accent, 0.8), hex(p.accent2), 0.5);
    } else if (kind === 'leaf') {
      for (let i = 0; i < 5; i += 1) leaf(ctx, 10 * u, 10 * u, (150 - i * 14) * u, 0.12 + i * 0.3, alpha(i % 2 ? p.accent : p.accent2, 0.6));
    } else {
      circle(ctx, 24 * u, 24 * u, 13 * u, hex(p.accent)); circle(ctx, 62 * u, 24 * u, 7 * u, hex(p.accent2)); circle(ctx, 24 * u, 62 * u, 7 * u, hex(p.accent2)); circle(ctx, 90 * u, 24 * u, 4 * u, hex(p.accent)); circle(ctx, 24 * u, 90 * u, 4 * u, hex(p.accent));
    }
    ctx.restore();
  };
  corner(o, o, 1, 1); corner(w - o, o, -1, 1); corner(o, h - o, 1, -1); corner(w - o, h - o, -1, -1);
}

const MARIGOLD = ['F59E0B', 'F97316', 'FBBF24', 'EA580C'];
const BALLOONS = ['EF4444', 'F59E0B', '22C55E', '3B82F6', 'A855F7', 'EC4899'];
const CONFETTI = ['EF4444', 'F59E0B', '22C55E', '3B82F6', 'A855F7', 'EC4899', 'FDE047'];
const outside = (x: number, y: number, s: Safe): boolean => !(x > s.x0 && x < s.x1 && y > s.y0 && y < s.y1);

/** Draws a top decoration and returns the height it needs, so the text starts below it. `safe` is the area the text will use, which loose shapes keep clear of. */
export function drawTop(ctx: Ctx, w: number, h: number, kind: TopKind, p: Pal, seed: number, safe: Safe): number {
  const u = w / 1000, r = rng(seed + 7);
  if (kind === 'none') return 0;
  if (kind === 'marigold') {
    for (let s = 0; s < 2; s += 1) {
      const y0 = 40 * u + s * 40 * u, sag = 70 * u - s * 20 * u, n = 26 - s * 3;
      for (let i = 0; i <= n; i += 1) {
        const t = i / n, x = t * w, y = y0 + 4 * sag * t * (1 - t);
        leaf(ctx, x, y, 26 * u, 1.2 + (i % 2) * 0.8, 'rgba(34,120,60,0.85)');
        flower(ctx, x, y, 24 * u, 8, hex(MARIGOLD[(i + s) % 4]!), hex('B45309'), i);
      }
    }
    return 210 * u;
  }
  if (kind === 'lights') {
    const wave = (t: number): number => 50 * u + Math.abs(Math.sin(t * Math.PI * 7)) * 34 * u;
    ctx.strokeStyle = alpha(p.soft, 0.7); ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(0, wave(0));
    for (let i = 1; i <= 140; i += 1) ctx.lineTo((i / 140) * w, wave(i / 140));
    ctx.stroke();
    const cols = [p.accent, p.accent2, 'FF7AA2', '7CE0FF'];
    for (let i = 0; i < 14; i += 1) {
      const t = (i + 0.5) / 14, x = t * w, y = wave(t) + 24 * u, c = cols[i % 4]!;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 46 * u); g.addColorStop(0, alpha(c, 0.65)); g.addColorStop(1, alpha(c, 0)); ctx.fillStyle = g; ctx.fillRect(x - 46 * u, y - 46 * u, 92 * u, 92 * u);
      circle(ctx, x, y, 10 * u, hex(c));
    }
    return 170 * u;
  }
  if (kind === 'mandala') {
    ctx.save(); ctx.translate(w / 2, 0);
    for (let ring = 0; ring < 4; ring += 1) {
      const R = (230 - ring * 42) * u, n = 16 - ring * 2;
      for (let i = 0; i < n; i += 1) { ctx.save(); ctx.rotate((Math.PI * 2 * i) / n); ctx.beginPath(); ctx.ellipse(R * 0.78, 0, R * 0.22, R * 0.09, 0, 0, Math.PI * 2); ctx.fillStyle = alpha(ring % 2 ? p.accent2 : p.accent, 0.5); ctx.fill(); ctx.restore(); }
      ctx.beginPath(); ctx.arc(0, 0, R * 0.56, 0, Math.PI * 2); ctx.strokeStyle = alpha(p.accent, 0.5); ctx.lineWidth = 2.5 * u; ctx.stroke();
    }
    circle(ctx, 0, 0, 24 * u, hex(p.accent)); ctx.restore();
    return 240 * u;
  }
  if (kind === 'balloons') {
    const cluster = (cx: number, cy: number, dir: number): void => {
      const spots: [number, number, number][] = [[0, 0, 64], [dir * 70, 28, 58], [dir * 18, 78, 54], [dir * 88, -26, 50]];
      spots.forEach(([dx, dy, rr], i) => {
        const x = cx + dx * u, y = cy + dy * u, c = BALLOONS[(i + (dir > 0 ? 0 : 2)) % 6]!;
        ctx.strokeStyle = alpha(p.soft, 0.6); ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(x, y + rr * 1.25 * u); ctx.quadraticCurveTo(x + dir * 20 * u, y + 190 * u, cx + dir * 30 * u, cy + 250 * u); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x, y, rr * u, rr * 1.25 * u, 0, 0, Math.PI * 2); ctx.fillStyle = hex(c); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x - rr * 0.3 * u, y - rr * 0.4 * u, rr * 0.18 * u, rr * 0.3 * u, 0.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
      });
    };
    cluster(120 * u, 120 * u, 1); cluster(w - 120 * u, 120 * u, -1);
    return 150 * u;
  }
  if (kind === 'bunting') {
    const n = 12, y0 = 30 * u;
    ctx.strokeStyle = alpha(p.soft, 0.7); ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(0, y0); ctx.quadraticCurveTo(w / 2, y0 + 180 * u, w, y0); ctx.stroke();
    for (let i = 0; i < n; i += 1) {
      const t = (i + 0.5) / n, x = t * w, y = y0 + 180 * u * t * (1 - t);
      ctx.beginPath(); ctx.moveTo(x - 38 * u, y); ctx.lineTo(x + 38 * u, y); ctx.lineTo(x, y + 80 * u); ctx.closePath(); ctx.fillStyle = hex(i % 3 === 0 ? p.accent : i % 3 === 1 ? p.accent2 : 'FDE047'); ctx.fill();
    }
    for (let i = 0; i < 26; i += 1) { const x = r() * w, y = 170 * u + r() * 120 * u; ctx.save(); ctx.translate(x, y); ctx.rotate(r() * 6); ctx.fillStyle = hex(CONFETTI[i % 7]!); ctx.fillRect(-6 * u, -3 * u, 12 * u, 6 * u); ctx.restore(); }
    return 190 * u;
  }
  if (kind === 'confetti') {
    for (let i = 0; i < 90; i += 1) {
      const x = r() * w, y = r() * h; if (!outside(x, y, safe)) continue;
      ctx.save(); ctx.translate(x, y); ctx.rotate(r() * 6); ctx.fillStyle = hex(CONFETTI[i % 7]!);
      const k = r(); if (k < 0.4) ctx.fillRect(-9 * u, -4 * u, 18 * u, 8 * u); else if (k < 0.7) { ctx.beginPath(); ctx.arc(0, 0, 6 * u, 0, 7); ctx.fill(); } else star(ctx, 0, 0, 11 * u, 5, hex(CONFETTI[(i + 2) % 7]!));
      ctx.restore();
    }
    return 60 * u;
  }
  if (kind === 'stars') {
    for (let i = 0; i < 46; i += 1) {
      const x = r() * w, y = r() * h * 0.5; if (!outside(x, y, safe)) continue;
      star(ctx, x, y, (6 + r() * 14) * u, 4 + (i % 2), alpha(i % 3 ? p.accent2 : p.accent, 0.35 + r() * 0.6), 0.4);
    }
    ctx.save(); ctx.beginPath(); ctx.arc(w - 150 * u, 130 * u, 54 * u, 0, Math.PI * 2); ctx.fillStyle = alpha(p.accent, 0.95); ctx.fill(); ctx.beginPath(); ctx.arc(w - 128 * u, 118 * u, 50 * u, 0, Math.PI * 2); ctx.fillStyle = hex(p.bg); ctx.fill(); ctx.restore();
    return 120 * u;
  }
  if (kind === 'clouds') {
    const cloud = (x: number, y: number, s: number): void => { ctx.fillStyle = 'rgba(255,255,255,0.92)'; [[0, 0, 60], [55, -20, 48], [105, 0, 56], [50, 15, 52]].forEach(([dx, dy, rr]) => { ctx.beginPath(); ctx.arc(x + dx! * s * u, y + dy! * s * u, rr! * s * u, 0, 7); ctx.fill(); }); };
    cloud(80 * u, 110 * u, 1); cloud(w - 330 * u, 80 * u, 0.9); cloud(w * 0.42, 170 * u, 0.5);
    for (let i = 0; i < 12; i += 1) star(ctx, r() * w, r() * 260 * u, 8 * u, 5, alpha(p.accent, 0.6));
    return 220 * u;
  }
  if (kind === 'sparkle') {
    for (let i = 0; i < 34; i += 1) {
      const x = r() * w, y = r() * h; if (!outside(x, y, safe)) continue;
      star(ctx, x, y, (8 + r() * 18) * u, 4, alpha(i % 2 ? p.accent : p.accent2, 0.35 + r() * 0.55), 0.18);
    }
    return 70 * u;
  }
  // band: a solid header block with an accent edge
  ctx.fillStyle = hex(p.bg2); ctx.fillRect(0, 0, w, 250 * u); ctx.fillStyle = hex(p.accent); ctx.fillRect(0, 250 * u, w, 10 * u);
  return 0;
}

export function drawBottom(ctx: Ctx, w: number, h: number, kind: BottomKind, p: Pal): number {
  const u = w / 1000;
  if (kind === 'none') return 0;
  if (kind === 'wave') {
    ([[0.55, p.accent2, 0.5], [0.4, p.accent, 0.9]] as [number, string, number][]).forEach(([k, c, a], i) => { const top = h - 150 * u * k - 30 * u; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, top); for (let x = 0; x <= w; x += 10) ctx.lineTo(x, top + Math.sin((x / w) * Math.PI * (3 + i) + i) * 22 * u); ctx.lineTo(w, h); ctx.closePath(); ctx.fillStyle = alpha(c, a); ctx.fill(); });
    return 160 * u;
  }
  if (kind === 'hills') {
    ctx.fillStyle = alpha(p.accent2, 0.55); ctx.beginPath(); ctx.ellipse(w * 0.25, h + 20 * u, w * 0.5, 150 * u, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = alpha(p.accent, 0.8); ctx.beginPath(); ctx.ellipse(w * 0.78, h + 40 * u, w * 0.55, 130 * u, 0, Math.PI, 0); ctx.fill();
    return 130 * u;
  }
  if (kind === 'florals') {
    const n = 9;
    for (let i = 0; i <= n; i += 1) { const x = (i / n) * w, y = h - (58 + (i % 2) * 18) * u; leaf(ctx, x, y + 10 * u, 70 * u, -Math.PI / 2 + (i % 2 ? 0.7 : -0.7), alpha(p.accent2, 0.55)); }
    for (let i = 0; i <= n; i += 1) { const x = (i / n) * w, y = h - (58 + (i % 2) * 18) * u; flower(ctx, x, y, (i % 3 === 0 ? 40 : 28) * u, 6, alpha(i % 2 ? p.accent2 : p.accent, 0.85), 'rgba(255,243,196,0.95)', i); }
    return 140 * u;
  }
  const n = 5;
  for (let i = 0; i < n; i += 1) {
    const x = ((i + 0.5) / n) * w, y = h - 70 * u, big = i % 2 ? 0.85 : 1;
    const g = ctx.createRadialGradient(x, y - 40 * u, 0, x, y - 40 * u, 90 * u); g.addColorStop(0, 'rgba(255,200,80,0.5)'); g.addColorStop(1, 'rgba(255,200,80,0)'); ctx.fillStyle = g; ctx.fillRect(x - 90 * u, y - 130 * u, 180 * u, 180 * u);
    ctx.beginPath(); ctx.moveTo(x - 52 * big * u, y - 12 * u); ctx.quadraticCurveTo(x, y + 46 * u * big, x + 52 * big * u, y - 12 * u); ctx.quadraticCurveTo(x, y - 24 * u, x - 52 * big * u, y - 12 * u); ctx.fillStyle = hex(p.accent); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y - 74 * u * big); ctx.quadraticCurveTo(x + 22 * u, y - 36 * u, x, y - 20 * u); ctx.quadraticCurveTo(x - 22 * u, y - 36 * u, x, y - 74 * u * big); ctx.fillStyle = '#FFB020'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y - 54 * u * big); ctx.quadraticCurveTo(x + 9 * u, y - 36 * u, x, y - 28 * u); ctx.quadraticCurveTo(x - 9 * u, y - 36 * u, x, y - 54 * u * big); ctx.fillStyle = '#FFF3B0'; ctx.fill();
  }
  return 150 * u;
}

/** A short ornament between two parts of the text, centred at x. */
export function drawDivider(ctx: Ctx, x: number, y: number, width: number, kind: DividerKind, p: Pal, u: number): void {
  if (kind === 'none') return;
  ctx.save(); ctx.strokeStyle = hex(p.accent); ctx.lineWidth = 2.5 * u;
  if (kind === 'line') { ctx.beginPath(); ctx.moveTo(x - width / 2, y); ctx.lineTo(x + width / 2, y); ctx.stroke(); }
  else if (kind === 'diamond') { ctx.beginPath(); ctx.moveTo(x - width / 2, y); ctx.lineTo(x - 60 * u, y); ctx.moveTo(x + 60 * u, y); ctx.lineTo(x + width / 2, y); ctx.stroke(); diamond(ctx, x, y, 12 * u, hex(p.accent)); diamond(ctx, x - 34 * u, y, 6 * u, hex(p.accent2)); diamond(ctx, x + 34 * u, y, 6 * u, hex(p.accent2)); }
  else if (kind === 'dots') { for (let i = -2; i <= 2; i += 1) circle(ctx, x + i * 30 * u, y, (i === 0 ? 8 : 5) * u, hex(i === 0 ? p.accent : p.accent2)); }
  else { for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * 14 * u, y); ctx.bezierCurveTo(x + s * 60 * u, y - 26 * u, x + s * 100 * u, y + 26 * u, x + s * 150 * u, y); ctx.bezierCurveTo(x + s * 170 * u, y - 10 * u, x + s * 190 * u, y - 4 * u, x + s * 200 * u, y); ctx.stroke(); } diamond(ctx, x, y, 10 * u, hex(p.accent)); }
  ctx.restore();
}
