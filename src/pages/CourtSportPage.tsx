import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ToolGuide } from '../components/common/ToolGuide';
import { ToolLayout } from '../components/layout/ToolLayout';
import CourtGuide from '../components/tools/sports/CourtGuide';
import { COURT_PAGES, type CourtPage } from '../config/courtPages';
import { usePageGuide } from '../lib/usePageGuide';

/** A court size page for one sport. The guide is the same as on /sports-court-size-guide, with the sport already chosen. */
export const CourtSportPage: React.FC<{ page: CourtPage }> = ({ page }) => {
  const { i18n } = useTranslation();
  const guide = usePageGuide(page.guideKey);
  const others = COURT_PAGES.filter((item) => item.path !== page.path);
  return (
    <ToolLayout title={guide.title} subtitle={guide.subtitle} contentLanguage={i18n.language} seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}>
      <CourtGuide key={page.path} fixedSport={page.sportId} />
      <nav aria-label="More court sizes" className="mx-auto mt-4 w-full max-w-3xl text-sm text-slate-700">
        <p>
          More court sizes:{' '}
          {others.map((item, index) => <React.Fragment key={item.path}><Link to={item.path} className="font-semibold text-orange-800 underline">{item.name}</Link>{index < others.length - 1 ? ', ' : '. '}</React.Fragment>)}
          Or see <Link to="/sports-court-size-guide" className="font-semibold text-orange-800 underline">every sport in the Sports Court and Ground Size Guide</Link>.
        </p>
      </nav>
    </ToolLayout>
  );
};

export default CourtSportPage;
