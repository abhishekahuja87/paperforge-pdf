/** Pure logic for the clock-based screens: exam hall display, daily timings board and token display. */

export const pad2 = (value: number): string => String(value).padStart(2, '0');

/** "09:30" -> minutes since midnight, or null when it is not a time. */
export function minutesOf(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

export const nowMinutes = (now: Date): number => now.getHours() * 60 + now.getMinutes();

/** "14:05" -> "2:05 PM". */
export function time12(time: string): string {
  const total = minutesOf(time);
  if (total === null) return time;
  const hours = Math.floor(total / 60);
  return `${hours % 12 === 0 ? 12 : hours % 12}:${pad2(total % 60)} ${hours < 12 ? 'AM' : 'PM'}`;
}

export const clockText = (now: Date, withSeconds: boolean): string => {
  const hours = now.getHours();
  return `${hours % 12 === 0 ? 12 : hours % 12}:${pad2(now.getMinutes())}${withSeconds ? `:${pad2(now.getSeconds())}` : ''} ${hours < 12 ? 'AM' : 'PM'}`;
};

// ---- Exam hall ----
export type ExamPhase = 'before' | 'running' | 'warning' | 'over';
export interface ExamState { phase: ExamPhase; /** Milliseconds until the exam starts (before) or ends (running, warning). */ remainingMs: number; start: Date; end: Date }

/** Where an exam stands at `now`. warnMinutes: the exam turns to the warning phase for the last N minutes. */
export function examStateAt(now: Date, startDate: Date, durationMinutes: number, warnMinutes: number): ExamState | null {
  if (durationMinutes <= 0) return null;
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  const t = now.getTime();
  if (t < startDate.getTime()) return { phase: 'before', remainingMs: startDate.getTime() - t, start: startDate, end: endDate };
  if (t >= endDate.getTime()) return { phase: 'over', remainingMs: 0, start: startDate, end: endDate };
  const remainingMs = endDate.getTime() - t;
  return { phase: remainingMs <= warnMinutes * 60000 ? 'warning' : 'running', remainingMs, start: startDate, end: endDate };
}

/** Start time is today's date at `start` ("HH:MM"). */
export function examState(now: Date, start: string, durationMinutes: number, warnMinutes: number): ExamState | null {
  const at = minutesOf(start);
  if (at === null) return null;
  return examStateAt(now, new Date(now.getFullYear(), now.getMonth(), now.getDate(), Math.floor(at / 60), at % 60, 0, 0), durationMinutes, warnMinutes);
}

export function hms(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0 ? `${hours}:${pad2(minutes)}:${pad2(seconds)}` : `${minutes}:${pad2(seconds)}`;
}

// ---- Daily timings ----
export interface TimingRow { time: string; title: string; note: string }

/** Rows sorted by time. Rows with a time that cannot be read go last. */
export function sortedTimings(rows: TimingRow[]): TimingRow[] {
  return rows.map((row, index) => ({ row, index, at: minutesOf(row.time) })).sort((a, b) => (a.at ?? 99999) - (b.at ?? 99999) || a.index - b.index).map((entry) => entry.row);
}

/** Index (in the sorted list) of the row that is on now and of the next one. */
export function timingsNow(sorted: TimingRow[], minutes: number): { current: number; next: number } {
  let current = -1;
  sorted.forEach((row, index) => { const at = minutesOf(row.time); if (at !== null && at <= minutes) current = index; });
  const nextIndex = sorted.findIndex((row) => { const at = minutesOf(row.time); return at !== null && at > minutes; });
  return { current, next: nextIndex };
}

// ---- Token display ----
export interface TokenState { prefix: string; current: number; last: number[]; counter: string }
export const formatToken = (prefix: string, value: number, width: number): string => `${prefix.trim()}${String(value).padStart(width, '0')}`;
export function callNext(state: TokenState, by: number): TokenState {
  const target = Math.max(0, state.current + by);
  if (target === state.current) return state;
  return { ...state, current: target, last: by > 0 ? [state.current, ...state.last].filter((value) => value > 0).slice(0, 6) : state.last };
}
