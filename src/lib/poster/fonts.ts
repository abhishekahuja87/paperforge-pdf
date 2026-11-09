import { POSTER_FONT_FAMILIES } from '../../config/posterThemes';

let pending: Promise<void> | null = null;

/**
 * Waits for the bundled poster fonts (declared in components/tools/shops/posterFonts.css) so the first picture is drawn
 * with them. The fonts are files served by this site; nothing else is contacted. If one fails, the theme's fallback fonts are used.
 */
export function loadPosterFonts(): Promise<void> {
  if (pending) return pending;
  pending = typeof document === 'undefined' || !document.fonts
    ? Promise.resolve()
    : Promise.all(POSTER_FONT_FAMILIES.flatMap((family) => [
      document.fonts.load(`500 40px "${family}"`, 'Aa 0123'),
      document.fonts.load(`700 40px "${family}"`, 'Aa 0123'),
    ])).then(() => undefined, () => undefined);
  return pending;
}
