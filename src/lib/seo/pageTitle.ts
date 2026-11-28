/** Search results show about 60 characters of a page title and cut the rest. */
export const TITLE_LIMIT = 60;

/**
 * The text of the browser tab and search result title. The brand follows the page name only when the two fit in the
 * limit; otherwise the brand is left off, so the words people search for are never the part that gets cut.
 * The browser (PageMetadata) and the pre-rendered pages (scripts/prerender-shell.mjs) must use this one rule.
 */
export function pageTitle(title: string, brand: string): string {
  const withBrand = `${title} | ${brand}`;
  return withBrand.length <= TITLE_LIMIT ? withBrand : title;
}
