import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { GenerateSamplePdf } from '../components/tools/GenerateSamplePdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { usePageGuide } from '../lib/usePageGuide';

export const GenerateSamplePage: React.FC = () => {

  const guide = usePageGuide('sample');

  return (
    <ToolLayout
      title={guide.title}
      subtitle={guide.subtitle}
      contentLanguage={guide.language}
      seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}
    >
      <GenerateSamplePdf />
    </ToolLayout>
  );
};