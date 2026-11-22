/** Pure logic for the big-screen tools (interval timer, yoga display, spelling bee, menu board, notice board). No React, so it can be tested on its own. */

export type Tone = 'work' | 'rest' | 'info' | 'reveal';
export type Theme = 'dark' | 'light' | 'orange' | 'green' | 'blue' | 'rose';
export const THEMES: Array<{ id: Theme; label: string }> = [
  { id: 'dark', label: 'Dark' }, { id: 'light', label: 'Light' }, { id: 'orange', label: 'Sunrise' }, { id: 'green', label: 'Forest' }, { id: 'blue', label: 'Ocean' }, { id: 'rose', label: 'Rose' },
];
export const THEME_IDS: Theme[] = THEMES.map((entry) => entry.id);
/** Read a saved theme; older saves only had a light-screen tick box. */
export const readTheme = (value: unknown, legacyLight?: unknown): Theme => (THEME_IDS.includes(value as Theme) ? (value as Theme) : legacyLight === true ? 'light' : 'dark');

export interface BoardRow { left: string; right?: string; sub?: string; image?: string }

/** One screen of a timed show. seconds = 0 means it waits for a click or the next button. */
export interface TimedSlide {
  key: string;
  chip?: string;
  title: string;
  note?: string;
  image?: string;
  /** A second picture that fades in and out over the first (the two photos of an exercise). */
  image2?: string;
  /** A video played on the slide. Only lasts for the visit, so it is never saved. */
  video?: string;
  rows?: BoardRow[];
  seconds: number;
  tone: Tone;
  next?: string;
  theme?: Theme;
}

export const clampInt = (value: number, min: number, max: number, fallback: number): number => (Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback);

export const totalSeconds = (slides: TimedSlide[]): number => slides.reduce((sum, slide) => sum + slide.seconds, 0);

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `${total} sec`;
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (minutes < 60) return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} sec`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min`;
}

export const formatClock = (seconds: number): string => {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

// ---- Interval and circuit timer ----
export interface IntervalConfig { prepare: number; work: number; rest: number; rounds: number; sets: number; setRest: number; names: string[] }

export function buildIntervalSlides(config: IntervalConfig): TimedSlide[] {
  const names = config.names.map((name) => name.trim()).filter(Boolean);
  const nameFor = (round: number): string => names[(round - 1) % Math.max(1, names.length)] ?? 'Work';
  const slides: TimedSlide[] = [];
  if (config.prepare > 0) slides.push({ key: 'prepare', chip: 'Get ready', title: 'Get ready', seconds: config.prepare, tone: 'info', next: nameFor(1) });
  for (let set = 1; set <= config.sets; set += 1) {
    for (let round = 1; round <= config.rounds; round += 1) {
      const lastRound = round === config.rounds;
      const lastSet = set === config.sets;
      const chip = `${config.sets > 1 ? `Set ${set} of ${config.sets} · ` : ''}Round ${round} of ${config.rounds}`;
      const upcoming = lastRound ? (lastSet ? undefined : nameFor(1)) : nameFor(round + 1);
      slides.push({ key: `w-${set}-${round}`, chip, title: nameFor(round), seconds: config.work, tone: 'work', next: lastRound && lastSet ? 'Finish' : config.rest > 0 && !lastRound ? 'Rest' : lastRound ? (config.setRest > 0 ? 'Set rest' : upcoming) : upcoming });
      if (!lastRound && config.rest > 0) slides.push({ key: `r-${set}-${round}`, chip, title: 'Rest', seconds: config.rest, tone: 'rest', next: nameFor(round + 1) });
      if (lastRound && !lastSet && config.setRest > 0) slides.push({ key: `s-${set}`, chip: `Set ${set} of ${config.sets} done`, title: 'Set rest', seconds: config.setRest, tone: 'rest', next: nameFor(1) });
    }
  }
  slides.push({ key: 'done', title: 'Done', note: 'Well done. Drink some water.', seconds: 0, tone: 'info' });
  return slides;
}

// ---- Yoga, stretch or any step-by-step sequence ----
export interface SequenceStep { name: string; note: string; seconds: number; image?: string; image2?: string }

export function buildSequenceSlides(steps: SequenceStep[], prepare: number, label: string): TimedSlide[] {
  const slides: TimedSlide[] = [];
  const first = steps[0];
  if (prepare > 0 && first) slides.push({ key: 'prepare', chip: 'Get ready', title: 'Get ready', note: 'Find a comfortable place and breathe steadily.', seconds: prepare, tone: 'info', next: first.name });
  steps.forEach((step, index) => {
    slides.push({ key: `s-${index}`, chip: `${label} ${index + 1} of ${steps.length}`, title: step.name, note: step.note.trim() || undefined, image: step.image, image2: step.image2, seconds: Math.max(1, step.seconds), tone: 'info', next: steps[index + 1]?.name ?? 'Finish' });
  });
  slides.push({ key: 'done', title: 'Done', note: 'Take a slow breath and relax.', seconds: 0, tone: 'info' });
  return slides;
}

// ---- Spelling and vocabulary bee ----
export interface WordEntry { word: string; hint: string; image?: string }
export type BeeMode = 'spell' | 'read';

export function buildBeeSlides(words: WordEntry[], mode: BeeMode, seconds: number, revealSeconds: number): TimedSlide[] {
  const slides: TimedSlide[] = [];
  words.forEach((entry, index) => {
    const chip = `Word ${index + 1} of ${words.length}`;
    const letters = entry.word.trim().toUpperCase().split('').join(' ');
    if (mode === 'spell') {
      slides.push({ key: `f-${index}`, chip, title: entry.hint.trim() || (entry.image ? 'Spell the word for this picture' : 'Spell the word'), note: entry.hint.trim() ? 'Spell the word that matches.' : undefined, image: entry.image, seconds, tone: 'info' });
      slides.push({ key: `b-${index}`, chip, title: entry.word.trim(), note: letters, image: entry.image, seconds: revealSeconds, tone: 'reveal' });
    } else {
      slides.push({ key: `f-${index}`, chip, title: entry.word.trim(), image: entry.image, seconds, tone: 'info' });
      slides.push({ key: `b-${index}`, chip, title: entry.word.trim(), note: entry.hint.trim() || undefined, image: entry.image, seconds: revealSeconds, tone: 'reveal' });
    }
  });
  slides.push({ key: 'done', title: 'That was the last word', note: 'Well done, everyone.', seconds: 0, tone: 'info' });
  return slides;
}

// ---- Notice and greeting board ----
export interface NoticeEntry { title: string; text: string; image: string; video?: string; theme: Theme }

export function buildNoticeSlides(notices: NoticeEntry[], seconds: number): TimedSlide[] {
  return notices.map((notice, index) => ({
    key: `n-${index}`, title: notice.title.trim(), note: notice.text.trim() || undefined, image: notice.image || undefined, video: notice.video || undefined, seconds, tone: 'info' as const, theme: notice.theme,
  }));
}

// ---- Menu and price board ----
export interface MenuItem { section: string; name: string; price: string; note: string; image?: string }

export function buildMenuSlides(items: MenuItem[], shop: string, perPage: number, seconds: number): TimedSlide[] {
  const sections: string[] = [];
  for (const item of items) { const name = item.section.trim(); if (!sections.includes(name)) sections.push(name); }
  const slides: TimedSlide[] = [];
  const many = sections.length > 1 || sections[0] !== '';
  for (const section of sections) {
    const inSection = items.filter((item) => item.section.trim() === section);
    const pages = Math.max(1, Math.ceil(inSection.length / perPage));
    for (let page = 0; page < pages; page += 1) {
      const rows = inSection.slice(page * perPage, (page + 1) * perPage).map((item) => ({ left: item.name.trim(), right: item.price.trim() || undefined, sub: item.note.trim() || undefined, image: item.image || undefined }));
      slides.push({ key: `m-${section}-${page}`, chip: shop.trim() || undefined, title: many && section ? section : shop.trim() || 'Menu', note: pages > 1 ? `${page + 1} of ${pages}` : undefined, rows, seconds, tone: 'info' });
    }
  }
  return slides;
}

// ---- Pasting many rows at once ----
/** Splits each pasted line into columns at a tab, a "|", or " - ". Lines with no separator fill the first column. */
export function splitLines(text: string, columns: number): string[][] {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const parts = (line.includes('\t') ? line.split('\t') : line.includes('|') ? line.split('|') : /\s[-–—]\s/.test(line) ? line.split(/\s[-–—]\s/) : [line]).map((part) => part.trim());
    const head = parts.slice(0, columns - 1);
    const tail = parts.slice(columns - 1).join(' - ');
    return [...head, ...(parts.length >= columns ? [tail] : [])];
  });
}
