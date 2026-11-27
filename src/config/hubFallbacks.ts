/**
 * Section pages for tool pages that are not listed in a home-page collection: sheet variants kept off the home page,
 * court sizes, tournament schedules and globe pages. The section link at the top of those pages uses these rules,
 * checked in order, so every tool page can link up to a section page. Paths are the `path` of an entry in HUBS.
 */
import { COURT_PAGES } from './courtPages';
import { FIXTURE_PAGES } from './fixturePages';
import { GLOBE_PAGES } from './globePages';
import { VARIANT_PAGES } from './homeSections';

export const SPORTS_HUB = '/sports-and-fitness-tools';
export const MEDIA_HUB = '/audio-and-video-tools';
export const PRINTABLES_HUB = '/printables-and-templates';

const SPORTS_PATHS = new Set([...COURT_PAGES, ...FIXTURE_PAGES].map((page) => page.path.replace(/^\//, '')));
const GLOBE_PATHS = new Set(GLOBE_PAGES.map((page) => page.path.replace(/^\//, '')));
const VARIANT_IDS = new Set(VARIANT_PAGES);

/** The section page for a tool that is in no collection, or null when no rule fits. */
export function fallbackHubPath(toolId: string): string | null {
  if (SPORTS_PATHS.has(toolId)) return SPORTS_HUB;
  if (GLOBE_PATHS.has(toolId)) return MEDIA_HUB;
  if (VARIANT_IDS.has(toolId) || /-(printable|template)s?$/.test(toolId)) return PRINTABLES_HUB;
  return null;
}
