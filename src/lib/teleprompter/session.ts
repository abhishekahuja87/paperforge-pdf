/**
 * Opening the camera and recording it for the Teleprompter. The script is shown on top of the camera picture on the screen only;
 * the recording is the plain camera picture and your voice. Everything stays on the device and the browser's own recorder does the work.
 */
export interface RecorderChoice { mime: string; extension: 'mp4' | 'webm' }

/** The best video format this browser can record, or null when it cannot record at all. */
export function pickRecorderMime(): RecorderChoice | null {
  if (typeof MediaRecorder === 'undefined') return null;
  const options: [string, 'mp4' | 'webm'][] = [['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'mp4'], ['video/mp4;codecs=avc1,mp4a.40.2', 'mp4'], ['video/mp4;codecs=avc1', 'mp4'], ['video/webm;codecs=vp9,opus', 'webm'], ['video/webm;codecs=vp8,opus', 'webm'], ['video/webm', 'webm']];
  for (const [mime, extension] of options) { if (MediaRecorder.isTypeSupported(mime)) return { mime, extension }; }
  return null;
}

export const canUseCamera = () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && pickRecorderMime() !== null;

/** Opens the camera, and the microphone when asked. Rejects with the browser's error when permission is refused. */
export function openCamera(facing: 'user' | 'environment', height: 720 | 1080, voice: boolean): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, height: { ideal: height }, width: { ideal: Math.round((height * 16) / 9) } }, audio: voice ? { echoCancellation: true, noiseSuppression: true } : false });
}

export const stopStream = (stream: MediaStream | null) => { stream?.getTracks().forEach((track) => track.stop()); };

export interface Take { stop: () => Promise<{ blob: Blob; extension: 'mp4' | 'webm'; seconds: number }>; pause: () => void; resume: () => void }

/** Starts recording a stream. `stop` finishes and gives the video file and how long it ran (not counting pauses). */
export function startTake(stream: MediaStream, choice: RecorderChoice): Take {
  const recorder = new MediaRecorder(stream, { mimeType: choice.mime, videoBitsPerSecond: 6_000_000 });
  const chunks: Blob[] = [];
  let started = performance.now(), paused = 0, pausedAt = 0;
  recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data); };
  recorder.start(1000);
  return {
    pause: () => { if (recorder.state === 'recording') { recorder.pause(); pausedAt = performance.now(); } },
    resume: () => { if (recorder.state === 'paused') { recorder.resume(); paused += performance.now() - pausedAt; } },
    stop: () => new Promise((resolve) => {
      recorder.onstop = () => resolve({ blob: new Blob(chunks, { type: choice.mime.split(';')[0] }), extension: choice.extension, seconds: Math.max(0, (performance.now() - started - paused) / 1000) });
      if (recorder.state === 'paused') paused += performance.now() - pausedAt;
      if (recorder.state !== 'inactive') recorder.stop(); else recorder.onstop?.(new Event('stop'));
      started = started || 0;
    }),
  };
}

export const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
