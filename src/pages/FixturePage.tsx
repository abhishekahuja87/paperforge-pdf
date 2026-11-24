import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ToolGuide } from '../components/common/ToolGuide';
import { ToolLayout } from '../components/layout/ToolLayout';
import TournamentFixtures from '../components/tools/sports/TournamentFixtures';
import { FIXTURE_PAGES, type FixturePage as FixturePageItem } from '../config/fixturePages';
import { usePageGuide } from '../lib/usePageGuide';

/** A tournament size page, such as round robin for 6 teams. It is the Tournament Fixtures Maker with the team count and format already set. */
export const FixturePage: React.FC<{ page: FixturePageItem }> = ({ page }) => {
  const { i18n } = useTranslation();
  const guide = usePageGuide(page.guideKey);
  const same = FIXTURE_PAGES.filter((item) => item.format === page.format && item.path !== page.path);
  const other = FIXTURE_PAGES.filter((item) => item.format !== page.format);
  const links = (items: FixturePageItem[]) => items.map((item, index) => (
    <React.Fragment key={item.path}><Link to={item.path} className="font-semibold text-orange-800 underline">{item.name}</Link>{index < items.length - 1 ? ', ' : '. '}</React.Fragment>
  ));
  return (
    <ToolLayout title={guide.title} subtitle={guide.subtitle} contentLanguage={i18n.language} seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}>
      <TournamentFixtures preset={{ teams: page.teams, format: page.format === 'knockout' ? 'knockout' : 'single', storageKey: `mdu-fixtures-${page.format}-${page.teams}-v1` }} />
      <nav aria-label="More tournament sizes" className="mx-auto mt-4 w-full max-w-3xl space-y-1 text-sm text-slate-700">
        <p>{page.format === 'roundRobin' ? 'Other round robin sizes: ' : 'Other knockout sizes: '}{links(same)}</p>
        <p>{page.format === 'roundRobin' ? 'Knockout brackets: ' : 'Round robin schedules: '}{links(other)}</p>
        <p>Or use the <Link to="/tournament-fixtures-maker" className="font-semibold text-orange-800 underline">Tournament Fixtures Maker</Link> for any number of teams.</p>
      </nav>
    </ToolLayout>
  );
};

export default FixturePage;
