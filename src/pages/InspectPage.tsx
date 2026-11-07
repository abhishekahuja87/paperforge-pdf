import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { InspectPdf } from '../components/tools/InspectPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { usePageGuide } from '../lib/usePageGuide';

export const InspectPage: React.FC = () => {

  const guide = usePageGuide('inspect');

  return (
    <ToolLayout
      title={guide.title}
      subtitle={guide.subtitle}
      contentLanguage={guide.language}
      seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}
    >
      <InspectPdf />
    </ToolLayout>
  );
};