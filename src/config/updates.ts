/**
 * Public list of improvements, newest first. Shown on /whats-new and in the "What's new" strip on the home page.
 * The entries themselves are in updateEntries.ts; add an entry there with every user-visible change to a tool.
 */
import { ENTRIES, type SiteUpdate } from './updateEntries';

export type { SiteUpdate };

/** Newest day first (sorted here, so the order they are written in does not matter). Dates must never be later than today. */
export const UPDATES: SiteUpdate[] = ENTRIES.map((entry, index) => ({ entry, index }))
  .sort((a, b) => (a.entry.date === b.entry.date ? a.index - b.index : a.entry.date < b.entry.date ? 1 : -1))
  .map(({ entry }) => entry);

export const RECENT_DAYS = 45;

const DAY_MS = 24 * 60 * 60 * 1000;

export function isRecent(update: SiteUpdate, now: Date = new Date()): boolean {
  const age = now.getTime() - new Date(`${update.date}T00:00:00Z`).getTime();
  return age <= RECENT_DAYS * DAY_MS;
}

/** The newest recent update for a tool route, or undefined. */
export function recentUpdateFor(path: string, now: Date = new Date()): SiteUpdate | undefined {
  const clean = path.replace(/\/+$/, '') || '/';
  return UPDATES.find((update) => update.path === clean && isRecent(update, now));
}

export function formatUpdateDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
