/**
 * Draws an audio clip as a video: a cover picture, a title, moving sound bars that follow the real sound, a progress line and optional words.
 * The sound is read from the audio itself at each moment, so the preview and the saved video match.
 */
import { FONT_FAMILIES, type FontId } from '../sequence/scene';

export type ClipLookId = 'clean' | 'night' | 'paper' | 'bold' | 'black';
export type VisualId = 'bars' | 'mirror' | 'wave' | 'circle';
export type CoverShapeId = 'rounded' | 'circle';
export interface Pic { source: CanvasImageSource; width: number; height: number }

export interface ClipLook { bg: [string, string]; ink: string; sub: string; accent: string; font: FontId }
export const CLIP_LOOKS: Record<ClipLookId, ClipLook> = {
  clean: { bg: ['#fff7ed', '#fed7aa'], ink: '#1f2937', sub: '#6b7280', accent: '#ea580c', font: 'clean' },
  night: { bg: ['#0b1020', '#1e1b4b'], ink: '#f8fafc', sub: '#94a3b8', accent: '#22d3ee', font: 'clean' },
  paper: { bg: ['#fbf3e0', '#e9d5a8'], ink: '#3b2a14', sub: '#7c6a4d', accent: '#b45309', font: 'friendly' },
  bold: { bg: ['#fde047', '#fb923c'], ink: '#111111', sub: '#44403c', accent: '#e11d48', font: 'clean' },
  black: { bg: ['#000000', '#111827'], ink: '#ffffff', sub: '#9ca3af', accent: '#a3e635', font: 'clean' },
};

export interface ClipOptions { look: ClipLookId; font: FontId; visual: VisualId; bars: 24 | 40 | 64; coverShape: CoverShapeId; progress: boolean; timeText: boolean }
export interface ClipText { title: string; subtitle: string; lines: string[] }
export interface Renderer { duration: number; paint: (ctx: CanvasRenderingContext2D, seconds: number) => void }

const N = 1024;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const easeOut = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);

/** A small in-place FFT, enough for sound bars. */
function fft(re: Float32Array, im: Float32Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i += 1) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { const a = re[i]!; re[i] = re[j]!; re[j] = a; const b = im[i]!; im[i] = im[j]!; im[j] = b; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len; const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k += 1) {
        const ur = re[i + k]!, ui = im[i + k]!; const vr = re[i + k + len / 2]! * cr - im[i + k + len / 2]! * ci; const vi = re[i + k + len / 2]! * ci + im[i + k + len / 2]! * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}

export interface Analyser { bars: (seconds: number, count: number) => number[]; wave: (seconds: number, count: number) => number[]; level: (seconds: number) => number }

/** Reads the sound of an audio buffer from `offset` seconds in. Heights are scaled so the loudest parts of the clip reach about the top. */
export function makeAnalyser(buffer: AudioBuffer, offset: number, length: number): Analyser {
  const rate = buffer.sampleRate; const channels = buffer.numberOfChannels; const data: Float32Array[] = []; for (let c = 0; c < channels; c += 1) data.push(buffer.getChannelData(c));
  const sample = (index: number) => { if (index < 0 || index >= buffer.length) return 0; let sum = 0; for (let c = 0; c < channels; c += 1) sum += data[c]![index]!; return sum / channels; };
  const window = new Float32Array(N); for (let i = 0; i < N; i += 1) window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1));
  const re = new Float32Array(N), im = new Float32Array(N);
  const spectrum = (seconds: number): Float32Array => {
    const start = Math.floor((offset + seconds) * rate) - N / 2;
    for (let i = 0; i < N; i += 1) { re[i] = sample(start + i) * window[i]!; im[i] = 0; }
    fft(re, im); const out = new Float32Array(N / 2); for (let i = 0; i < N / 2; i += 1) out[i] = Math.hypot(re[i]!, im[i]!) / N; return out;
  };
  // Band edges on a log scale from about 60 Hz to 8 kHz.
  const bandsOf = (count: number) => { const lo = Math.max(1, Math.floor((60 * N) / rate)), hi = Math.min(N / 2 - 1, Math.floor((8000 * N) / rate)); return Array.from({ length: count + 1 }, (_, k) => Math.round(lo * Math.pow(hi / lo, k / count))); };
  const raw = (seconds: number, count: number): number[] => {
    const spec = spectrum(seconds); const edges = bandsOf(count); const out: number[] = [];
    for (let b = 0; b < count; b += 1) { const from = edges[b]!, to = Math.max(from + 1, edges[b + 1]!); let sum = 0; for (let i = from; i < to; i += 1) sum += spec[i]!; out.push(Math.sqrt(sum / (to - from))); }
    return out;
  };
  // Find a scale from a few spots across the clip.
  let peak = 1e-6; const probes = 40;
  for (let k = 0; k < probes; k += 1) { const values = raw((k / probes) * length, 24); peak = Math.max(peak, ...values); }
  const bars = (seconds: number, count: number) => { const now = raw(seconds, count), before = raw(Math.max(0, seconds - 0.05), count); return now.map((value, k) => clamp01(((value + before[k]!) / 2 / peak) * 0.95)); };
  const wave = (seconds: number, count: number) => { const start = Math.floor((offset + seconds) * rate); const step = Math.max(1, Math.floor(rate * 0.03 / count)); let max = 1e-6; const raws: number[] = []; for (let i = 0; i < count; i += 1) { const v = sample(start + i * step); raws.push(v); max = Math.max(max, Math.abs(v)); } return raws.map((v) => v / Math.max(0.2, max)); };
  const level = (seconds: number) => { const start = Math.floor((offset + seconds) * rate); let sum = 0; for (let i = 0; i < 512; i += 1) { const v = sample(start + i * 4); sum += v * v; } return clamp01(Math.sqrt(sum / 512) * 4); };
  return { bars, wave, level };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath(); ctx.moveTo(x + k, y); ctx.arcTo(x + w, y, x + w, y + h, k); ctx.arcTo(x + w, y + h, x, y + h, k); ctx.arcTo(x, y + h, x, y, k); ctx.arcTo(x, y, x + w, y, k); ctx.closePath();
}

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

export function makeClipRenderer(text: ClipText, options: ClipOptions, W: number, H: number, duration: number, analyser: Analyser, cover: Pic | null): Renderer {
  const look = CLIP_LOOKS[options.look]; const FAM = FONT_FAMILIES[options.font]; const U = Math.min(W, H * 0.75); const wide = W > H * 1.1;
  const lines = text.lines.map((line) => line.trim()).filter(Boolean);

  const fitText = (ctx: CanvasRenderingContext2D, value: string, maxW: number, size: number, weight: number, min: number) => { let s = size; ctx.font = `${weight} ${s}px ${FAM}`; while (s > min && ctx.measureText(value).width > maxW) { s -= 2; ctx.font = `${weight} ${s}px ${FAM}`; } let out = value; while (out.length > 1 && ctx.measureText(out).width > maxW) out = `${out.slice(0, -2)}…`; return out; };

  const paint = (ctx: CanvasRenderingContext2D, seconds: number) => {
    const t = Math.max(0, Math.min(seconds, duration));
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, look.bg[0]); g.addColorStop(1, look.bg[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const level = analyser.level(t); const enter = easeOut(t / 0.6);
    // Areas: cover, text, bars.
    const pad = U * 0.07;
    const coverSize = wide ? Math.min(H * 0.62, W * 0.34) : Math.min(W * 0.62, H * 0.32);
    const cx = wide ? pad + coverSize / 2 + U * 0.05 : W / 2; const cy = wide ? H * 0.46 : H * 0.07 + coverSize / 2 + U * 0.05;
    {
      const pulse = 1 + level * 0.035; ctx.save(); ctx.translate(cx, cy); ctx.scale(pulse * (0.94 + 0.06 * enter), pulse * (0.94 + 0.06 * enter)); ctx.globalAlpha = enter;
      ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 30 * (U / 1080); ctx.shadowOffsetY = 12 * (U / 1080);
      if (options.coverShape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, coverSize / 2, 0, Math.PI * 2); ctx.closePath(); } else roundRect(ctx, -coverSize / 2, -coverSize / 2, coverSize, coverSize, coverSize * 0.08);
      ctx.fillStyle = look.accent; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.save(); ctx.clip();
      if (cover) { const scale = Math.max(coverSize / cover.width, coverSize / cover.height); const w = cover.width * scale, h = cover.height * scale; ctx.drawImage(cover.source, -w / 2, -h / 2, w, h); }
      else { const gg = ctx.createLinearGradient(-coverSize / 2, -coverSize / 2, coverSize / 2, coverSize / 2); gg.addColorStop(0, look.accent); gg.addColorStop(1, look.bg[1]); ctx.fillStyle = gg; ctx.fillRect(-coverSize / 2, -coverSize / 2, coverSize, coverSize); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = `700 ${coverSize * 0.42}px ${FAM}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText((text.title.trim()[0] ?? '♪').toUpperCase(), 0, coverSize * 0.03); }
      ctx.restore(); ctx.restore();
    }
    // Title and subtitle.
    const textX = wide ? cx + coverSize / 2 + U * 0.09 : W / 2; const textW = wide ? W - textX - pad : W - pad * 2; const align: CanvasTextAlign = wide ? 'left' : 'center';
    const ty = wide ? H * 0.2 : cy + coverSize / 2 + U * 0.1;
    ctx.save(); ctx.globalAlpha = easeOut((t - 0.15) / 0.5); ctx.textAlign = align; ctx.textBaseline = 'middle';
    if (text.title.trim()) { ctx.fillStyle = look.ink; ctx.fillText(fitText(ctx, text.title.trim(), textW, U * 0.062, 700, U * 0.034), textX, ty); }
    if (text.subtitle.trim()) { ctx.fillStyle = look.sub; ctx.fillText(fitText(ctx, text.subtitle.trim(), textW, U * 0.04, 500, U * 0.026), textX, ty + U * 0.065); }
    ctx.restore();
    // Sound bars.
    const areaX = wide ? textX : pad + U * 0.02, areaW = wide ? textW : W - pad * 2 - U * 0.04; const areaH = wide ? H * 0.3 : H * 0.17; const areaY = wide ? H * 0.42 : ty + U * 0.17;
    ctx.save(); ctx.globalAlpha = easeOut((t - 0.3) / 0.5); ctx.fillStyle = look.accent; ctx.strokeStyle = look.accent;
    const count = options.bars;
    if (options.visual === 'wave') {
      const w = analyser.wave(t, 96); ctx.lineWidth = Math.max(2, U * 0.007); ctx.lineJoin = 'round'; ctx.beginPath(); w.forEach((v, k) => { const x = areaX + (areaW * k) / (w.length - 1), y = areaY + areaH / 2 + v * areaH * 0.45; if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.stroke();
    } else if (options.visual === 'circle') {
      const values = analyser.bars(t, count); const r0 = coverSize / 2 + U * 0.025; const reach = coverSize * 0.28; ctx.translate(cx, cy);
      ctx.lineCap = 'round'; ctx.lineWidth = Math.max(3, (Math.PI * 2 * r0) / count * 0.5);
      values.forEach((v, k) => { const a = (k / count) * Math.PI * 2 - Math.PI / 2; const len = U * 0.006 + v * reach; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * (r0 + len), Math.sin(a) * (r0 + len)); ctx.stroke(); });
    } else {
      const values = analyser.bars(t, count); const gap = areaW / count; const bw = gap * 0.62;
      values.forEach((v, k) => { const h = Math.max(areaH * 0.04, v * areaH); const x = areaX + k * gap + (gap - bw) / 2; if (options.visual === 'mirror') roundRect(ctx, x, areaY + areaH / 2 - h / 2, bw, h, bw / 2); else roundRect(ctx, x, areaY + areaH - h, bw, h, bw / 2); ctx.fill(); });
    }
    ctx.restore();
    // Progress line and time.
    const py = wide ? H * 0.8 : areaY + areaH + U * 0.06; const px0 = wide ? textX : pad + U * 0.02, pw = wide ? textW : W - pad * 2 - U * 0.04;
    if (options.progress) { ctx.fillStyle = look.sub; ctx.globalAlpha = 0.35; roundRect(ctx, px0, py, pw, U * 0.01, U * 0.005); ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = look.accent; roundRect(ctx, px0, py, Math.max(U * 0.01, pw * clamp01(t / Math.max(0.1, duration))), U * 0.01, U * 0.005); ctx.fill(); }
    if (options.timeText) { ctx.fillStyle = look.sub; ctx.font = `500 ${U * 0.03}px ${FAM}`; ctx.textBaseline = 'top'; ctx.textAlign = 'left'; ctx.fillText(clock(t), px0, py + U * 0.025); ctx.textAlign = 'right'; ctx.fillText(clock(duration), px0 + pw, py + U * 0.025); }
    // Words, one line at a time spread evenly across the clip.
    if (lines.length > 0) {
      const slot = duration / lines.length; const k = Math.min(lines.length - 1, Math.floor(t / slot)); const local = t - k * slot; const a = Math.min(easeOut(local / 0.3), clamp01((slot - local) / 0.25));
      ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = look.ink;
      const wy = wide ? H * 0.9 : H - pad * 1.6; const wx = wide ? textX + textW / 2 : W / 2; ctx.fillText(fitText(ctx, lines[k]!, wide ? textW : W - pad * 2, U * 0.05, 700, U * 0.03), wx, wy); ctx.restore();
    }
  };
  return { duration, paint };
}
