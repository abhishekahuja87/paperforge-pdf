/**
 * Writes a new video from a part of the person's own video, at a chosen size and quality, with the original sound.
 * Fast path: every picture is read at its exact moment and encoded one by one (Chrome, Edge, recent Safari), so nothing is skipped.
 * Fallback: the video plays while the browser records it, so it takes as long as the video.
 * An optional overlay (such as captions) is drawn on every picture.
 */
import { encodeAac } from '../globe/audio';
import { encodeOffline } from '../globe/encode';
import { recordCanvas } from '../globe/record';
import type { Voice } from '../sequence/voice';
import { seekVideo, soundPart, soundPartVoice, type OpenedVideo } from './source';

export interface RenderJob {
  opened: OpenedVideo;
  /** Seconds into the video where the new video starts, and how long it lasts. */
  start: number;
  duration: number;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  /** The video's sound, or null to leave it out. */
  sound: Voice | null;
  /** Draws on top of every picture. `seconds` counts from the start of the new video. */
  overlay?: (ctx: CanvasRenderingContext2D, seconds: number, width: number, height: number) => void;
  /** What this browser can do: `encoder` for frame by frame H.264, `aac` for AAC sound. */
  encoder: { ok: boolean; codec: string };
  aac: boolean;
  onProgress: (fraction: number) => void;
  signal: AbortSignal;
}

export interface RenderResult { blob: Blob; extension: 'mp4' | 'webm'; smooth: boolean }

/** True when this browser can write the video frame by frame. */
export const canWriteSmooth = (job: Pick<RenderJob, 'encoder' | 'aac' | 'sound'>) => job.encoder.ok && (!job.sound || job.aac);

export async function renderVideo(job: RenderJob): Promise<RenderResult | null> {
  const { opened, start, duration, width, height, fps } = job;
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('No drawing surface.');
  const draw = (seconds: number) => { ctx.drawImage(opened.video, 0, 0, width, height); job.overlay?.(ctx, seconds, width, height); };

  if (canWriteSmooth(job)) {
    const audio = job.sound ? await encodeAac(await soundPart(job.sound, start, duration)) : undefined;
    const done = await encodeOffline({
      canvas, codec: job.encoder.codec, duration, fps, bitrate: job.bitrate, audio, signal: job.signal, onProgress: job.onProgress,
      paint: async (seconds) => { await seekVideo(opened.video, start + seconds); draw(seconds); },
    });
    return done ? { blob: done.blob, extension: 'mp4', smooth: true } : null;
  }

  const music = job.sound ? { buffer: (await soundPartVoice(job.sound, start, duration)).buffer, volume: 1, plain: true } : undefined;
  await seekVideo(opened.video, start);
  let playing = false;
  try {
    const done = await recordCanvas({
      canvas, duration, fps: Math.min(fps, 30), bitrate: job.bitrate, music, signal: job.signal, onProgress: job.onProgress,
      paint: (seconds) => {
        if (!playing) { playing = true; void opened.video.play().catch(() => undefined); }
        draw(Math.max(0, Math.min(duration, Number.isFinite(opened.video.currentTime) ? opened.video.currentTime - start : seconds)));
      },
    });
    return done ? { blob: done.blob, extension: done.support.extension, smooth: false } : null;
  } finally { try { opened.video.pause(); } catch { /* already stopped */ } }
}
