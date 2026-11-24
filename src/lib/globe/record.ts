/** Records a canvas to a video file in the browser. No upload and no watermark. */

export interface RecordSupport { ok: boolean; mime: string; extension: 'mp4' | 'webm' }

/** MP4 plays everywhere (WhatsApp, Instagram, iPhone), so it is tried first; WebM is the fallback for browsers that cannot write MP4. */
export function recordSupport(): RecordSupport {
  const none: RecordSupport = { ok: false, mime: '', extension: 'webm' };
  if (typeof MediaRecorder === 'undefined' || typeof HTMLCanvasElement === 'undefined' || !('captureStream' in HTMLCanvasElement.prototype)) return none;
  const mp4 = ['video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1', 'video/mp4'];
  const webm = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  for (const mime of mp4) if (MediaRecorder.isTypeSupported(mime)) return { ok: true, mime, extension: 'mp4' };
  for (const mime of webm) if (MediaRecorder.isTypeSupported(mime)) return { ok: true, mime, extension: 'webm' };
  return none;
}

/** Bits per second for a picture size: about 0.2 bits per pixel per frame, which keeps thin map lines clean. */
export const videoBitrate = (width: number, height: number, fps = 30) => Math.round(Math.min(24_000_000, Math.max(3_000_000, width * height * fps * 0.2)));

export interface RecordJob {
  canvas: HTMLCanvasElement;
  /** Seconds of video. */
  duration: number;
  fps: number;
  /** Paints the picture for this many seconds from the start. */
  paint: (seconds: number) => void;
  onProgress: (fraction: number) => void;
  signal: AbortSignal;
}

/**
 * Plays the animation in real time while recording, so the video is exactly `duration` seconds long. If the device is slow, frames are skipped
 * instead of the video getting longer. Resolves with the file, or null if cancelled.
 */
export function recordCanvas(job: RecordJob): Promise<{ blob: Blob; support: RecordSupport; frames: number } | null> {
  const support = recordSupport();
  if (!support.ok) return Promise.reject(new Error('This browser cannot record video.'));
  return new Promise((resolve, reject) => {
    const stream = job.canvas.captureStream(0);
    const track = stream.getVideoTracks()[0] as (MediaStreamTrack & { requestFrame?: () => void }) | undefined;
    if (!track) { reject(new Error('Could not start recording.')); return; }
    const manual = typeof track.requestFrame === 'function';
    const live = manual ? stream : job.canvas.captureStream(job.fps);
    const recorder = new MediaRecorder(live, { mimeType: support.mime, videoBitsPerSecond: videoBitrate(job.canvas.width, job.canvas.height) });
    const chunks: BlobPart[] = [];
    let frames = 0, cancelled = false, raf = 0;
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.onerror = () => reject(new Error('Recording failed.'));
    recorder.onstop = () => {
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((item) => item.stop());
      live.getTracks().forEach((item) => item.stop());
      resolve(cancelled ? null : { blob: new Blob(chunks, { type: support.mime.split(';')[0] }), support, frames });
    };
    job.signal.addEventListener('abort', () => { cancelled = true; if (recorder.state !== 'inactive') recorder.stop(); }, { once: true });

    job.paint(0);
    recorder.start(250);
    const begin = performance.now();
    const step = () => {
      if (cancelled) return;
      const elapsed = (performance.now() - begin) / 1000;
      const seconds = Math.min(job.duration, elapsed);
      job.paint(seconds);
      if (manual) track.requestFrame!();
      frames += 1;
      job.onProgress(seconds / job.duration);
      if (elapsed >= job.duration + 0.15) { recorder.stop(); return; }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  });
}

/** Sizes in pixels for each shape and quality. The short side is 720 or 1080. All numbers are even, which video codecs need. */
export function videoSize(shape: 'reel' | 'wide' | 'square' | 'portrait', quality: 720 | 1080): { width: number; height: number } {
  const s = quality;
  switch (shape) {
    case 'reel': return { width: s, height: Math.round((s * 16) / 9 / 2) * 2 };
    case 'wide': return { width: Math.round((s * 16) / 9 / 2) * 2, height: s };
    case 'portrait': return { width: s, height: Math.round((s * 5) / 4 / 2) * 2 };
    default: return { width: s, height: s };
  }
}
