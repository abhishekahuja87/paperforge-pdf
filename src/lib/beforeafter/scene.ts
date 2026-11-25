/**
 * The before and after video: the first photo is shown, then a line (or a fade) reveals the second one, with an optional title and BEFORE / AFTER tags.
 * `makeRenderer` returns a function that paints any moment, so the preview and the saved video use the same pictures.
 */
export type RevealId = 'wipe' | 'wipeDown' | 'curtain' | 'fade';
export type FitId = 'fill' | 'fit';
export type LengthId = 'short' | 'medium' | 'long';
export type AccentId = 'orange' | 'dark' | 'light';
export interface Pic { source: CanvasImageSource; width: number; height: number }

export interface BeforeAfterOptions { reveal: RevealId; fit: FitId; labels: boolean; title: string; length: LengthId; accent: AccentId }
export interface Words { before: string; after: string }

/** Seconds spent on the first photo, on the reveal and on the second photo. */
export const TIMING: Record<LengthId, { first: number; reveal: number; last: number }> = {
  short: { first: 1.5, reveal: 2, last: 1.5 },
  medium: { first: 2.5, reveal: 2.5, last: 3 },
  long: { first: 4, reveal: 3.5, last: 4.5 },
};
export const totalSeconds = (length: LengthId) => { const t = TIMING[length]; return t.first + t.reveal + t.last; };

const ACCENTS: Record<AccentId, { fill: string; text: string }> = { orange: { fill: '#ea580c', text: '#ffffff' }, dark: { fill: 'rgba(17,24,39,0.85)', text: '#ffffff' }, light: { fill: 'rgba(255,255,255,0.92)', text: '#111827' } };
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - ((-2 * x + 2) ** 2) / 2);
const clamp = (x: number) => Math.max(0, Math.min(1, x));

function drawPic(ctx: CanvasRenderingContext2D, pic: Pic, w: number, h: number, fit: FitId): void {
  const scale = fit === 'fill' ? Math.max(w / pic.width, h / pic.height) : Math.min(w / pic.width, h / pic.height);
  const dw = pic.width * scale, dh = pic.height * scale;
  if (fit === 'fit') { ctx.fillStyle = '#111111'; ctx.fillRect(0, 0, w, h); }
  ctx.drawImage(pic.source, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, accent: AccentId, align: 'left' | 'center', alpha: number): void {
  if (alpha <= 0.01 || !text) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.font = `700 ${size}px Poppins, system-ui, sans-serif`;
  const padX = size * 0.8, padY = size * 0.45, tw = ctx.measureText(text).width, w = tw + padX * 2, h = size + padY * 2;
  const left = align === 'center' ? x - w / 2 : x;
  ctx.fillStyle = ACCENTS[accent].fill; ctx.beginPath(); ctx.roundRect?.(left, y, w, h, h / 2); if (!ctx.roundRect) ctx.rect(left, y, w, h); ctx.fill();
  ctx.fillStyle = ACCENTS[accent].text; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(text, left + padX, y + h / 2 + size * 0.04);
  ctx.restore();
}

export interface Renderer { duration: number; paint: (ctx: CanvasRenderingContext2D, seconds: number) => void }

export function makeRenderer(before: Pic, after: Pic, options: BeforeAfterOptions, words: Words, width: number, height: number): Renderer {
  const timing = TIMING[options.length], duration = totalSeconds(options.length);
  const unit = Math.min(width, height);
  const handle = (ctx: CanvasRenderingContext2D, x: number, y: number, vertical: boolean) => {
    ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(3, unit * 0.006); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = unit * 0.012;
    ctx.beginPath(); if (vertical) { ctx.moveTo(x, 0); ctx.lineTo(x, height); } else { ctx.moveTo(0, y); ctx.lineTo(width, y); } ctx.stroke();
    const radius = unit * 0.035; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(vertical ? x : width / 2, vertical ? height / 2 : y, radius, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  };
  return {
    duration,
    paint: (ctx, seconds) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const p = ease(clamp((seconds - timing.first) / timing.reveal));
      drawPic(ctx, before, width, height, options.fit);
      if (p > 0) {
        ctx.save();
        if (options.reveal === 'fade') ctx.globalAlpha = p;
        else {
          ctx.beginPath();
          if (options.reveal === 'wipe') ctx.rect(0, 0, width * p, height);
          else if (options.reveal === 'wipeDown') ctx.rect(0, 0, width, height * p);
          else ctx.rect(width * (0.5 - p / 2), 0, width * p, height);
          ctx.clip();
        }
        drawPic(ctx, after, width, height, options.fit);
        ctx.restore();
        if (p < 0.995) {
          if (options.reveal === 'wipe') handle(ctx, width * p, 0, true);
          else if (options.reveal === 'wipeDown') handle(ctx, 0, height * p, false);
          else if (options.reveal === 'curtain') { handle(ctx, width * (0.5 - p / 2), 0, true); handle(ctx, width * (0.5 + p / 2), 0, true); }
        }
      }
      const size = unit * 0.05;
      if (options.title.trim()) pill(ctx, options.title.trim(), width / 2, unit * 0.05, size, options.accent, 'center', 1);
      if (options.labels) {
        const y = height - unit * 0.05 - size * 1.9;
        pill(ctx, words.before, unit * 0.05, y, size * 0.85, options.accent, 'left', clamp(1 - (p - 0.3) / 0.15));
        pill(ctx, words.after, unit * 0.05, y, size * 0.85, options.accent, 'left', clamp((p - 0.55) / 0.15));
      }
    },
  };
}

/** Two example pictures of a room, a dull one and a bright one, so the tool can be tried without photos. */
export function samplePics(): { before: Pic; after: Pic } {
  const make = (bright: boolean): Pic => {
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 900;
    const ctx = canvas.getContext('2d')!;
    const wall = bright ? '#fde68a' : '#b8b2a7', floor = bright ? '#c08457' : '#8a8479', sofa = bright ? '#ea580c' : '#6b6558', rug = bright ? '#f97316' : '#7c776b';
    ctx.fillStyle = wall; ctx.fillRect(0, 0, 1200, 620); ctx.fillStyle = floor; ctx.fillRect(0, 620, 1200, 280);
    ctx.fillStyle = bright ? '#bae6fd' : '#9aa0a3'; ctx.fillRect(140, 120, 260, 300); ctx.strokeStyle = bright ? '#ffffff' : '#6b6558'; ctx.lineWidth = 12; ctx.strokeRect(140, 120, 260, 300); ctx.beginPath(); ctx.moveTo(270, 120); ctx.lineTo(270, 420); ctx.moveTo(140, 270); ctx.lineTo(400, 270); ctx.stroke();
    ctx.fillStyle = rug; ctx.beginPath(); ctx.ellipse(640, 780, 380, 70, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = sofa; ctx.fillRect(520, 420, 520, 200); ctx.fillRect(500, 520, 560, 150); ctx.fillStyle = bright ? '#fdba74' : '#827c6e'; ctx.fillRect(540, 440, 220, 90); ctx.fillRect(800, 440, 220, 90);
    ctx.fillStyle = bright ? '#7c2d12' : '#59554b'; ctx.fillRect(520, 670, 30, 50); ctx.fillRect(1010, 670, 30, 50);
    if (bright) {
      ctx.fillStyle = '#92400e'; ctx.fillRect(1100, 560, 50, 90); ctx.fillStyle = '#16a34a'; for (const [x, y] of [[1125, 480], [1085, 520], [1165, 520], [1125, 430]] as [number, number][]) { ctx.beginPath(); ctx.ellipse(x, y, 36, 62, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#ffffff'; ctx.fillRect(600, 160, 260, 170); ctx.fillStyle = '#ea580c'; ctx.fillRect(612, 172, 236, 146);
    } else {
      ctx.strokeStyle = '#7a7468'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(700, 40); ctx.lineTo(730, 120); ctx.lineTo(700, 200); ctx.lineTo(740, 300); ctx.stroke();
      ctx.fillStyle = 'rgba(80,70,60,0.25)'; ctx.beginPath(); ctx.ellipse(900, 300, 90, 60, 0.4, 0, Math.PI * 2); ctx.fill();
    }
    return { source: canvas, width: 1200, height: 900 };
  };
  return { before: make(false), after: make(true) };
}
