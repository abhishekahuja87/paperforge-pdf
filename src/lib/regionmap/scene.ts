/**
 * Draws the Region Map Video: a flat world map where countries light up one by one, the camera flies to each one and a card names it.
 * The picture at any moment is worked out from the time alone, so the preview, the slider and the recorded video all match.
 */

import { fontCss, FONT_FAMILIES, type FontId, type SpeedId } from '../sequence/scene';
import { mercX, mercY, union, type Atlas, type Box, type Region } from './atlas';
import type { MapDeck, MapStep } from './parse';

export type StyleId = 'clean' | 'dark' | 'paper' | 'bold';

export interface MapStyle {
  sea: string; land: string; border: string; lit: string; current: string; ink: string; card: string; cardInk: string; accent: string;
  /** Border width in pixels on a 1080 wide picture. */
  line: number; glow: boolean; font: FontId;
}

export const STYLES: Record<StyleId, MapStyle> = {
  clean: { sea: '#dde6ee', land: '#ffffff', border: '#b9c4cf', lit: '#fb923c', current: '#ea580c', ink: '#1f2937', card: '#ffffff', cardInk: '#1f2937', accent: '#ea580c', line: 1.2, glow: false, font: 'clean' },
  dark: { sea: '#0a0f1f', land: '#1b2540', border: '#2f3d63', lit: '#0ea5b7', current: '#22d3ee', ink: '#f8fafc', card: '#111a33', cardInk: '#f8fafc', accent: '#22d3ee', line: 1.2, glow: true, font: 'clean' },
  paper: { sea: '#efe3c4', land: '#fffaf0', border: '#d2bf93', lit: '#c2701f', current: '#92400e', ink: '#3b2a14', card: '#fffaf0', cardInk: '#3b2a14', accent: '#92400e', line: 1.4, glow: false, font: 'friendly' },
  bold: { sea: '#fde047', land: '#ffffff', border: '#111111', lit: '#f43f5e', current: '#be123c', ink: '#111111', card: '#ffffff', cardInk: '#111111', accent: '#be123c', line: 2.4, glow: false, font: 'clean' },
};

export interface MapOptions { style: StyleId; font: FontId; speed: SpeedId; zoom: boolean; keep: boolean; counter: boolean; finale: boolean }

/** Words that go on the picture, so they can live in the locale file. */
export interface MapWords { one: string; many: string; total: string }

export interface Timeline { starts: number[]; ends: number[]; duration: number; /** When the zoom out at the end begins, or -1. */ finaleAt: number }

const INTRO = 0.7, HOLD = 0.8, FINALE = 3;
const BASE: Record<SpeedId, number> = { slow: 4.4, normal: 3.4, fast: 2.4 };
const FLY: Record<SpeedId, number> = { slow: 1.7, normal: 1.3, fast: 0.9 };

const wanted = (deck: MapDeck, speed: SpeedId) => deck.steps.map((step) => (step.kind === 'pause' ? step.seconds : (step.kind === 'world' ? BASE[speed] * 0.8 : BASE[speed]) + Math.min(1.6, ('caption' in step ? step.caption.length : 0) * 0.03)));

export function buildTimeline(deck: MapDeck, speed: SpeedId, extras: { stepTimes?: number[] | null; minDuration?: number; fitTo?: number; finale?: boolean } = {}): Timeline {
  const want = wanted(deck, speed);
  const given = extras.stepTimes && extras.stepTimes.length === want.length ? extras.stepTimes : null;
  const starts: number[] = []; let end = 0;
  if (given) {
    given.forEach((value, k) => starts.push(k === 0 ? Math.max(0, value) : Math.max(value, starts[k - 1]! + 0.2)));
    end = (starts[starts.length - 1] ?? 0) + (want[want.length - 1] ?? 1);
  } else {
    const total = want.reduce((sum, value) => sum + value, 0);
    const tail = (extras.finale ? FINALE : HOLD);
    const stretch = extras.fitTo && total > 0 ? Math.max(0.4, Math.min(6, (extras.fitTo - INTRO - tail) / total)) : 1;
    let cursor = INTRO; for (const value of want) { starts.push(cursor); cursor += value * stretch; }
    end = cursor;
  }
  const ends = starts.map((_, k) => (k + 1 < starts.length ? starts[k + 1]! : end));
  const finale = !!extras.finale && deck.steps.some((step) => step.kind === 'region' || step.kind === 'pin');
  return { starts, ends, duration: Math.max(extras.minDuration ?? 0, end + (finale ? FINALE : HOLD), INTRO + 1), finaleAt: finale ? end : -1 };
}

// ---- helpers ----

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const easeOut = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);
const easeInOut = (value: number) => { const v = clamp01(value); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };
const easeBack = (value: number) => { const v = clamp01(value) - 1; return 1 + 2.70158 * v * v * v + 1.70158 * v * v; };

interface Cam { x: number; y: number; s: number }

const WORLD_BOX: Box = [mercX(-170), mercY(-56), mercX(180), mercY(78)];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/** Lines of text that fit the width, shrinking the font a little when needed. */
function fitText(ctx: CanvasRenderingContext2D, text: string, font: FontId, weight: number, size: number, minSize: number, width: number, maxLines: number): { lines: string[]; size: number } {
  for (let px = size; px >= minSize; px -= 2) {
    ctx.font = `${weight} ${px}px ${FONT_FAMILIES[font]}`;
    const lines: string[] = []; let line = '';
    for (const word of text.split(/\s+/).filter(Boolean)) {
      const trial = line ? `${line} ${word}` : word;
      if (ctx.measureText(trial).width <= width || !line) line = trial; else { lines.push(line); line = word; }
    }
    if (line) lines.push(line);
    if (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= width)) return { lines, size: px };
  }
  ctx.font = `${weight} ${minSize}px ${FONT_FAMILIES[font]}`;
  const lines = [text]; while (lines[0]!.length > 1 && ctx.measureText(lines[0]!).width > width) lines[0] = `${lines[0]!.slice(0, -2)}…`;
  return { lines, size: minSize };
}

export interface Renderer { duration: number; paint: (ctx: CanvasRenderingContext2D, seconds: number) => void }

const pathCache = new WeakMap<Region, Path2D>();
function pathOf(region: Region): Path2D {
  let path = pathCache.get(region);
  if (!path) {
    path = new Path2D();
    for (const ring of region.rings) { path.moveTo(ring[0]!, ring[1]!); for (let i = 2; i < ring.length; i += 2) path.lineTo(ring[i]!, ring[i + 1]!); path.closePath(); }
    pathCache.set(region, path);
  }
  return path;
}

export function makeRenderer(deck: MapDeck, atlas: Atlas, options: MapOptions, words: MapWords, W: number, H: number, timeline: Timeline): Renderer {
  const style = STYLES[options.style];
  const U = Math.min(W, H * 0.75);
  const pad = U * 0.05;
  const topBand = deck.title ? U * 0.19 : U * 0.04;
  const bottomBand = U * 0.32;
  const areaH = H - topBand - bottomBand; const areaCY = topBand + areaH / 2;

  const fit = (box: Box, pad2: number, minSpan: number): Cam => {
    const cx = (box[0] + box[2]) / 2, cy = (box[1] + box[3]) / 2;
    const bw = Math.max(box[2] - box[0], minSpan), bh = Math.max(box[3] - box[1], minSpan);
    return { x: cx, y: cy, s: Math.min(W / (bw * pad2), areaH / (bh * pad2)) };
  };
  const world = fit(WORLD_BOX, 1.04, 0);

  // Where the camera rests during each step.
  const targets: Cam[] = []; let previous = world;
  deck.steps.forEach((step) => {
    let cam = previous;
    if (!options.zoom || step.kind === 'world') cam = world;
    else if (step.kind === 'region') cam = fit(step.regions.reduce<Box>((box, region) => union(box, region.box), step.regions[0]!.box), 1.7, 0.16);
    else if (step.kind === 'pin') cam = fit([mercX(step.lon), mercY(step.lat), mercX(step.lon), mercY(step.lat)], 1, 0.34);
    targets.push(cam); previous = cam;
  });
  if (!options.zoom) targets.fill(world);

  const flyTime = (k: number) => Math.min(FLY[options.speed], (timeline.ends[k]! - timeline.starts[k]!) * 0.5);
  const litAt = (k: number) => timeline.starts[k]! + flyTime(k) * 0.55;
  const shows = (step: MapStep) => step.kind === 'region' || step.kind === 'pin';

  const move = (from: Cam, to: Cam, p: number): Cam => {
    const e = easeInOut(p);
    const dist = Math.hypot(to.x - from.x, to.y - from.y); const seen = W / Math.min(from.s, to.s);
    const dip = Math.min(1.1, 0.7 * (dist / seen)) * Math.sin(Math.PI * clamp01(p));
    const logS = Math.max(Math.log(world.s), Math.log(from.s) + (Math.log(to.s) - Math.log(from.s)) * e - dip);
    return { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, s: Math.exp(logS) };
  };

  const camAt = (t: number): Cam => {
    let k = -1; for (let i = 0; i < timeline.starts.length; i++) if (timeline.starts[i]! <= t) k = i;
    if (timeline.finaleAt >= 0 && t >= timeline.finaleAt) return move(targets[targets.length - 1] ?? world, world, (t - timeline.finaleAt) / 1.6);
    if (k < 0) return world;
    const from = k > 0 ? targets[k - 1]! : world;
    return move(from, targets[k]!, (t - timeline.starts[k]!) / Math.max(0.2, flyTime(k)));
  };

  const total = deck.steps.reduce((sum, step) => sum + (step.kind === 'region' ? step.regions.length : step.kind === 'pin' ? 1 : 0), 0);

  const paint = (ctx: CanvasRenderingContext2D, seconds: number) => {
    const t = Math.max(0, seconds);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    ctx.fillStyle = style.sea; ctx.fillRect(0, 0, W, H);
    const cam = camAt(t);
    const ox = W / 2 - cam.x * cam.s, oy = areaCY + cam.y * cam.s;
    const x0 = cam.x - (W / 2) / cam.s, x1 = cam.x + (W / 2) / cam.s, y1 = cam.y + areaCY / cam.s, y0 = cam.y - (H - areaCY) / cam.s;
    const px = U / 1080;

    // Which steps are lit now, and which one is the newest.
    const litNow: number[] = []; let newest = -1;
    deck.steps.forEach((step, k) => { if (shows(step) && litAt(k) <= t) { litNow.push(k); newest = k; } });
    const finished = timeline.finaleAt >= 0 && t >= timeline.finaleAt;
    const visible = options.keep || finished ? litNow : (newest >= 0 ? [newest] : []);
    const litFor = new Map<string, { k: number; alpha: number }>();
    for (const k of visible) { const step = deck.steps[k]!; if (step.kind === 'region') for (const region of step.regions) litFor.set(region.id, { k, alpha: easeOut((t - litAt(k)) / 0.5) }); }

    // The land.
    ctx.setTransform(cam.s, 0, 0, -cam.s, ox, oy);
    ctx.lineJoin = 'round';
    const inView = (b: Box) => b[2] >= x0 && b[0] <= x1 && b[3] >= y0 && b[1] <= y1;
    const lit: Region[] = [];
    for (const region of atlas.regions) {
      if (!inView(region.box2)) continue;
      if (litFor.has(region.id)) { lit.push(region); continue; }
      if ((region.box2[2] - region.box2[0]) * cam.s < 0.6 && (region.box2[3] - region.box2[1]) * cam.s < 0.6) continue;
      const path = pathOf(region);
      ctx.fillStyle = style.land; ctx.fill(path, 'evenodd');
      ctx.lineWidth = (style.line * px) / cam.s; ctx.strokeStyle = style.border; ctx.stroke(path);
    }
    for (const region of lit) {
      const state = litFor.get(region.id)!; const path = pathOf(region); const isNewest = state.k === newest;
      ctx.fillStyle = style.land; ctx.fill(path, 'evenodd');
      ctx.globalAlpha = state.alpha;
      if (style.glow) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.shadowColor = style.current; ctx.shadowBlur = 24 * px; ctx.setTransform(cam.s, 0, 0, -cam.s, ox, oy); ctx.fillStyle = isNewest ? style.current : style.lit; ctx.fill(path, 'evenodd'); ctx.restore(); }
      else { ctx.fillStyle = isNewest ? style.current : style.lit; ctx.fill(path, 'evenodd'); }
      ctx.globalAlpha = 1;
      ctx.lineWidth = ((isNewest ? 2.4 : 1.6) * px * (style.line > 2 ? 1.4 : 1)) / cam.s; ctx.strokeStyle = options.style === 'dark' ? '#e0f2fe' : style.ink; ctx.globalAlpha = isNewest ? 0.95 : 0.55; ctx.stroke(path); ctx.globalAlpha = 1;
    }

    // Pins and a ring on small countries, in screen units.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const screen = (x: number, y: number) => [W / 2 + (x - cam.x) * cam.s, areaCY - (y - cam.y) * cam.s] as const;
    const ring = (sx: number, sy: number, radius: number, since: number, colour: string) => {
      for (let n = 0; n < 2; n++) { const p = ((since * 0.8 + n * 0.5) % 1); ctx.globalAlpha = (1 - p) * 0.8; ctx.strokeStyle = colour; ctx.lineWidth = 3 * px; ctx.beginPath(); ctx.arc(sx, sy, radius * (0.6 + p * 1.6), 0, Math.PI * 2); ctx.stroke(); }
      ctx.globalAlpha = 1;
    };
    for (const k of visible) {
      const step = deck.steps[k]!; const age = t - litAt(k); const current = k === newest;
      if (step.kind === 'pin') {
        const [sx, sy] = screen(mercX(step.lon), mercY(step.lat)); const pop = easeBack(age / 0.45);
        if (current) ring(sx, sy, U * 0.03, age, style.current);
        ctx.fillStyle = current ? style.current : style.lit; ctx.strokeStyle = options.style === 'dark' ? '#ffffff' : style.card; ctx.lineWidth = 3 * px;
        ctx.beginPath(); ctx.arc(sx, sy, U * (current ? 0.016 : 0.011) * Math.max(0, pop), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else if (step.kind === 'region' && current) {
        for (const region of step.regions) {
          if ((region.box[2] - region.box[0]) * cam.s < U * 0.07) { const [sx, sy] = screen(region.cx, region.cy); ring(sx, sy, U * 0.035, age, style.current); }
        }
      }
    }

    // Title and counter.
    if (deck.title) {
      const fitted = fitText(ctx, deck.title, options.font, 700, Math.round(U * 0.062), Math.round(U * 0.034), W - pad * 2, 2);
      ctx.font = `700 ${fitted.size}px ${FONT_FAMILIES[options.font]}`; ctx.fillStyle = style.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lh = fitted.size * 1.15; const top = topBand * 0.5 - (fitted.lines.length * lh) / 2 + lh / 2 - U * 0.012;
      fitted.lines.forEach((line, i) => ctx.fillText(line, W / 2, top + i * lh));
      ctx.fillStyle = style.accent; roundRect(ctx, W / 2 - U * 0.07, topBand - U * 0.045, U * 0.14, U * 0.012, U * 0.006); ctx.fill();
    }
    const count = new Set(visible.flatMap((k) => { const step = deck.steps[k]!; return step.kind === 'region' ? step.regions.map((r) => r.id) : step.kind === 'pin' ? [`pin${k}`] : []; })).size;
    if (options.counter && total > 1 && count > 0) {
      const label = (count === 1 ? words.one : words.many).replace('{n}', String(count));
      ctx.font = `700 ${Math.round(U * 0.032)}px ${FONT_FAMILIES[options.font]}`; const w = ctx.measureText(label).width + U * 0.05; const h = U * 0.06;
      ctx.fillStyle = style.card; ctx.globalAlpha = 0.92; roundRect(ctx, W - pad - w, topBand + U * 0.01, w, h, h / 2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = style.cardInk; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, W - pad - w / 2, topBand + U * 0.01 + h / 2 + U * 0.002);
    }

    // The card at the bottom: the name of the place and a note.
    let label = ''; let note = ''; let from = 0; let cardStep = -1;
    deck.steps.forEach((step, k) => { if (step.kind !== 'pause' && (shows(step) ? litAt(k) : timeline.starts[k]!) <= t) cardStep = k; });
    if (finished && count > 0) { label = words.total.replace('{n}', String(count)); note = ''; from = timeline.finaleAt + 0.5; }
    else if (cardStep >= 0) {
      const step = deck.steps[cardStep]!;
      if (step.kind === 'region' || step.kind === 'pin') { label = step.label; note = step.caption; from = litAt(cardStep); }
      else if (step.kind === 'world') { label = step.caption; from = timeline.starts[cardStep]!; }
    }
    if (label || note) {
      let alpha = 1;
      if (!finished) { const next = deck.steps.findIndex((step, k) => k > cardStep && step.kind !== 'pause' && timeline.starts[k]! <= t); if (next >= 0) alpha = 1 - clamp01((t - timeline.starts[next]!) / 0.25); }
      const pop = easeBack((t - from) / 0.45); const wide = W - pad * 2; const cardH = U * 0.25; const cx = W / 2; const cy = H - bottomBand * 0.5 - U * 0.01;
      ctx.save(); ctx.globalAlpha = alpha * clamp01((t - from) / 0.2 + 0.05); ctx.translate(cx, cy); ctx.scale(0.88 + 0.12 * Math.max(0, pop), 0.88 + 0.12 * Math.max(0, pop)); ctx.translate(-cx, -cy);
      ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = 24 * px; ctx.shadowOffsetY = 8 * px;
      ctx.fillStyle = style.card; roundRect(ctx, pad, cy - cardH / 2, wide, cardH, U * 0.04); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.fillStyle = style.accent; roundRect(ctx, pad, cy - cardH / 2, U * 0.018, cardH, U * 0.009); ctx.fill();
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = style.cardInk;
      const inner = wide - U * 0.1;
      const big = label ? fitText(ctx, label, options.font, 700, Math.round(U * 0.075), Math.round(U * 0.036), inner, note ? 2 : 3) : { lines: [], size: 0 };
      const small = note ? fitText(ctx, note, options.font, 500, Math.round(U * 0.04), Math.round(U * 0.026), inner, 2) : { lines: [], size: 0 };
      const bigH = big.lines.length * big.size * 1.15, smallH = small.lines.length * small.size * 1.25, gap = big.lines.length && small.lines.length ? U * 0.012 : 0;
      let y = cy - (bigH + smallH + gap) / 2;
      ctx.font = `700 ${big.size}px ${FONT_FAMILIES[options.font]}`; big.lines.forEach((line) => { ctx.fillText(line, pad + U * 0.055, y + big.size * 0.575); y += big.size * 1.15; });
      y += gap; ctx.font = fontCss(options.font, small.size); ctx.globalAlpha *= 0.78; small.lines.forEach((line) => { ctx.fillText(line, pad + U * 0.055, y + small.size * 0.625); y += small.size * 1.25; });
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  };

  return { duration: timeline.duration, paint };
}
