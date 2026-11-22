/** Sound as separate channels of numbers between -1 and 1. */
export type Channels = Float32Array[];

/** Left and right channels of a decoded sound; a mono sound is used for both sides. */
export function toStereo(channels: Channels): Channels {
  return channels.length >= 2 ? [channels[0]!, channels[1]!] : [channels[0]!, channels[0]!];
}

/** Several sounds one after another. */
export function joinChannels(parts: Channels[]): Channels {
  const total = parts.reduce((sum, part) => sum + part[0]!.length, 0);
  const out: Channels = [new Float32Array(total), new Float32Array(total)];
  let at = 0;
  for (const part of parts) {
    out[0]!.set(part[0]!, at); out[1]!.set(part[1]!, at);
    at += part[0]!.length;
  }
  return out;
}

/** The part between two times, in seconds. */
export function sliceChannels(channels: Channels, rate: number, from: number, to: number): Channels {
  const length = channels[0]!.length;
  const a = Math.max(0, Math.min(length, Math.round(from * rate)));
  const b = Math.max(a, Math.min(length, Math.round(to * rate)));
  return channels.map((channel) => channel.slice(a, b));
}

/** Fade in at the start and fade out at the end. Works on a copy. */
export function applyFades(channels: Channels, rate: number, fadeIn: number, fadeOut: number): Channels {
  const length = channels[0]!.length;
  const inSamples = Math.min(length, Math.round(fadeIn * rate));
  const outSamples = Math.min(length, Math.round(fadeOut * rate));
  return channels.map((channel) => {
    const copy = channel.slice();
    for (let i = 0; i < inSamples; i += 1) copy[i] = copy[i]! * (i / inSamples);
    for (let i = 0; i < outSamples; i += 1) copy[length - 1 - i] = copy[length - 1 - i]! * (i / outSamples);
    return copy;
  });
}

/** Scales the sound so its loudest point reaches the given level (0 to 1). */
export function normalise(channels: Channels, level = 0.95): Channels {
  let peak = 0;
  for (const channel of channels) for (let i = 0; i < channel.length; i += 1) peak = Math.max(peak, Math.abs(channel[i]!));
  if (peak === 0) return channels;
  const gain = level / peak;
  return channels.map((channel) => channel.map((value) => value * gain));
}

/** A 16-bit WAV file that plays everywhere. */
export function encodeWav(channels: Channels, rate: number): Uint8Array {
  const count = channels.length; const length = channels[0]!.length;
  const bytes = new Uint8Array(44 + length * count * 2);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) => { for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i)); };
  text(0, 'RIFF'); view.setUint32(4, 36 + length * count * 2, true); text(8, 'WAVE'); text(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, count, true); view.setUint32(24, rate, true);
  view.setUint32(28, rate * count * 2, true); view.setUint16(32, count * 2, true); view.setUint16(34, 16, true);
  text(36, 'data'); view.setUint32(40, length * count * 2, true);
  let at = 44;
  for (let i = 0; i < length; i += 1) {
    for (let c = 0; c < count; c += 1) {
      const value = Math.max(-1, Math.min(1, channels[c]![i]!));
      view.setInt16(at, value < 0 ? Math.round(value * 32768) : Math.round(value * 32767), true);
      at += 2;
    }
  }
  return bytes;
}

/** Loudest value in each of `buckets` equal slices, for drawing the wave. */
export function peaks(channel: Float32Array, buckets: number): number[] {
  const size = Math.max(1, Math.floor(channel.length / buckets));
  const out: number[] = [];
  for (let b = 0; b < buckets; b += 1) {
    let peak = 0;
    for (let i = b * size; i < Math.min(channel.length, (b + 1) * size); i += 1) peak = Math.max(peak, Math.abs(channel[i]!));
    out.push(peak);
  }
  return out;
}

/** 3725.4 seconds as 1:02:05.4 */
export function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600); const m = Math.floor((safe % 3600) / 60); const s = safe % 60;
  const sec = s.toFixed(1).padStart(4, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/** Reads "1:02.5", "62.5" or "0:01:02" into seconds; null when it is not a time. */
export function parseTime(text: string): number | null {
  const parts = text.trim().split(':');
  if (parts.length === 0 || parts.length > 3 || parts.some((part) => part.trim() === '' || Number.isNaN(Number(part)))) return null;
  return parts.reduce((sum, part) => sum * 60 + Number(part), 0);
}
