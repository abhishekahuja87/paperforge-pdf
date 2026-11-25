/**
 * Reads subtitle text (SRT or WebVTT) into cues. Forgiving: a block it cannot read is skipped and counted, never fatal.
 * Pure functions, so they can be checked on their own.
 */
import { stamp, type Cue } from './cues';

export const MAX_CUES = 2000;

/** 00:01:02,500 or 01:02.500 or 1:02 as seconds, or null. */
export function readStamp(text: string): number | null {
  const match = /^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?$/.exec(text.trim());
  if (!match) return null;
  const hours = Number(match[1] ?? 0), minutes = Number(match[2]), seconds = Number(match[3]);
  const millis = match[4] ? Number(match[4].padEnd(3, '0')) : 0;
  if (minutes > 59 || seconds > 59) return null;
  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

export interface Imported { cues: Cue[]; skipped: number }

/** Reads SRT and WebVTT. Cue numbers, the WEBVTT header, NOTE and STYLE blocks, cue settings and simple tags such as <i> are dropped. */
export function parseSubtitles(raw: string): Imported {
  const text = raw.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const cues: Cue[] = []; let skipped = 0;
  for (const block of text.split(/\n{2,}/)) {
    const lines = block.split('\n').map((line) => line.trimEnd()).filter((line, k, all) => !(line === '' && (k === 0 || k === all.length - 1)));
    if (!lines.length) continue;
    if (/^(WEBVTT|NOTE|STYLE|REGION)/.test(lines[0]!.trim())) continue;
    const at = lines.findIndex((line) => line.includes('-->'));
    if (at < 0) { skipped += 1; continue; }
    const [from, rest] = lines[at]!.split('-->'); const to = (rest ?? '').trim().split(/\s+/)[0] ?? '';
    const start = readStamp(from ?? ''), end = readStamp(to);
    const body = lines.slice(at + 1).join('\n').replace(/<[^>]+>/g, '').replace(/\{\\[^}]*\}/g, '').trim();
    if (start === null || end === null || end <= start || !body) { skipped += 1; continue; }
    if (cues.length >= MAX_CUES) { skipped += 1; continue; }
    cues.push({ text: body, start, end });
  }
  cues.sort((a, b) => a.start - b.start);
  return { cues, skipped };
}

/** The cues as SRT text, so what the person sees in the box is a real file they could save. */
export const toSrtText = (cues: Cue[]): string => cues.map((cue, k) => `${k + 1}\n${stamp(cue.start, true)} --> ${stamp(cue.end, true)}\n${cue.text}\n`).join('\n');

/** A few short captions spread over the start of a video, so the tool can be tried without a subtitle file. */
export function sampleCues(duration: number, lines: string[]): Cue[] {
  const span = Math.max(1.5, Math.min(duration / Math.max(1, lines.length), 3.2));
  return lines.map((text, k) => ({ text, start: Math.round((0.3 + k * span) * 10) / 10, end: Math.round((0.3 + k * span + span * 0.9) * 10) / 10 })).filter((cue) => cue.start < duration - 0.3);
}
