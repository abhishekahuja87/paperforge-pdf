/**
 * One page per sport for court size searches, such as /kho-kho-court-size. Each page shows the same guide as
 * /sports-court-size-guide, locked to one sport, with its own heading, steps, written sections and questions.
 * The text lives in src/locales/packs/sports.en.json (pageGuides, guideSteps, toolArticles).
 * To add a sport: add its copy there, then add a line here. Routes, the static pages and the sitemap follow from this list.
 */
import type { PageGuideId } from '../lib/usePageGuide';

export interface CourtPage {
  /** Route, for example /kho-kho-court-size. The key in guideSteps and toolArticles is the path without the slash. */
  path: string;
  /** Sport id in src/lib/sports/courtData.ts. */
  sportId: string;
  /** Key in pageGuides for the heading, subtitle and questions. */
  guideKey: PageGuideId;
  /** Short name used in links to this page. */
  name: string;
}

export const COURT_PAGES: CourtPage[] = [
  { path: '/kho-kho-court-size', sportId: 'khoKho', guideKey: 'sportsKhoKhoCourt', name: 'Kho kho court size' },
  { path: '/kabaddi-court-size', sportId: 'kabaddi', guideKey: 'sportsKabaddiCourt', name: 'Kabaddi court size' },
];

export const courtPageFor = (sportId: string): CourtPage | undefined => COURT_PAGES.find((page) => page.sportId === sportId);
