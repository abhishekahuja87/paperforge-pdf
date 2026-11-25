/**
 * Captions as a list of cues (a line of words with a start and an end time), and the two subtitle file formats most editors read: SRT and WebVTT.
 * Pure functions, so they can be checked on their own.
 */

export interface Cue { text: string; start: number; end: number }
export const MAX_LINES = 120;

/** One caption for each non-empty line of text, shortened to a sensible length. */
export function splitLines(text: string): string[] {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, MAX_LINES).map((line) => line.slice(0, 160));
}

export interface TimeOptions {
  /** Seconds to move every caption earlier, to make up for the time it takes to tap. */
  shift: number;
  /** Longest time a caption stays, in seconds. 0 keeps it until the next one starts. */
  hold: number;
  /** Length of the audio in seconds, or 0 when it is not known. */
  total: number;
}

/**
 * Turns the tapped times into cues. A line without a tapped time follows the one before it by two seconds, so the file is always complete.
 * Times never go backwards, and the last caption stays three seconds unless the audio ends sooner.
 */
export function cuesFromTimes(lines: string[], times: number[], options: TimeOptions): Cue[] {
  const starts: number[] = [];
  lines.forEach((_, k) => {
    const raw = k < times.length ? Math.max(0, (times[k] ?? 0) - options.shift) : (starts[k - 1] ?? -1.5) + 2;
    starts.push(k === 0 ? raw : Math.max(raw, starts[k - 1]! + 0.3));
  });
  const cues: Cue[] = [];
  lines.forEach((text, k) => {
    const start = starts[k]!;
    if (options.total > 0 && start >= options.total - 0.05) return;
    let end = k + 1 < starts.length ? starts[k + 1]! : start + 3;
    if (options.hold > 0) end = Math.min(end, start + options.hold);
    if (options.total > 0) end = Math.min(end, options.total);
    cues.push({ text, start, end: Math.max(end, start + 0.2) });
  });
  return cues;
}

export interface Segment { text: string; start: number; end: number }

/**
 * Splits spoken phrases into short captions of a few words each. A phrase's time is shared between its captions in proportion to their length.
 */
export function cuesFromSpeech(segments: Segment[], wordsPer: number): Cue[] {
  const size = Math.max(1, Math.min(12, Math.round(wordsPer)));
  const cues: Cue[] = [];
  for (const segment of segments) {
    const words = segment.text.split(/\s+/).filter(Boolean); if (words.length === 0) continue;
    const groups: string[] = [];
    for (let k = 0; k < words.length; k += size) groups.push(words.slice(k, k + size).join(' '));
    const weights = groups.map((group) => group.length + 2); const sum = weights.reduce((a, b) => a + b, 0);
    const span = Math.max(0.3, segment.end - segment.start); let cursor = segment.start;
    groups.forEach((text, k) => { const part = (span * weights[k]!) / sum; cues.push({ text, start: cursor, end: cursor + part }); cursor += part; });
  }
  return cues;
}

const pad = (value: number, size = 2) => String(value).padStart(size, '0');

/** A time as 00:00:03,250 (SRT) or 00:00:03.250 (WebVTT). */
export function stamp(seconds: number, comma: boolean): string {
  const total = Math.max(0, Math.round(seconds * 1000)); const ms = total % 1000; const s = Math.floor(total / 1000) % 60; const m = Math.floor(total / 60000) % 60; const h = Math.floor(total / 3600000);
  return `${pad(h)}:${pad(m)}:${pad(s)}${comma ? ',' : '.'}${pad(ms, 3)}`;
}

export const toSrt = (cues: Cue[]): string => cues.map((cue, k) => `${k + 1}\n${stamp(cue.start, true)} --> ${stamp(cue.end, true)}\n${cue.text}\n`).join('\n');
export const toVtt = (cues: Cue[]): string => `WEBVTT\n\n${cues.map((cue) => `${stamp(cue.start, false)} --> ${stamp(cue.end, false)}\n${cue.text}\n`).join('\n')}`;

/** The cue showing at a moment, or null between captions. */
export function activeCue(cues: Cue[], seconds: number): Cue | null {
  for (const cue of cues) if (seconds >= cue.start && seconds < cue.end) return cue;
  return null;
}
