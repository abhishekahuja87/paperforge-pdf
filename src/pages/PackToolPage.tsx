import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { ShareLinkBar } from '../components/common/ShareLinkBar';
import { ToolGuide } from '../components/common/ToolGuide';
import { ToolLayout } from '../components/layout/ToolLayout';
import { PACK_COMPONENTS } from '../components/tools/packRegistry';
import { findPackTool } from '../config/packs';
import { ShareProvider } from '../lib/shareState';
import { usePageGuide } from '../lib/usePageGuide';
import { NotFoundPage } from './NotFoundPage';

/** One page for every tool in a pack: heading and guide text from the pack's locale file, screen from the registry. */
export const PackToolPage: React.FC<{ kind: string }> = ({ kind }) => {
  const entry = findPackTool(kind);
  if (!entry) return <NotFoundPage />;
  return <PackToolContent kind={kind} guideKey={entry.guideKey} shareable={entry.shareable} />;
};

const PackToolContent: React.FC<{ kind: string; guideKey: Parameters<typeof usePageGuide>[0]; shareable: boolean }> = ({ kind, guideKey, shareable }) => {
  const { i18n } = useTranslation();
  const guide = usePageGuide(guideKey);
  const Screen = PACK_COMPONENTS[kind];
  return (
    <ToolLayout title={guide.title} subtitle={guide.subtitle} contentLanguage={i18n.language} seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}>
      <ShareProvider key={kind}>
        <Suspense fallback={<div className="py-10 text-center text-sm text-slate-500" role="status">Loading…</div>}>
          <Screen />
        </Suspense>
        {shareable && <ShareLinkBar />}
      </ShareProvider>
    </ToolLayout>
  );
};

export default PackToolPage;
