/**
 * Background noise remover: spectral gating. It listens to the quietest parts of the recording to learn what the noise sounds like at each pitch,
 * then turns down every pitch in every moment that is no louder than that noise. Voices are louder than the noise, so they pass through.
 * Works best when there are small pauses in the recording. Runs on the device in chunks so the page stays responsive.
 */
import { makeFft } from './fft';

export type NoiseLevel = 'off' | 'light' | 'medium' | 'strong';
/** How hard the gate pushes (alpha) and how quiet a gated pitch may become (floor, as a fraction of its level). */
export const NOISE_SETTINGS: Record<Exclude<NoiseLevel, 'off'>, { alpha: number; floor: number }> = {
  light: { alpha: 1.1, floor: 0.4 },
  medium: { alpha: 1.7, floor: 0.2 },
  strong: { alpha: 2.5, floor: 0.09 },
};

const SIZE = 2048, HOP = 512;
const hann = (() => { const w = new Float32Array(SIZE); for (let i = 0; i < SIZE; i += 1) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / SIZE); return w; })();
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** The average sound spectrum of the quietest frames. */
export function learnNoise(channel: Float32Array): Float32Array {
  const fft = makeFft(SIZE); const bins = SIZE / 2 + 1;
  const re = new Float32Array(SIZE), im = new Float32Array(SIZE);
  const frames: { energy: number; at: number }[] = [];
  for (let at = 0; at + SIZE <= channel.length; at += HOP * 2) {
    let energy = 0; for (let i = 0; i < SIZE; i += 1) { const v = channel[at + i]!; energy += v * v; }
    frames.push({ energy, at });
  }
  const noise = new Float32Array(bins);
  if (!frames.length) return noise;
  frames.sort((a, b) => a.energy - b.energy);
  const take = Math.max(3, Math.floor(frames.length * 0.12));
  for (let f = 0; f < take && f < frames.length; f += 1) {
    const at = frames[f]!.at;
    for (let i = 0; i < SIZE; i += 1) { re[i] = channel[at + i]! * hann[i]!; im[i] = 0; }
    fft.forward(re, im);
    for (let k = 0; k < bins; k += 1) noise[k] = noise[k]! + Math.hypot(re[k]!, im[k]!) / Math.min(take, frames.length);
  }
  return noise;
}

/** Returns a cleaned copy of one channel. `progress` goes from 0 to 1. Resolves with null if cancelled. */
export async function denoiseChannel(channel: Float32Array, level: Exclude<NoiseLevel, 'off'>, noise: Float32Array, progress: (fraction: number) => void, signal: AbortSignal): Promise<Float32Array | null> {
  const { alpha, floor } = NOISE_SETTINGS[level];
  const fft = makeFft(SIZE); const bins = SIZE / 2 + 1; const length = channel.length;
  const out = new Float32Array(length + SIZE * 2);
  const re = new Float32Array(SIZE), im = new Float32Array(SIZE), gain = new Float32Array(bins), previous = new Float32Array(bins).fill(1), smooth = new Float32Array(bins);
  const total = Math.ceil((length + SIZE) / HOP);
  for (let frame = 0; frame < total; frame += 1) {
    if (signal.aborted) return null;
    const at = frame * HOP - SIZE; // frames start before the sound so the first samples are also covered
    for (let i = 0; i < SIZE; i += 1) { const index = at + i; re[i] = (index >= 0 && index < length ? channel[index]! : 0) * hann[i]!; im[i] = 0; }
    fft.forward(re, im);
    for (let k = 0; k < bins; k += 1) {
      const mag = Math.hypot(re[k]!, im[k]!) + 1e-12; const ratio = (noise[k]! * noise[k]!) / (mag * mag);
      gain[k] = Math.sqrt(Math.max(floor * floor, 1 - alpha * ratio));
    }
    for (let k = 0; k < bins; k += 1) { const a = gain[Math.max(0, k - 1)]!, c = gain[Math.min(bins - 1, k + 1)]!; smooth[k] = 0.25 * a + 0.5 * gain[k]! + 0.25 * c; }
    for (let k = 0; k < bins; k += 1) { const g = Math.max(smooth[k]!, previous[k]! * 0.6); previous[k] = g; smooth[k] = g; }
    for (let k = 0; k < bins; k += 1) { re[k] = re[k]! * smooth[k]!; im[k] = im[k]! * smooth[k]!; if (k > 0 && k < SIZE / 2) { re[SIZE - k] = re[k]!; im[SIZE - k] = -im[k]!; } }
    fft.inverse(re, im);
    for (let i = 0; i < SIZE; i += 1) { const index = at + i + SIZE; if (index >= 0 && index < out.length) out[index] = out[index]! + re[i]! * hann[i]! / 1.5; }
    if (frame % 40 === 0) { progress(frame / total); await tick(); }
  }
  progress(1);
  return out.slice(SIZE, SIZE + length);
}
