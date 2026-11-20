import type { FontId, Sheet } from './geometry';
import { TONES, type ToneId } from './types';
import { THEMES, type Theme, type ThemeId } from '../records/theme';

/** What every maker keeps for look: the older ink tone, plus an optional colour theme and typeface. */
export interface StyleChoice { tone: ToneId; theme?: ThemeId; font?: FontId }

const TITLE_GRAY = '#444444';

/** The theme in use: the chosen one, or the one that matches the older ink tone. */
export function resolveTheme(s: StyleChoice): { id: ThemeId; theme: Theme } {
  const id: ThemeId = s.theme ?? (s.tone === 'charcoal' ? 'classic' : s.tone);
  return { id, theme: THEMES[id] ?? { ...THEMES.classic, ink: TONES[s.tone].color } };
}

/** Line colour for a maker's drawing code. */
export const inkOf = (s: StyleChoice): string => resolveTheme(s).theme.ink;

/** Applies the typeface to every text item and colours big bold titles in the theme's accent colour. Page numbers keep the plain font. */
export function restyle(sheets: Sheet[], s: StyleChoice): Sheet[] {
  const { theme } = resolveTheme(s);
  const font = s.font ?? 'sans';
  if (font === 'sans' && (theme.accent === TITLE_GRAY || theme.accent === '#111111')) return sheets;
  return sheets.map((sheet) => ({
    ...sheet,
    fixed: sheet.fixed.map((item) => {
      if (item.t !== 'text') return item;
      const title = item.bold && ((item.size >= 14 && item.c === TITLE_GRAY) || (item.size >= 18 && item.c === '#111111'));
      return { ...item, ...(title ? { c: theme.accent } : {}), ...(font !== 'sans' ? { font } : {}) };
    }),
  }));
}
