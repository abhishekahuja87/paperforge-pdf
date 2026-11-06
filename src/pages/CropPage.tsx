import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { CropPdf } from '../components/tools/CropPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { usePageGuide } from '../lib/usePageGuide';

export const CropPage: React.FC = () => {

  const guide = usePageGuide('crop');

  return (
    <ToolLayout
      title={guide.title}
      subtitle={guide.subtitle}
      contentLanguage={guide.language}
      seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}
    >
      <CropPdf />
    </ToolLayout>
  );
};