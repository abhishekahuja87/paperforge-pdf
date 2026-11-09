import { POSTER_FONT_CSS_URL, POSTER_FONT_FAMILIES } from '../../config/posterThemes';

let pending: Promise<boolean> | null = null;

/**
 * Loads the poster fonts from Google Fonts. This is the only place the site contacts Google Fonts, and it only runs on the
 * Offer Poster Maker page. Resolves true when the fonts are ready, false when they could not be loaded (offline, blocked);
 * the designs then fall back to the system fonts named in each theme.
 */
export function loadPosterFonts(): Promise<boolean> {
  if (pending) return pending;
  pending = new Promise<boolean>((resolve) => {
    if (typeof document === 'undefined') { resolve(false); return; }
    const timer = window.setTimeout(() => resolve(false), 8000);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = POSTER_FONT_CSS_URL;
    link.onload = () => {
      const sample = 'Aa Bb 0123456789 ₹ अआइ';
      Promise.all(POSTER_FONT_FAMILIES.flatMap((family) => [
        document.fonts.load(`400 40px "${family}"`, sample),
        document.fonts.load(`700 40px "${family}"`, sample),
      ])).then(() => { window.clearTimeout(timer); resolve(true); }, () => { window.clearTimeout(timer); resolve(false); });
    };
    link.onerror = () => { window.clearTimeout(timer); resolve(false); };
    document.head.appendChild(link);
  });
  return pending;
}
