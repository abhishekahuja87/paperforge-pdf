/** Background music for the video: read the person's audio file, fit it to the video length with fades, and (for Smooth mode) encode it as AAC. Everything stays on the device. */

const RATE = 48000;

export interface Music { buffer: AudioBuffer; name: string }

type ContextClass = typeof AudioContext;
const contextClass = (): ContextClass | undefined => window.AudioContext ?? (window as unknown as { webkitAudioContext?: ContextClass }).webkitAudioContext;

/** Reads MP3, M4A, WAV, OGG and other formats the browser can play. */
export async function readMusic(file: File): Promise<Music> {
  const Context = contextClass();
  if (!Context) throw new Error('This browser cannot read audio.');
  const context = new Context();
  try { return { buffer: await context.decodeAudioData(await file.arrayBuffer()), name: file.name }; } finally { void context.close(); }
}

/** Volume over time: a short fade in, and a fade out over the last seconds so the music ends with the video. */
export const musicGain = (seconds: number, duration: number, volume: number) => volume * Math.min(1, seconds / 0.4) * Math.min(1, Math.max(0, (duration - seconds) / Math.min(2, duration * 0.25)));

/** Mixes the music into exactly `duration` seconds of stereo sound at 48 kHz. Music shorter than the video repeats. */
export async function renderMusic(music: Music, duration: number, volume: number): Promise<Float32Array[]> {
  const frames = Math.ceil(duration * RATE);
  const offline = new OfflineAudioContext(2, frames, RATE);
  const source = offline.createBufferSource();
  source.buffer = music.buffer; source.loop = true;
  const gain = offline.createGain();
  const steps = Math.max(2, Math.ceil(duration * 20));
  gain.gain.setValueAtTime(0, 0);
  for (let i = 0; i <= steps; i++) { const t = (i / steps) * duration; gain.gain.linearRampToValueAtTime(musicGain(t, duration, volume), t); }
  source.connect(gain).connect(offline.destination);
  source.start(0);
  const done = await offline.startRendering();
  return [done.getChannelData(0), done.getChannelData(1)];
}

export interface AacTrack { samples: Uint8Array[]; description: Uint8Array; sampleRate: number; channels: number }

export async function canEncodeAac(): Promise<boolean> {
  const w = window as unknown as { AudioEncoder?: typeof AudioEncoder; AudioData?: unknown };
  if (!w.AudioEncoder || !w.AudioData) return false;
  try { return !!(await AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate: RATE, numberOfChannels: 2, bitrate: 128000 })).supported; } catch { return false; }
}

/** Encodes stereo sound as AAC, ready to go into an MP4 file. */
export async function encodeAac(channels: Float32Array[]): Promise<AacTrack> {
  const samples: Uint8Array[] = [];
  let description: Uint8Array | null = null;
  let failure: Error | null = null;
  const encoder = new AudioEncoder({
    output: (chunk, meta) => {
      const data = new Uint8Array(chunk.byteLength); chunk.copyTo(data); samples.push(data);
      const config = meta?.decoderConfig?.description;
      if (config && !description) { const view = config as ArrayBuffer | ArrayBufferView; description = ArrayBuffer.isView(view) ? new Uint8Array(view.buffer, view.byteOffset, view.byteLength) : new Uint8Array(view); }
    },
    error: (error) => { failure = error instanceof Error ? error : new Error('Audio encoding failed.'); },
  });
  encoder.configure({ codec: 'mp4a.40.2', sampleRate: RATE, numberOfChannels: 2, bitrate: 128000 });
  try {
    const block = 4800;
    for (let at = 0; at < channels[0]!.length; at += block) {
      if (failure) throw failure;
      const length = Math.min(block, channels[0]!.length - at);
      const planar = new Float32Array(length * 2);
      planar.set(channels[0]!.subarray(at, at + length), 0); planar.set(channels[1]!.subarray(at, at + length), length);
      const data = new AudioData({ format: 'f32-planar', sampleRate: RATE, numberOfFrames: length, numberOfChannels: 2, timestamp: Math.round((at / RATE) * 1_000_000), data: planar });
      encoder.encode(data); data.close();
      if (encoder.encodeQueueSize > 20) await new Promise<void>((resolve) => setTimeout(resolve, 5));
    }
    await encoder.flush();
    if (failure) throw failure;
    if (!description || samples.length === 0) throw new Error('Audio encoding failed.');
    return { samples, description, sampleRate: RATE, channels: 2 };
  } finally { try { encoder.close(); } catch { /* already closed */ } }
}
