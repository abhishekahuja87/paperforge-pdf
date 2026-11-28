import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ToolGuide } from '../components/common/ToolGuide';
import { ToolLayout } from '../components/layout/ToolLayout';
import GlobeVideoMaker from '../components/tools/globe/GlobeVideoMaker';
import { GLOBE_PAGES, type GlobePage } from '../config/globePages';
import { usePageGuide } from '../lib/usePageGuide';

/** A purpose page, such as the travel route video. It is the Globe Video Maker with a ready example already chosen. */
export const GlobePurposePage: React.FC<{ page: GlobePage }> = ({ page }) => {
  const { i18n } = useTranslation();
  const guide = usePageGuide(page.guideKey);
  const others = GLOBE_PAGES.filter((item) => item.path !== page.path);
  return (
    <ToolLayout title={guide.title} subtitle={guide.subtitle} contentLanguage={i18n.language} seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}>
      <GlobeVideoMaker key={page.path} preset={page.preset} />
      <nav aria-label="More globe videos" className="mx-auto mt-4 w-full max-w-3xl space-y-1 text-sm text-slate-700">
        <p>More globe videos: {others.map((item, index) => (
          <React.Fragment key={item.path}><Link to={item.path} className="font-semibold text-orange-800 underline">{item.name}</Link>{index < others.length - 1 ? ', ' : '. '}</React.Fragment>
        ))}</p>
        <p>Or use the <Link to="/globe-video-maker" className="font-semibold text-orange-800 underline">Globe Video Maker</Link> to start from a blank route.</p>
      </nav>
    </ToolLayout>
  );
};

export default GlobePurposePage;
