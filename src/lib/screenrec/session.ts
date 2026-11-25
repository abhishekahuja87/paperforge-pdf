/**
 * Records the screen with the person's face in a small bubble, on the device. The screen, the camera and the microphone are put together on a canvas
 * and recorded with the browser's own recorder, so nothing is uploaded. Phone browsers cannot record the screen, so this is for computers.
 * The picture is drawn on a timer that runs in a worker, because a page in the background (while the person shows another window) gets no animation frames.
 */
import { recordSupport, videoBitrate } from '../globe/record';

export type CornerId = 'bl' | 'br' | 'tl' | 'tr';
export type BubbleSizeId = 'small' | 'medium' | 'large';
export type BubbleShapeId = 'circle' | 'rounded';
export interface BubbleOptions { show: boolean; corner: CornerId; size: BubbleSizeId; shape: BubbleShapeId; mirror: boolean }
export interface SessionOptions { bubble: BubbleOptions; mic: boolean; systemSound: boolean; quality: 720 | 1080 }

export type StartFailure = 'screen' | 'camera' | 'mic' | 'unsupported';
export class StartError extends Error {
  reason: StartFailure;
  constructor(reason: StartFailure) { super(reason); this.reason = reason; }
}

/** True when this browser can record the screen. Phones and tablets cannot, even when the code exists. */
export function screenRecordingSupported(): boolean {
  if (typeof navigator === 'undefined' || typeof MediaRecorder === 'undefined') return false;
  if (!navigator.mediaDevices?.getDisplayMedia || !('captureStream' in HTMLCanvasElement.prototype)) return false;
  const touchOnly = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches;
  return !touchOnly;
}

const SIZE_SHARE: Record<BubbleSizeId, number> = { small: 0.2, medium: 0.28, large: 0.38 };

/** Draws the screen, as large as fits, on a dark background. */
export function drawScreen(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, W: number, H: number) {
  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);
  const vw = video.videoWidth, vh = video.videoHeight; if (!vw || !vh) return;
  const scale = Math.min(W / vw, H / vh); const w = vw * scale, h = vh * scale; ctx.drawImage(video, (W - w) / 2, (H - h) / 2, w, h);
}

/** Draws the camera in a bubble in a corner, with a white edge. */
export function drawBubble(ctx: CanvasRenderingContext2D, camera: HTMLVideoElement, W: number, H: number, bubble: BubbleOptions) {
  const vw = camera.videoWidth, vh = camera.videoHeight; if (!bubble.show || !vw || !vh) return;
  const d = Math.round(Math.min(W, H) * SIZE_SHARE[bubble.size]); const margin = Math.round(Math.min(W, H) * 0.035);
  const x = bubble.corner === 'bl' || bubble.corner === 'tl' ? margin : W - margin - d; const y = bubble.corner === 'tl' || bubble.corner === 'tr' ? margin : H - margin - d;
  ctx.save();
  ctx.beginPath();
  if (bubble.shape === 'circle') ctx.arc(x + d / 2, y + d / 2, d / 2, 0, Math.PI * 2); else ctx.roundRect(x, y, d, d, d * 0.18);
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = d * 0.06; ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.shadowColor = 'transparent';
  const inset = Math.max(3, d * 0.02); ctx.beginPath();
  if (bubble.shape === 'circle') ctx.arc(x + d / 2, y + d / 2, d / 2 - inset, 0, Math.PI * 2); else ctx.roundRect(x + inset, y + inset, d - inset * 2, d - inset * 2, d * 0.16);
  ctx.clip();
  const crop = Math.min(vw, vh); const sx = (vw - crop) / 2, sy = (vh - crop) / 2;
  if (bubble.mirror) { ctx.translate(x + d, y); ctx.scale(-1, 1); ctx.drawImage(camera, sx, sy, crop, crop, 0, 0, d, d); } else ctx.drawImage(camera, sx, sy, crop, crop, x, y, d, d);
  ctx.restore();
}

/** Calls `tick` about `fps` times a second even when the page is hidden, using a worker's timer. Returns a function that stops it. */
function startTicker(tick: () => void, fps: number): () => void {
  try {
    const worker = new Worker(URL.createObjectURL(new Blob([`setInterval(function(){postMessage(0)},${Math.round(1000 / fps)})`], { type: 'text/javascript' })));
    worker.onmessage = tick;
    return () => worker.terminate();
  } catch { const id = setInterval(tick, Math.round(1000 / fps)); return () => clearInterval(id); }
}

export interface Session {
  canvas: HTMLCanvasElement;
  /** Starts recording what is on the canvas. */
  begin: () => void;
  pause: () => void;
  resume: () => void;
  /** Seconds recorded so far, not counting pauses. */
  elapsed: () => number;
  /** Ends the recording and resolves with the file. */
  finish: () => Promise<{ blob: Blob; extension: 'mp4' | 'webm'; seconds: number }>;
  /** Throws everything away without making a file. */
  cancel: () => void;
  /** Called when the person stops sharing from the browser's own button. */
  onShareEnded: (callback: () => void) => void;
  hasSound: boolean;
}

const playing = async (stream: MediaStream) => {
  const video = document.createElement('video'); video.muted = true; video.playsInline = true; video.srcObject = stream;
  await video.play().catch(() => undefined);
  if (!video.videoWidth) await new Promise<void>((resolve) => { const done = () => resolve(); video.addEventListener('loadedmetadata', done, { once: true }); setTimeout(done, 4000); });
  return video;
};

/** Asks for the screen (the browser shows its own picker), the camera and the microphone, and gets ready. Rejects with a StartError that says what failed. */
export async function prepareSession(options: SessionOptions): Promise<Session> {
  if (!screenRecordingSupported()) throw new StartError('unsupported');
  const support = recordSupport(true); if (!support.ok) throw new StartError('unsupported');
  const opened: MediaStream[] = [];
  const closeAll = () => opened.forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
  let screen: MediaStream; let camera: MediaStream | null = null; let mic: MediaStream | null = null;
  try { screen = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: options.systemSound }); } catch { throw new StartError('screen'); }
  opened.push(screen);
  try { if (options.bubble.show) { camera = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false }); opened.push(camera); } } catch { closeAll(); throw new StartError('camera'); }
  try { if (options.mic) { mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false }); opened.push(mic); } } catch { closeAll(); throw new StartError('mic'); }

  const screenVideo = await playing(screen); const cameraVideo = camera ? await playing(camera) : null;
  const scale = Math.min(1, (options.quality === 1080 ? 1920 : 1280) / Math.max(1, screenVideo.videoWidth || 1280));
  const W = Math.max(2, Math.round(((screenVideo.videoWidth || 1280) * scale) / 2) * 2), H = Math.max(2, Math.round(((screenVideo.videoHeight || 720) * scale) / 2) * 2);
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H; const ctx = canvas.getContext('2d')!;
  const paint = () => { drawScreen(ctx, screenVideo, W, H); if (cameraVideo) drawBubble(ctx, cameraVideo, W, H, options.bubble); };
  paint(); const stopTicker = startTicker(paint, 30);

  const audioTracks: MediaStream[] = []; let context: AudioContext | null = null; let destination: MediaStreamAudioDestinationNode | null = null;
  const sound = [mic, options.systemSound && screen.getAudioTracks().length ? new MediaStream(screen.getAudioTracks()) : null].filter((s): s is MediaStream => !!s && s.getAudioTracks().length > 0);
  if (sound.length) { context = new AudioContext(); destination = context.createMediaStreamDestination(); sound.forEach((stream) => context!.createMediaStreamSource(stream).connect(destination!)); audioTracks.push(destination.stream); }
  const output = canvas.captureStream(30); audioTracks.forEach((stream) => stream.getAudioTracks().forEach((track) => output.addTrack(track)));
  const recorder = new MediaRecorder(output, { mimeType: support.mime, videoBitsPerSecond: Math.round(Math.min(8_000_000, Math.max(2_500_000, videoBitrate(W, H, 30) * 0.35))) });
  const chunks: BlobPart[] = []; recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };

  let counted = 0, since = 0, endedCallback: (() => void) | null = null;
  const live = () => (since ? (performance.now() - since) / 1000 : 0);
  const cleanup = () => { stopTicker(); closeAll(); void context?.close(); };
  screen.getVideoTracks()[0]?.addEventListener('ended', () => endedCallback?.());

  return {
    canvas, hasSound: sound.length > 0,
    begin: () => { recorder.start(1000); since = performance.now(); },
    pause: () => { if (recorder.state === 'recording') { recorder.pause(); counted += live(); since = 0; } },
    resume: () => { if (recorder.state === 'paused') { recorder.resume(); since = performance.now(); } },
    elapsed: () => counted + live(),
    onShareEnded: (callback) => { endedCallback = callback; },
    cancel: () => { endedCallback = null; try { if (recorder.state !== 'inactive') recorder.stop(); } catch { /* already stopped */ } cleanup(); },
    finish: () => new Promise((resolve, reject) => {
      const seconds = counted + live();
      recorder.onstop = () => { cleanup(); resolve({ blob: new Blob(chunks, { type: support.mime.split(';')[0] }), extension: support.extension, seconds }); };
      recorder.onerror = () => { cleanup(); reject(new Error('Recording failed.')); };
      if (recorder.state === 'inactive') { cleanup(); reject(new Error('Nothing was recorded.')); } else recorder.stop();
    }),
  };
}
