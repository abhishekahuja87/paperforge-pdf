import type { Theme } from './timed';

/** The colours of one screen theme, as Tailwind class names, so every big screen uses the same few simple themes. */
export interface ThemeStyle {
  /** Background and text colour of the whole screen. */
  surface: string;
  muted: string;
  accent: string;
  /** A small label chip. */
  chip: string;
  /** A card or row on the screen. */
  card: string;
  /** A round control button. */
  btn: string;
  /** Progress bar fill and its track. */
  bar: string;
  track: string;
  /** The row that is on now and the one that is next (timings board). */
  now: string;
  next: string;
  /** True when the background is white, so text is dark. */
  onLight: boolean;
}

const COLOURED = (surface: string): ThemeStyle => ({
  surface: `${surface} text-white`, muted: 'text-white/85', accent: 'text-yellow-100', chip: 'bg-black/15 text-white', card: 'border-white/25 bg-black/10', btn: 'bg-black/15 hover:bg-black/25',
  bar: 'bg-white', track: 'bg-black/20', now: 'border-white bg-white text-stone-900', next: 'border-yellow-200 bg-black/20', onLight: false,
});

export const THEME_STYLES: Record<Theme, ThemeStyle> = {
  dark: { surface: 'bg-stone-950 text-white', muted: 'text-stone-300', accent: 'text-orange-300', chip: 'bg-white/10 text-orange-200', card: 'border-white/10 bg-white/5', btn: 'bg-white/10 hover:bg-white/20', bar: 'bg-orange-500', track: 'bg-white/10', now: 'border-green-500 bg-green-600 text-white', next: 'border-orange-400 bg-orange-500/20', onLight: false },
  light: { surface: 'bg-white text-stone-900', muted: 'text-stone-600', accent: 'text-orange-700', chip: 'bg-orange-50 text-orange-800', card: 'border-stone-200 bg-stone-50', btn: 'bg-stone-100 hover:bg-stone-200', bar: 'bg-orange-500', track: 'bg-stone-200', now: 'border-green-500 bg-green-600 text-white', next: 'border-orange-400 bg-orange-100', onLight: true },
  orange: COLOURED('bg-orange-600'),
  green: COLOURED('bg-green-800'),
  blue: COLOURED('bg-blue-800'),
  rose: COLOURED('bg-rose-700'),
};

/** Dot colours for the theme picker. */
export const THEME_SWATCH: Record<Theme, string> = {
  dark: 'bg-stone-950', light: 'bg-white border border-stone-300', orange: 'bg-orange-600', green: 'bg-green-800', blue: 'bg-blue-800', rose: 'bg-rose-700',
};
