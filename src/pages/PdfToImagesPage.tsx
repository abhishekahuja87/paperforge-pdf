import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { PdfToImages } from '../components/tools/PdfToImages';
import { ToolGuide } from '../components/common/ToolGuide';
import { usePageGuide } from '../lib/usePageGuide';

export const PdfToImagesPage: React.FC = () => {

  const guide = usePageGuide('pdfToImages');

  return (
    <ToolLayout
      title={guide.title}
      subtitle={guide.subtitle}
      contentLanguage={guide.language}
      seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}
    >
      <PdfToImages />
    </ToolLayout>
  );
};

export default PdfToImagesPage;