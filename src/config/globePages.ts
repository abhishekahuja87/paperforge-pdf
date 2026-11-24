/**
 * Six purpose pages for the Globe Video Maker, such as the travel route video and the flight path animation.
 * Each page is the Globe Video Maker with a ready example already chosen (see src/lib/globe/presets.ts), plus its
 * own written text in src/locales/packs/globe.pages.en.json.
 * To add a page: add a line here, add its text to the locale file, add the address to public/sitemap.xml and add a What's new entry.
 */
import type { PageGuideId } from '../lib/usePageGuide';

export interface GlobePage {
  /** Route. The key in guideSteps and toolArticles is the path without the slash. */
  path: string;
  /** Id of the example in GLOBE_PRESETS. */
  preset: string;
  /** Key in pageGuides for the heading, subtitle and questions. */
  guideKey: PageGuideId;
  /** Short name used in links to this page. */
  name: string;
}

export const GLOBE_PAGES: GlobePage[] = [
  { path: '/travel-route-video-maker', preset: 'travel', guideKey: 'globeTravelRoute' as PageGuideId, name: 'Travel route video' },
  { path: '/flight-path-animation-maker', preset: 'flight', guideKey: 'globeFlightPath' as PageGuideId, name: 'Flight path animation' },
  { path: '/moving-abroad-announcement-video', preset: 'moving', guideKey: 'globeMoving' as PageGuideId, name: 'Moving abroad announcement' },
  { path: '/export-shipping-route-video-maker', preset: 'export', guideKey: 'globeExport' as PageGuideId, name: 'Export and shipping route video' },
  { path: '/globe-intro-video-maker', preset: 'intro', guideKey: 'globeIntro' as PageGuideId, name: 'YouTube globe intro' },
  { path: '/countries-visited-map-video', preset: 'visited', guideKey: 'globeVisited' as PageGuideId, name: 'Countries visited video' },
];
