/**
 * A small set of simple icons drawn with canvas lines, so they stay sharp at any video size and need no files.
 * Each icon is drawn in a 100 by 100 box centred on the origin, then scaled to the size asked for.
 */

export interface IconColours { /** Outline colour. */ line: string; /** Fill colour for the main shapes. */ fill: string; /** Colour of small details and text on the fill. */ detail: string }

type Draw = (ctx: CanvasRenderingContext2D, c: IconColours) => void;

const box = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, c: IconColours, filled = true) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (filled) { ctx.fillStyle = c.fill; ctx.fill(); } ctx.stroke(); };
const dot = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: IconColours, filled = true) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); if (filled) { ctx.fillStyle = c.fill; ctx.fill(); } ctx.stroke(); };
const poly = (ctx: CanvasRenderingContext2D, points: [number, number][], c: IconColours, close = true, filled = true) => { ctx.beginPath(); points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); if (close) ctx.closePath(); if (filled && close) { ctx.fillStyle = c.fill; ctx.fill(); } ctx.stroke(); };
const seg = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
const solid = (ctx: CanvasRenderingContext2D, colour: string, x: number, y: number, w: number, h: number, r = 2) => { ctx.fillStyle = colour; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };

const person = (ctx: CanvasRenderingContext2D, c: IconColours, x: number, s: number) => {
  ctx.save(); ctx.translate(x, 0); ctx.scale(s, s);
  dot(ctx, 0, -22, 14, c); box(ctx, -26, 2, 52, 42, 20, c); ctx.restore();
};

const ICONS: Record<string, Draw> = {
  person: (ctx, c) => person(ctx, c, 0, 1),
  people: (ctx, c) => { person(ctx, c, -20, 0.75); person(ctx, c, 22, 0.85); },
  factory: (ctx, c) => { box(ctx, 22, -42, 14, 44, 2, c); poly(ctx, [[-42, 40], [-42, -6], [-22, -22], [-22, -6], [0, -22], [0, -6], [22, -22], [22, 40]], c); solid(ctx, c.detail, -30, 12, 14, 14); solid(ctx, c.detail, -6, 12, 14, 14); solid(ctx, c.detail, 18, 12, 14, 14); },
  truck: (ctx, c) => { box(ctx, -48, -24, 54, 42, 4, c); poly(ctx, [[8, -10], [28, -10], [46, 6], [46, 18], [8, 18]], c); solid(ctx, c.detail, 14, -4, 12, 10); dot(ctx, -26, 24, 9, c); dot(ctx, 28, 24, 9, c); },
  ship: (ctx, c) => { poly(ctx, [[-46, 6], [46, 6], [32, 32], [-32, 32]], c); box(ctx, -18, -16, 38, 22, 3, c); box(ctx, -4, -36, 12, 20, 2, c); solid(ctx, c.detail, -12, -10, 8, 8); solid(ctx, c.detail, 2, -10, 8, 8); ctx.beginPath(); ctx.moveTo(-44, 42); ctx.quadraticCurveTo(-30, 34, -16, 42); ctx.quadraticCurveTo(-2, 50, 12, 42); ctx.quadraticCurveTo(26, 34, 44, 42); ctx.stroke(); },
  plane: (ctx, c) => poly(ctx, [[-46, 0], [-12, -6], [-16, -36], [-4, -36], [16, -8], [42, -6], [48, 0], [42, 6], [16, 8], [-4, 36], [-16, 36], [-12, 6]], c),
  train: (ctx, c) => { box(ctx, -30, -42, 60, 70, 14, c); box(ctx, -20, -30, 40, 26, 6, { ...c, fill: c.detail }); dot(ctx, -14, 14, 5, c); dot(ctx, 14, 14, 5, c); seg(ctx, -20, 28, -32, 46); seg(ctx, 20, 28, 32, 46); },
  car: (ctx, c) => { poly(ctx, [[-46, 12], [-46, -2], [-28, -6], [-16, -26], [16, -26], [30, -6], [46, -2], [46, 12]], c); poly(ctx, [[-12, -20], [12, -20], [22, -6], [-22, -6]], { ...c, fill: c.detail }); dot(ctx, -26, 14, 9, c); dot(ctx, 26, 14, 9, c); },
  bus: (ctx, c) => { box(ctx, -46, -32, 92, 58, 10, c); for (const x of [-38, -14, 10]) box(ctx, x, -24, 22, 20, 3, { ...c, fill: c.detail }); seg(ctx, -46, 6, 46, 6); dot(ctx, -26, 28, 8, c); dot(ctx, 26, 28, 8, c); },
  bike: (ctx, c) => { dot(ctx, -26, 14, 17, c, false); dot(ctx, 26, 14, 17, c, false); poly(ctx, [[-26, 14], [-6, -12], [18, -12], [26, 14]], c, false); seg(ctx, -6, -12, 6, 14); seg(ctx, 6, 14, -26, 14); poly(ctx, [[18, -12], [14, -28], [26, -28]], c, false); seg(ctx, -12, -16, 0, -16); },
  house: (ctx, c) => { box(ctx, -32, -6, 64, 46, 3, c); poly(ctx, [[-44, -4], [0, -42], [44, -4]], c); box(ctx, -8, 14, 16, 26, 2, { ...c, fill: c.detail }); },
  building: (ctx, c) => { box(ctx, -24, -44, 48, 88, 4, c); for (const y of [-34, -16, 2]) for (const x of [-14, 4]) solid(ctx, c.detail, x, y, 10, 10); box(ctx, -7, 24, 14, 20, 2, { ...c, fill: c.detail }); },
  shop: (ctx, c) => { box(ctx, -38, -8, 76, 48, 3, c); poly(ctx, [[-46, -8], [-38, -34], [38, -34], [46, -8]], c); for (const x of [-26, -6, 14]) seg(ctx, x + 4, -34, x, -8); box(ctx, -10, 12, 20, 28, 2, { ...c, fill: c.detail }); },
  money: (ctx, c) => { box(ctx, -46, -26, 92, 52, 8, c); dot(ctx, 0, 0, 14, { ...c, fill: c.detail }); dot(ctx, -32, 0, 4, c, false); dot(ctx, 32, 0, 4, c, false); },
  card: (ctx, c) => { box(ctx, -46, -30, 92, 60, 8, c); solid(ctx, c.line, -46, -16, 92, 14, 0); seg(ctx, -36, 14, -8, 14); seg(ctx, 10, 14, 34, 14); },
  phone: (ctx, c) => { box(ctx, -24, -44, 48, 88, 10, c); box(ctx, -17, -32, 34, 54, 3, { ...c, fill: c.detail }); dot(ctx, 0, 33, 4, c, false); },
  laptop: (ctx, c) => { box(ctx, -34, -34, 68, 46, 4, c); box(ctx, -27, -27, 54, 32, 2, { ...c, fill: c.detail }); poly(ctx, [[-48, 18], [48, 18], [40, 32], [-40, 32]], c); },
  mail: (ctx, c) => { box(ctx, -46, -30, 92, 60, 6, c); poly(ctx, [[-46, -28], [0, 6], [46, -28]], c, false); },
  cart: (ctx, c) => { poly(ctx, [[-48, -36], [-34, -36], [-22, 14], [30, 14], [40, -18], [-30, -18]], c); dot(ctx, -12, 32, 6, c); dot(ctx, 24, 32, 6, c); },
  box: (ctx, c) => { box(ctx, -38, -26, 76, 64, 4, c); solid(ctx, c.detail, -10, -26, 20, 26, 0); seg(ctx, -38, -10, 38, -10); },
  globe: (ctx, c) => { dot(ctx, 0, 0, 40, c); ctx.beginPath(); ctx.ellipse(0, 0, 17, 40, 0, 0, Math.PI * 2); ctx.stroke(); seg(ctx, -40, 0, 40, 0); seg(ctx, -34, -20, 34, -20); seg(ctx, -34, 20, 34, 20); },
  clock: (ctx, c) => { dot(ctx, 0, 0, 40, c); seg(ctx, 0, 0, 0, -24); seg(ctx, 0, 0, 18, 10); dot(ctx, 0, 0, 3, { ...c, fill: c.line }); },
  calendar: (ctx, c) => { box(ctx, -38, -34, 76, 72, 8, c); solid(ctx, c.line, -38, -34, 76, 20, 6); seg(ctx, -20, -42, -20, -26); seg(ctx, 20, -42, 20, -26); for (const y of [-2, 16]) for (const x of [-22, -4, 14]) solid(ctx, c.detail, x, y, 10, 8); },
  check: (ctx, c) => { dot(ctx, 0, 0, 40, c); ctx.strokeStyle = c.detail; ctx.lineWidth = 9; poly(ctx, [[-18, 2], [-5, 16], [20, -14]], c, false); },
  cross: (ctx, c) => { dot(ctx, 0, 0, 40, c); ctx.strokeStyle = c.detail; ctx.lineWidth = 9; seg(ctx, -16, -16, 16, 16); seg(ctx, 16, -16, -16, 16); },
  warning: (ctx, c) => { poly(ctx, [[0, -42], [46, 36], [-46, 36]], c); solid(ctx, c.detail, -3.5, -14, 7, 28, 3); dot(ctx, 0, 26, 4.5, { ...c, fill: c.detail }); },
  heart: (ctx, c) => { ctx.beginPath(); ctx.moveTo(0, 36); ctx.bezierCurveTo(-60, -4, -30, -44, 0, -16); ctx.bezierCurveTo(30, -44, 60, -4, 0, 36); ctx.closePath(); ctx.fillStyle = c.fill; ctx.fill(); ctx.stroke(); },
  star: (ctx, c) => { const pts: [number, number][] = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 18 : 44; const a = -Math.PI / 2 + (i * Math.PI) / 5; pts.push([Math.cos(a) * r, Math.sin(a) * r + 2]); } poly(ctx, pts, c); },
  bulb: (ctx, c) => { dot(ctx, 0, -12, 26, c); box(ctx, -12, 14, 24, 14, 3, c); seg(ctx, -8, 36, 8, 36); seg(ctx, 0, -50, 0, -46); },
  lock: (ctx, c) => { ctx.beginPath(); ctx.arc(0, -10, 18, Math.PI, 0); ctx.stroke(); box(ctx, -30, -8, 60, 48, 8, c); dot(ctx, 0, 14, 6, { ...c, fill: c.detail }); },
  gear: (ctx, c) => { for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate((i * Math.PI) / 4); box(ctx, -7, -42, 14, 18, 3, c); ctx.restore(); } dot(ctx, 0, 0, 30, c); dot(ctx, 0, 0, 12, { ...c, fill: c.detail }); },
  chart: (ctx, c) => { seg(ctx, -44, 40, 44, 40); seg(ctx, -44, -40, -44, 40); box(ctx, -32, 4, 18, 36, 2, c); box(ctx, -6, -14, 18, 54, 2, c); box(ctx, 20, -34, 18, 74, 2, c); },
  cloud: (ctx, c) => { ctx.beginPath(); ctx.moveTo(-28, 28); ctx.bezierCurveTo(-54, 28, -54, -4, -26, -4); ctx.bezierCurveTo(-26, -40, 22, -44, 28, -12); ctx.bezierCurveTo(56, -12, 54, 28, 28, 28); ctx.closePath(); ctx.fillStyle = c.fill; ctx.fill(); ctx.stroke(); },
  mic: (ctx, c) => { box(ctx, -13, -42, 26, 52, 13, c); ctx.beginPath(); ctx.arc(0, 4, 26, 0, Math.PI); ctx.stroke(); seg(ctx, 0, 30, 0, 42); seg(ctx, -14, 42, 14, 42); },
};

export const ICON_NAMES = Object.keys(ICONS);
export const isIcon = (name: string) => Object.prototype.hasOwnProperty.call(ICONS, name);

/** Draws the icon centred on (x, y), `size` pixels across. */
export function drawIcon(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, size: number, colours: IconColours) {
  const draw = ICONS[name]; if (!draw) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 100, size / 100);
  ctx.strokeStyle = colours.line; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  draw(ctx, colours); ctx.restore();
}
