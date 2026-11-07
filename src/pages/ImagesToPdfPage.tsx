import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { ImagesToPdf } from '../components/tools/ImagesToPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { usePageGuide } from '../lib/usePageGuide';

export const ImagesToPdfPage: React.FC = () => {

  const guide = usePageGuide('imagesToPdf');

  return (
    <ToolLayout
      title={guide.title}
      subtitle={guide.subtitle}
      contentLanguage={guide.language}
      seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}
    >
      <ImagesToPdf />
    </ToolLayout>
  );
};