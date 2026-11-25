/**
 * Reading a video the person picked: its size and length, its sound, and the picture at any moment.
 * Everything stays on the device. The browser's own video player does the reading, so no extra code is downloaded.
 */
import { readVoiceFile, renderVoice, type Voice } from '../sequence/voice';

export interface OpenedVideo {
  video: HTMLVideoElement;
  url: string;
  /** Picture size as shown, so a phone video that is turned sideways in the file comes out upright. */
  width: number;
  height: number;
  /** Seconds. */
  duration: number;
  release: () => void;
}

const wait = (target: EventTarget, name: string, ms: number) => new Promise<boolean>((resolve) => {
  const done = (ok: boolean) => { clearTimeout(timer); target.removeEventListener(name, on); resolve(ok); };
  const on = () => done(true);
  const timer = setTimeout(() => done(false), ms);
  target.addEventListener(name, on, { once: true });
});

/** Opens a video file. Rejects when the browser cannot play it. */
export async function openVideo(file: File): Promise<OpenedVideo> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true; video.playsInline = true; video.preload = 'auto'; video.src = url;
  const release = () => { try { video.pause(); } catch { /* nothing playing */ } video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); };
  try {
    const loaded = await Promise.race([wait(video, 'loadeddata', 20000), wait(video, 'error', 20000).then(() => false)]);
    if (!loaded || !video.videoWidth || !video.videoHeight) throw new Error('This video cannot be read.');
    let duration = video.duration;
    // Some recorded files (WebM from a screen recorder) do not say how long they are. Jumping far ahead makes the browser work it out.
    if (!Number.isFinite(duration)) {
      video.currentTime = 1e7; await wait(video, 'seeked', 8000);
      duration = Number.isFinite(video.duration) ? video.duration : video.currentTime;
      video.currentTime = 0; await wait(video, 'seeked', 8000);
    }
    if (!Number.isFinite(duration) || duration <= 0) throw new Error('This video has no length.');
    return { video, url, width: video.videoWidth, height: video.videoHeight, duration, release };
  } catch (error) { release(); throw error; }
}

/** Moves the video to a moment and waits until that picture is ready to draw. */
export async function seekVideo(video: HTMLVideoElement, seconds: number): Promise<void> {
  const at = Math.max(0, Math.min(seconds, Math.max(0, (Number.isFinite(video.duration) ? video.duration : seconds) - 0.001)));
  if (Math.abs(video.currentTime - at) < 0.0005 && video.readyState >= 2) return;
  const arrived = wait(video, 'seeked', 5000);
  video.currentTime = at;
  await arrived;
}

/** The sound of a video file, or null when it has none or the browser cannot read it. */
export async function readVideoSound(file: File): Promise<Voice | null> {
  try { return await readVoiceFile(file); } catch { return null; }
}

/** A part of a sound as stereo at 48 kHz, exactly `duration` seconds long. */
export async function soundPart(voice: Voice, start: number, duration: number): Promise<Float32Array[]> {
  const RATE = 48000;
  const offline = new OfflineAudioContext(2, Math.max(1, Math.ceil(duration * RATE)), RATE);
  const source = offline.createBufferSource(); source.buffer = voice.buffer; source.connect(offline.destination); source.start(0, Math.max(0, start), duration);
  const done = await offline.startRendering();
  return [done.getChannelData(0), done.getChannelData(1)];
}

/** A part of a sound as a voice, for the real-time recorder and for hearing it in the preview. */
export async function soundPartVoice(voice: Voice, start: number, duration: number): Promise<Voice> {
  const channels = await soundPart(voice, start, duration);
  const buffer = new AudioBuffer({ length: channels[0]!.length, numberOfChannels: 2, sampleRate: 48000 });
  buffer.copyToChannel(channels[0]! as Float32Array<ArrayBuffer>, 0); buffer.copyToChannel(channels[1]! as Float32Array<ArrayBuffer>, 1);
  return { buffer, name: voice.name, seconds: duration };
}

export { renderVoice };

/** Even numbers, because video codecs need them. */
const even = (value: number) => Math.max(2, Math.round(value / 2) * 2);

/** The picture size when the shorter side is limited to `shortSide` pixels (0 means keep the original). A video is never made bigger. */
export function fitSize(width: number, height: number, shortSide: number): { width: number; height: number } {
  const short = Math.min(width, height);
  const scale = shortSide > 0 && short > shortSide ? shortSide / short : 1;
  return { width: even(width * scale), height: even(height * scale) };
}

export type QualityId = 'high' | 'medium' | 'low';
/** Bits for each pixel in each frame. Real phone videos look fine at the medium figure and stay clean at the high one. */
const BITS_PER_PIXEL: Record<QualityId, number> = { high: 0.1, medium: 0.06, low: 0.035 };
const AUDIO_BITS = 128000;

export interface BitratePlan { bitrate: number; /** Estimated size of the file in bytes. */ bytes: number; /** True when a size limit could not be met even at the lowest quality. */ tooSmall: boolean }

/**
 * Picks the picture's bits per second. With a size limit in megabytes the figure is worked out so the file fits (a little under, as files vary);
 * otherwise it comes from the quality choice. It never goes above what the high setting would use, so a short clip is not made bigger than needed.
 */
export function planBitrate(width: number, height: number, fps: number, seconds: number, quality: QualityId, limitMb: number, sound: boolean): BitratePlan {
  const ceiling = Math.max(150_000, Math.round(width * height * fps * BITS_PER_PIXEL.high));
  const audio = sound ? AUDIO_BITS : 0;
  let bitrate = Math.max(150_000, Math.round(width * height * fps * BITS_PER_PIXEL[quality]));
  let tooSmall = false;
  if (limitMb > 0) {
    const room = (limitMb * 1024 * 1024 * 8 * 0.93) / Math.max(1, seconds) - audio;
    if (room < 150_000) { bitrate = 150_000; tooSmall = true; } else bitrate = Math.min(ceiling, Math.round(room));
  }
  return { bitrate, bytes: Math.round(((bitrate + audio) * seconds) / 8), tooSmall };
}
