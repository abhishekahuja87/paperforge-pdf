/**
 * Voice clean-up: remove low rumble, reduce background noise, even out the volume, cut silence, and make the voice louder.
 * Uses the browser's own audio tools (no library). Everything stays on the device.
 */
import { denoiseChannel, learnNoise, type NoiseLevel } from './denoise';

export type SilenceMode = 'keep' | 'ends' | 'pauses';
export interface CleanSettings { noise: NoiseLevel; rumble: boolean; level: boolean; louder: boolean; silence: SilenceMode }
export interface Stats {
  /** Level of the quietest parts, in dB (more negative is quieter). */
  floorDb: number;
  /** Level of the louder parts, in dB, a fair guide to how loud the voice is. */
  voiceDb: number;
  peakDb: number;
  seconds: number;
}

const WINDOW = 0.02;
const dbOf = (value: number) => 20 * Math.log10(Math.max(1e-6, value));

/** Level in dB of each 20 ms stretch, using the loudest of the channels. */
function windowLevels(channels: Float32Array[], rate: number): number[] {
  const size = Math.max(1, Math.round(rate * WINDOW)); const count = Math.floor(channels[0]!.length / size); const levels: number[] = [];
  for (let w = 0; w < count; w += 1) {
    let best = 0;
    for (const channel of channels) { let sum = 0; for (let i = w * size; i < (w + 1) * size; i += 1) sum += channel[i]! * channel[i]!; best = Math.max(best, Math.sqrt(sum / size)); }
    levels.push(dbOf(best));
  }
  return levels;
}

/** The level of the quietest tenth of the recording, of the louder tenth, the loudest sample, and the length. */
export function measure(channels: Float32Array[], rate: number): Stats {
  const levels = windowLevels(channels, rate).sort((a, b) => a - b);
  let peak = 0; for (const channel of channels) for (let i = 0; i < channel.length; i += 1) { const v = Math.abs(channel[i]!); if (v > peak) peak = v; }
  const at = (fraction: number) => (levels.length ? levels[Math.min(levels.length - 1, Math.floor(levels.length * fraction))]! : -90);
  return { floorDb: at(0.1), voiceDb: at(0.9), peakDb: dbOf(peak), seconds: channels[0]!.length / rate };
}

async function through(channels: Float32Array[], rate: number, build: (context: OfflineAudioContext, input: AudioNode) => AudioNode): Promise<Float32Array[]> {
  const context = new OfflineAudioContext(channels.length, channels[0]!.length, rate);
  const buffer = context.createBuffer(channels.length, channels[0]!.length, rate);
  channels.forEach((data, c) => buffer.copyToChannel(data as Float32Array<ArrayBuffer>, c));
  const source = context.createBufferSource(); source.buffer = buffer;
  build(context, source).connect(context.destination); source.start();
  const done = await context.startRendering();
  return channels.map((_, c) => done.getChannelData(c).slice());
}

/** Cuts silence: the quiet stretch at the start and end, and optionally long pauses in the middle (shortened, never removed). */
export function trimSilence(channels: Float32Array[], rate: number, mode: SilenceMode): Float32Array[] {
  if (mode === 'keep') return channels;
  const levels = windowLevels(channels, rate); if (levels.length < 4) return channels;
  const sorted = [...levels].sort((a, b) => a - b); const floor = sorted[Math.floor(sorted.length * 0.1)]!; const voice = sorted[Math.floor(sorted.length * 0.9)]!;
  const threshold = Math.min(floor + 9, voice - 8);
  const size = Math.max(1, Math.round(rate * WINDOW)); const quiet = levels.map((level) => level < threshold);
  const margin = Math.round(0.15 / WINDOW), longRun = Math.round(0.8 / WINDOW), keepRun = Math.round(0.35 / WINDOW);
  let first = quiet.indexOf(false); let last = quiet.lastIndexOf(false);
  if (first < 0) return channels; // nothing but quiet: leave it alone
  first = Math.max(0, first - margin); last = Math.min(quiet.length - 1, last + margin);
  const segments: [number, number][] = []; let from = first;
  if (mode === 'pauses') {
    let w = first;
    while (w <= last) {
      if (!quiet[w]) { w += 1; continue; }
      let end = w; while (end <= last && quiet[end]) end += 1;
      if (end - w > longRun) { const half = Math.floor(keepRun / 2); segments.push([from, w + half]); from = end - half; }
      w = end;
    }
  }
  segments.push([from, last + 1]);
  const fade = Math.round(rate * 0.006); const total = segments.reduce((sum, [a, b]) => sum + (b - a) * size, 0);
  return channels.map((channel) => {
    const out = new Float32Array(total); let at = 0;
    segments.forEach(([a, b], k) => {
      const part = channel.subarray(a * size, Math.min(channel.length, b * size)); out.set(part, at);
      if (k > 0) for (let i = 0; i < Math.min(fade, part.length); i += 1) out[at + i] = out[at + i]! * (i / fade);
      if (k < segments.length - 1) for (let i = 0; i < Math.min(fade, part.length); i += 1) out[at + part.length - 1 - i] = out[at + part.length - 1 - i]! * (i / fade);
      at += part.length;
    });
    return out.slice(0, at);
  });
}

export interface CleanResult { buffer: AudioBuffer; before: Stats; after: Stats }

/** Cleans a recording. `progress` goes from 0 to 1. Resolves with null if cancelled. */
export async function cleanVoice(source: AudioBuffer, settings: CleanSettings, progress: (fraction: number) => void, signal: AbortSignal): Promise<CleanResult | null> {
  const rate = source.sampleRate;
  let channels: Float32Array[] = Array.from({ length: source.numberOfChannels }, (_, c) => source.getChannelData(c).slice());
  const before = measure(channels, rate);
  if (settings.rumble) channels = await through(channels, rate, (context, input) => { const filter = context.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 90; filter.Q.value = 0.7; input.connect(filter); return filter; });
  if (settings.noise !== 'off') {
    const next: Float32Array[] = [];
    for (let c = 0; c < channels.length; c += 1) {
      const cleaned = await denoiseChannel(channels[c]!, settings.noise, learnNoise(channels[c]!), (fraction) => progress((c + fraction) / channels.length * 0.85), signal);
      if (!cleaned) return null; next.push(cleaned);
    }
    channels = next;
  }
  if (signal.aborted) return null;
  // Silence is found before the volume is evened out, while the quiet parts are still quiet.
  channels = trimSilence(channels, rate, settings.silence);
  if (settings.level) channels = await through(channels, rate, (context, input) => {
    const compressor = context.createDynamicsCompressor(); compressor.threshold.value = -34; compressor.knee.value = 24; compressor.ratio.value = 3.5; compressor.attack.value = 0.008; compressor.release.value = 0.22;
    input.connect(compressor); return compressor;
  });
  if (settings.louder) {
    let peak = 0; for (const channel of channels) for (let i = 0; i < channel.length; i += 1) { const v = Math.abs(channel[i]!); if (v > peak) peak = v; }
    const gain = Math.min(Math.pow(10, 24 / 20), Math.pow(10, -1 / 20) / Math.max(peak, 1e-6));
    for (const channel of channels) for (let i = 0; i < channel.length; i += 1) channel[i] = channel[i]! * gain;
  }
  progress(1);
  const buffer = new AudioBuffer({ length: Math.max(1, channels[0]!.length), numberOfChannels: channels.length, sampleRate: rate });
  channels.forEach((data, c) => buffer.copyToChannel(data as Float32Array<ArrayBuffer>, c));
  return { buffer, before, after: measure(channels, rate) };
}

/** A 16-bit WAV file. */
export function encodeWav(buffer: AudioBuffer): Blob {
  const channels = buffer.numberOfChannels, length = buffer.length, bytes = length * channels * 2;
  const view = new DataView(new ArrayBuffer(44 + bytes));
  const text = (at: number, value: string) => { for (let i = 0; i < value.length; i += 1) view.setUint8(at + i, value.charCodeAt(i)); };
  text(0, 'RIFF'); view.setUint32(4, 36 + bytes, true); text(8, 'WAVE'); text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true); view.setUint32(28, buffer.sampleRate * channels * 2, true); view.setUint16(32, channels * 2, true); view.setUint16(34, 16, true); text(36, 'data'); view.setUint32(40, bytes, true);
  const data = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c)); let at = 44;
  for (let i = 0; i < length; i += 1) for (let c = 0; c < channels; c += 1) { const v = Math.max(-1, Math.min(1, data[c]![i]!)); view.setInt16(at, v < 0 ? v * 0x8000 : v * 0x7fff, true); at += 2; }
  return new Blob([view.buffer], { type: 'audio/wav' });
}

/** The types of small audio file this browser can record, best first. */
export function smallAudioType(): { mime: string; extension: 'm4a' | 'webm' } | null {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const mime of ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4']) if (MediaRecorder.isTypeSupported(mime)) return { mime, extension: 'm4a' };
  for (const mime of ['audio/webm;codecs=opus', 'audio/webm']) if (MediaRecorder.isTypeSupported(mime)) return { mime, extension: 'webm' };
  return null;
}

/** Plays the sound while recording it into a small file (AAC or Opus). It takes as long as the sound. Resolves with null if cancelled. */
export function recordSmallFile(buffer: AudioBuffer, onProgress: (fraction: number) => void, signal: AbortSignal): Promise<Blob | null> {
  const type = smallAudioType(); if (!type) return Promise.reject(new Error('This browser cannot save a small audio file.'));
  return new Promise((resolve, reject) => {
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) { reject(new Error('This browser cannot play audio.')); return; }
    const context = new Context(); const target = context.createMediaStreamDestination(); const source = context.createBufferSource(); source.buffer = buffer; source.connect(target);
    const recorder = new MediaRecorder(target.stream, { mimeType: type.mime, audioBitsPerSecond: 96000 }); const chunks: BlobPart[] = []; let cancelled = false; const begin = performance.now();
    const timer = setInterval(() => onProgress(Math.min(1, (performance.now() - begin) / 1000 / buffer.duration)), 250);
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.onerror = () => { clearInterval(timer); reject(new Error('Recording failed.')); };
    recorder.onstop = () => { clearInterval(timer); void context.close(); resolve(cancelled ? null : new Blob(chunks, { type: type.mime.split(';')[0] })); };
    source.onended = () => { if (recorder.state !== 'inactive') setTimeout(() => recorder.stop(), 150); };
    signal.addEventListener('abort', () => { cancelled = true; try { source.stop(); } catch { /* not started */ } if (recorder.state !== 'inactive') recorder.stop(); }, { once: true });
    recorder.start(250); source.start();
  });
}
