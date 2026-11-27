/**
 * Old addresses that were merged into another page. Google keeps showing an old address for weeks after a page goes,
 * so every removed address that was ever in the sitemap is sent to the page that replaced it:
 * - in the app, `App.tsx` turns each entry into a redirect route;
 * - at build time, `scripts/prerender-shell.mjs` writes a small page at the old address with a canonical link and an
 *   instant refresh to the new one (static hosting cannot send a real 301 from the repository), and leaves it out of
 *   the sitemap.
 * When a page is removed or merged, add its old address here. Never point an entry at another entry.
 */
export const REDIRECTS: Record<string, string> = {
  '/resize-image-to-20kb': '/image-resizer',
  '/resize-image-to-30kb': '/image-resizer',
  '/resize-image-to-50kb': '/image-resizer',
  '/resize-image-to-100kb': '/image-resizer',
  '/resize-image-to-200kb': '/image-resizer',
  '/signature-resizer': '/image-resizer',
  '/passport-photo-resizer': '/image-resizer',
  '/exam-photo-resizer': '/image-resizer',
  '/double-sided-flashcards-printable': '/printable-flashcard-maker',
  '/resume-word-maker': '/resume-builder',
  '/yoga-class-display': '/step-by-step-routine-display',
};
