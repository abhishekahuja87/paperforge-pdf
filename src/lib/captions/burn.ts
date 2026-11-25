/**
 * Draws subtitles on top of a video picture: white or yellow text with an outline, or text in a box, at the bottom, middle or top.
 * Only the caption is drawn; the video underneath is left alone. The result depends only on the time, so the preview and the saved video match.
 */
import { FONT_FAMILIES, type FontId } from '../sequence/scene';
import { activeCue, type Cue } from './cues';

export type BurnLookId = 'white' | 'yellow' | 'dark' | 'light';
export type BurnPositionId = 'bottom' | 'middle' | 'top';
export type BurnSizeId = 'small' | 'medium' | 'large';

interface BurnLook { ink: string; outline: string | null; box: string | null }
export const BURN_LOOKS: Record<BurnLookId, BurnLook> = {
  white: { ink: '#ffffff', outline: '#000000', box: null },
  yellow: { ink: '#ffe600', outline: '#000000', box: null },
  dark: { ink: '#ffffff', outline: null, box: 'rgba(0,0,0,0.74)' },
  light: { ink: '#111111', outline: null, box: 'rgba(255,255,255,0.9)' },
};

export interface BurnOptions { look: BurnLookId; position: BurnPositionId; size: BurnSizeId; font: FontId }
const SCALE: Record<BurnSizeId, number> = { small: 0.046, medium: 0.06, large: 0.08 };

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath(); ctx.moveTo(x + k, y); ctx.arcTo(x + w, y, x + w, y + h, k); ctx.arcTo(x + w, y + h, x, y + h, k); ctx.arcTo(x, y + h, x, y, k); ctx.arcTo(x, y, x + w, y, k); ctx.closePath();
}

/** Breaks the text into lines that fit, keeping the person's own line breaks. Shrinks the type a little if it still would not fit in four lines. */
function layout(ctx: CanvasRenderingContext2D, text: string, family: string, base: number, maxWidth: number): { lines: string[]; size: number } {
  for (let size = base; size >= base * 0.6; size -= 2) {
    ctx.font = `700 ${size}px ${family}`; const lines: string[] = [];
    for (const paragraph of text.split('\n')) {
      let line = '';
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const trial = line ? `${line} ${word}` : word;
        if (ctx.measureText(trial).width <= maxWidth || !line) line = trial; else { lines.push(line); line = word; }
      }
      if (line) lines.push(line);
    }
    if (lines.length <= 4) return { lines, size };
  }
  const size = base * 0.6; ctx.font = `700 ${size}px ${family}`; return { lines: text.split('\n').slice(0, 4), size };
}

/** Returns a function that paints the caption showing at a moment (nothing between captions). */
export function makeBurnOverlay(cues: Cue[], options: BurnOptions, W: number, H: number): (ctx: CanvasRenderingContext2D, seconds: number) => void {
  const look = BURN_LOOKS[options.look]; const family = FONT_FAMILIES[options.font]; const base = Math.min(W, H) * SCALE[options.size];
  return (ctx, seconds) => {
    const cue = activeCue(cues, seconds); if (!cue) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    const { lines, size } = layout(ctx, cue.text, family, base, W * 0.88); const lh = size * 1.25; const blockH = lines.length * lh;
    const cy = options.position === 'top' ? H * 0.1 + blockH / 2 : options.position === 'middle' ? H / 2 : H * 0.9 - blockH / 2;
    ctx.font = `700 ${size}px ${family}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    if (look.box) {
      const widest = Math.max(...lines.map((line) => ctx.measureText(line).width)); const padX = size * 0.5, padY = size * 0.28;
      ctx.fillStyle = look.box; roundRect(ctx, W / 2 - widest / 2 - padX, cy - blockH / 2 - padY, widest + padX * 2, blockH + padY * 2, size * 0.35); ctx.fill();
    }
    lines.forEach((line, row) => {
      const y = cy - blockH / 2 + lh / 2 + row * lh;
      if (look.outline) { ctx.lineWidth = size * 0.2; ctx.strokeStyle = look.outline; ctx.strokeText(line, W / 2, y); }
      ctx.fillStyle = look.ink; ctx.fillText(line, W / 2, y);
    });
    ctx.restore();
  };
}
