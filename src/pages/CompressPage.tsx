import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { CompressPdf } from '../components/tools/CompressPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { usePageGuide } from '../lib/usePageGuide';

export const CompressPage: React.FC = () => {

  const guide = usePageGuide('compress');

  return (
    <ToolLayout
      title={guide.title}
      subtitle={guide.subtitle}
      contentLanguage={guide.language}
      seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}
    >
      <CompressPdf />
    </ToolLayout>
  );
};