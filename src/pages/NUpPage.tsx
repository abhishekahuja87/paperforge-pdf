import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { NUpPdf } from '../components/tools/NUpPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { usePageGuide } from '../lib/usePageGuide';

export const NUpPage: React.FC = () => {

  const guide = usePageGuide('nup');

  return (
    <ToolLayout
      title={guide.title}
      subtitle={guide.subtitle}
      contentLanguage={guide.language}
      seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}
    >
      <NUpPdf />
    </ToolLayout>
  );
};