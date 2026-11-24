/**
 * One page for each common tournament size, such as /round-robin-schedule-6-teams and /knockout-bracket-8-teams.
 * Each page is the Tournament Fixtures Maker with the team count and format already set, plus written text that
 * includes the real match list for that size. The text is written into src/locales/packs/sports.en.json by
 * scripts/build-fixture-pages.mjs, and scripts/check-sports-fitness-logic.mjs checks the file is up to date.
 * To add a size: add a line here, run `node --experimental-strip-types scripts/build-fixture-pages.mjs`, add the
 * address to public/sitemap.xml and add a What's new entry.
 */
import type { PageGuideId } from '../lib/usePageGuide';

export type FixtureFormat = 'roundRobin' | 'knockout';

export interface FixturePage {
  /** Route, for example /round-robin-schedule-6-teams. The key in guideSteps and toolArticles is the path without the slash. */
  path: string;
  format: FixtureFormat;
  teams: number;
  /** Key in pageGuides for the heading, subtitle and questions. */
  guideKey: PageGuideId;
  /** Short name used in links to this page. */
  name: string;
}

const ROUND_ROBIN_SIZES = [4, 5, 6, 7, 8, 9, 10, 12];
const KNOCKOUT_SIZES = [6, 8, 10, 12, 16];

export const FIXTURE_PAGES: FixturePage[] = [
  ...ROUND_ROBIN_SIZES.map((teams): FixturePage => ({ path: `/round-robin-schedule-${teams}-teams`, format: 'roundRobin', teams, guideKey: `fixturesRoundRobin${teams}` as PageGuideId, name: `Round robin for ${teams} teams` })),
  ...KNOCKOUT_SIZES.map((teams): FixturePage => ({ path: `/knockout-bracket-${teams}-teams`, format: 'knockout', teams, guideKey: `fixturesKnockout${teams}` as PageGuideId, name: `Knockout bracket for ${teams} teams` })),
];
