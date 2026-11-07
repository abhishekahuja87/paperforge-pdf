import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { FlattenPdf } from '../components/tools/FlattenPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { usePageGuide } from '../lib/usePageGuide';

export const FlattenPage: React.FC = () => {

  const guide = usePageGuide('flatten');

  return (
    <ToolLayout
      title={guide.title}
      subtitle={guide.subtitle}
      contentLanguage={guide.language}
      seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}
    >
      <FlattenPdf />
    </ToolLayout>
  );
};

export default FlattenPage;