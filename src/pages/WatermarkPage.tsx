import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { WatermarkPdf } from '../components/tools/WatermarkPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { usePageGuide } from '../lib/usePageGuide';

export const WatermarkPage: React.FC = () => {

  const guide = usePageGuide('watermark');

  return (
    <ToolLayout
      title={guide.title}
      subtitle={guide.subtitle}
      contentLanguage={guide.language}
      seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}
    >
      <WatermarkPdf />
    </ToolLayout>
  );
};