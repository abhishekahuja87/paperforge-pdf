import { writeMp4, type Mp4Sample } from './mp4';
import { videoBitrate } from './record';

/** True when the browser can encode H.264 frame by frame (Chrome, Edge and recent Safari). Checked for the real size, because limits depend on it. */
export async function canEncodeOffline(width: number, height: number, fps: number): Promise<{ ok: boolean; codec: string }> {
  const none = { ok: false, codec: '' };
  const w = window as unknown as { VideoEncoder?: typeof VideoEncoder; VideoFrame?: unknown };
  if (!w.VideoEncoder || !w.VideoFrame) return none;
  for (const codec of ['avc1.640033', 'avc1.64002a', 'avc1.4d0033', 'avc1.42003e']) {
    try {
      const result = await VideoEncoder.isConfigSupported({ codec, width, height, bitrate: videoBitrate(width, height, fps), framerate: fps, avc: { format: 'avc' } });
      if (result.supported) return { ok: true, codec };
    } catch { /* try the next one */ }
  }
  return none;
}

export interface EncodeJob {
  canvas: HTMLCanvasElement;
  codec: string;
  duration: number;
  fps: number;
  /** Paints the picture for this many seconds from the start. */
  paint: (seconds: number) => void;
  onProgress: (fraction: number) => void;
  signal: AbortSignal;
}

/**
 * Draws every frame at its exact time and encodes it, so no frame is ever skipped. A slow device takes longer to finish but the video is always
 * the same smooth length. Resolves with an MP4 file, or null if cancelled.
 */
export async function encodeOffline(job: EncodeJob): Promise<{ blob: Blob; frames: number } | null> {
  const { canvas, fps } = job;
  const total = Math.max(1, Math.round(job.duration * fps));
  const samples: Mp4Sample[] = [];
  let description: Uint8Array | null = null;
  let failure: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      const data = new Uint8Array(chunk.byteLength); chunk.copyTo(data);
      samples.push({ data, key: chunk.type === 'key' });
      const config = meta?.decoderConfig?.description;
      if (config && !description) {
        const view = config as ArrayBuffer | ArrayBufferView;
        description = ArrayBuffer.isView(view) ? new Uint8Array(view.buffer, view.byteOffset, view.byteLength) : new Uint8Array(view);
      }
    },
    error: (error) => { failure = error instanceof Error ? error : new Error('Encoding failed.'); },
  });
  encoder.configure({ codec: job.codec, width: canvas.width, height: canvas.height, bitrate: videoBitrate(canvas.width, canvas.height, fps), framerate: fps, avc: { format: 'avc' }, latencyMode: 'quality', hardwareAcceleration: 'no-preference' });
  try {
    for (let index = 0; index < total; index++) {
      if (job.signal.aborted) return null;
      if (failure) throw failure;
      job.paint(Math.min(job.duration, index / fps));
      const frame = new VideoFrame(canvas, { timestamp: Math.round((index * 1_000_000) / fps), duration: Math.round(1_000_000 / fps) });
      encoder.encode(frame, { keyFrame: index % (fps * 2) === 0 });
      frame.close();
      job.onProgress((index + 1) / total);
      // Let the encoder catch up and the page breathe, so the phone does not run out of memory or freeze.
      if (encoder.encodeQueueSize > 8) await new Promise<void>((resolve) => { const check = () => (encoder.encodeQueueSize <= 2 ? resolve() : setTimeout(check, 5)); check(); });
      else if (index % 4 === 0) await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    await encoder.flush();
    if (failure) throw failure;
    if (!description || samples.length === 0) throw new Error('Encoding failed.');
    return { blob: new Blob([writeMp4(samples, description, canvas.width, canvas.height, fps) as BlobPart], { type: 'video/mp4' }), frames: samples.length };
  } finally {
    try { encoder.close(); } catch { /* already closed */ }
  }
}
