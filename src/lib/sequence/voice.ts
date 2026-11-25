/**
 * Voice for the diagram video: record from the microphone (or read an audio file) and prepare it to go into the video.
 * The sound stays on the device. Recording needs the person's permission, asked by the browser.
 */
import { readMusic } from '../globe/audio';

const RATE = 48000;

export interface Voice { buffer: AudioBuffer; name: string; /** Seconds, as recorded. */ seconds: number }

export const canRecordVoice = () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

/** Reads a voice file (MP3, M4A, WAV, OGG and so on). */
export async function readVoiceFile(file: File): Promise<Voice> {
  const music = await readMusic(file);
  return { buffer: music.buffer, name: music.name, seconds: music.buffer.duration };
}

export interface VoiceRecorder { stop: () => Promise<Voice>; cancel: () => void; /** Seconds since the recording began. */ elapsed: () => number }

/** Starts recording. Rejects when the microphone is blocked or missing. */
export async function startVoiceRecording(): Promise<VoiceRecorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const recorder = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
  const finished = new Promise<Blob>((resolve) => { recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })); });
  const begin = performance.now();
  recorder.start(250);
  const release = () => stream.getTracks().forEach((track) => track.stop());
  return {
    elapsed: () => (performance.now() - begin) / 1000,
    cancel: () => { try { if (recorder.state !== 'inactive') recorder.stop(); } catch { /* already stopped */ } release(); },
    stop: async () => {
      if (recorder.state !== 'inactive') recorder.stop();
      const blob = await finished; release();
      const file = new File([blob], 'voice', { type: blob.type });
      const voice = await readVoiceFile(file);
      return { ...voice, name: 'Voice recording' };
    },
  };
}

/** The voice as stereo sound at 48 kHz, exactly `duration` seconds long, with silence after it ends. No fades, so no word is cut. */
export async function renderVoice(voice: Voice, duration: number): Promise<Float32Array[]> {
  const frames = Math.ceil(duration * RATE);
  const offline = new OfflineAudioContext(2, frames, RATE);
  const source = offline.createBufferSource();
  source.buffer = voice.buffer; source.connect(offline.destination); source.start(0);
  const done = await offline.startRendering();
  return [done.getChannelData(0), done.getChannelData(1)];
}

/** The same sound as a buffer for the real-time recorder, which repeats a buffer that is shorter than the video, so it is padded with silence to the full length. */
export async function paddedVoice(voice: Voice, duration: number): Promise<AudioBuffer> {
  const channels = await renderVoice(voice, duration);
  const buffer = new AudioBuffer({ length: channels[0]!.length, numberOfChannels: 2, sampleRate: RATE });
  buffer.copyToChannel(channels[0]! as Float32Array<ArrayBuffer>, 0); buffer.copyToChannel(channels[1]! as Float32Array<ArrayBuffer>, 1);
  return buffer;
}

/** Plays the voice from `from` seconds in, so the preview can be heard along with the picture. Call `stop` to end it. */
export function playVoice(voice: Voice, from: number): { stop: () => void } {
  const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Context || from >= voice.buffer.duration) return { stop: () => undefined };
  const context = new Context();
  const source = context.createBufferSource();
  source.buffer = voice.buffer; source.connect(context.destination); source.start(0, Math.max(0, from));
  return { stop: () => { try { source.stop(); } catch { /* already ended */ } void context.close(); } };
}
