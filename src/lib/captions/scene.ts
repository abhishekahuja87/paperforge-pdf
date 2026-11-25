/**
 * Draws captions as a video: a plain or picture background and the words of the caption that is showing, with an optional highlight that moves along the words.
 * The picture at any moment depends only on the time, so the preview and the saved video match.
 */
import { FONT_FAMILIES, type FontId } from '../sequence/scene';
import { activeCue, type Cue } from './cues';

export type CaptionLookId = 'clean' | 'night' | 'paper' | 'bold' | 'black';
export type PositionId = 'middle' | 'bottom' | 'top';
export type SizeId = 'small' | 'medium' | 'large';
export type AnimationId = 'fade' | 'pop' | 'none';
export interface Pic { source: CanvasImageSource; width: number; height: number }

export interface CaptionLook { bg: [string, string]; ink: string; accent: string; box: string; boxInk: string; font: FontId }
export const CAPTION_LOOKS: Record<CaptionLookId, CaptionLook> = {
  clean: { bg: ['#fff7ed', '#fed7aa'], ink: '#1f2937', accent: '#ea580c', box: '#ffffff', boxInk: '#1f2937', font: 'clean' },
  night: { bg: ['#0b1020', '#1e1b4b'], ink: '#f8fafc', accent: '#22d3ee', box: '#0f172a', boxInk: '#f8fafc', font: 'clean' },
  paper: { bg: ['#fbf3e0', '#e9d5a8'], ink: '#3b2a14', accent: '#b45309', box: '#fffaf0', boxInk: '#3b2a14', font: 'friendly' },
  bold: { bg: ['#fde047', '#fb923c'], ink: '#111111', accent: '#e11d48', box: '#ffffff', boxInk: '#111111', font: 'clean' },
  black: { bg: ['#000000', '#000000'], ink: '#ffffff', accent: '#facc15', box: '#111111', boxInk: '#ffffff', font: 'clean' },
};

export interface CaptionOptions { look: CaptionLookId; font: FontId; position: PositionId; size: SizeId; animation: AnimationId; highlight: boolean; boxed: boolean }
export interface Renderer { duration: number; paint: (ctx: CanvasRenderingContext2D, seconds: number) => void }

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const easeOut = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);
const SCALE: Record<SizeId, number> = { small: 0.062, medium: 0.082, large: 0.108 };

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath(); ctx.moveTo(x + k, y); ctx.arcTo(x + w, y, x + w, y + h, k); ctx.arcTo(x + w, y + h, x, y + h, k); ctx.arcTo(x, y + h, x, y, k); ctx.arcTo(x, y, x + w, y, k); ctx.closePath();
}

export function makeCaptionRenderer(cues: Cue[], options: CaptionOptions, W: number, H: number, duration: number, background: Pic | null): Renderer {
  const look = CAPTION_LOOKS[options.look]; const FAM = FONT_FAMILIES[options.font]; const U = Math.min(W, H * 0.75);
  const hasPhoto = !!background;
  const ink = hasPhoto ? '#ffffff' : look.ink;

  const layout = (ctx: CanvasRenderingContext2D, text: string) => {
    const maxW = W - U * 0.16; const words = text.split(/\s+/).filter(Boolean);
    for (let size = U * SCALE[options.size]; size >= U * 0.034; size -= 2) {
      ctx.font = `700 ${size}px ${FAM}`; const lines: string[][] = []; let line: string[] = [];
      for (const word of words) { const trial = [...line, word].join(' '); if (ctx.measureText(trial).width <= maxW || line.length === 0) line.push(word); else { lines.push(line); line = [word]; } }
      if (line.length) lines.push(line);
      if (lines.length <= 5 && lines.every((l) => ctx.measureText(l.join(' ')).width <= maxW)) return { lines, size };
    }
    const size = U * 0.034; ctx.font = `700 ${size}px ${FAM}`; return { lines: [words], size };
  };

  const paint = (ctx: CanvasRenderingContext2D, seconds: number) => {
    const t = Math.max(0, seconds);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    if (background) {
      const scale = Math.max(W / background.width, H / background.height); const w = background.width * scale, h = background.height * scale;
      ctx.drawImage(background.source, (W - w) / 2, (H - h) / 2, w, h); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H);
    } else { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, look.bg[0]); g.addColorStop(1, look.bg[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    const cue = activeCue(cues, t); if (!cue) return;
    const local = t - cue.start; const left = cue.end - t;
    const fade = options.animation === 'none' ? 1 : Math.min(easeOut(local / 0.15), clamp01(left / 0.12));
    const pop = options.animation === 'pop' ? 0.9 + 0.1 * easeOut(local / 0.2) : 1;
    const { lines, size } = layout(ctx, cue.text); const lh = size * 1.22; const blockH = lines.length * lh;
    const cy = options.position === 'top' ? H * 0.22 : options.position === 'bottom' ? H * 0.78 - blockH / 2 : H / 2;
    const words = lines.flat(); const progress = clamp01(local / Math.max(0.2, cue.end - cue.start)); const reached = Math.floor(progress * words.length * 1.15);
    ctx.save(); ctx.globalAlpha = fade; ctx.translate(W / 2, cy); ctx.scale(pop, pop);
    if (options.boxed) {
      const widest = Math.max(...lines.map((l) => ctx.measureText(l.join(' ')).width)); const padX = size * 0.6, padY = size * 0.45;
      ctx.fillStyle = hasPhoto ? 'rgba(0,0,0,0.6)' : look.box; roundRect(ctx, -widest / 2 - padX, -blockH / 2 - padY, widest + padX * 2, blockH + padY * 2, size * 0.45); ctx.fill();
    }
    ctx.font = `700 ${size}px ${FAM}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const base = options.boxed && !hasPhoto ? look.boxInk : ink; let index = 0;
    lines.forEach((line, row) => {
      const total = ctx.measureText(line.join(' ')).width; let x = -total / 2; const y = -blockH / 2 + lh / 2 + row * lh;
      line.forEach((word) => {
        ctx.fillStyle = options.highlight && index < reached ? look.accent : base;
        if (!options.boxed || hasPhoto) { ctx.shadowColor = hasPhoto ? 'rgba(0,0,0,0.6)' : 'transparent'; ctx.shadowBlur = hasPhoto ? size * 0.2 : 0; }
        ctx.fillText(word, x, y); x += ctx.measureText(`${word} `).width; index += 1;
      });
    });
    ctx.restore();
  };
  return { duration, paint };
}
