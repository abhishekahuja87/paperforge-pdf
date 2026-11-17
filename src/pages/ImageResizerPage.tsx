import React from 'react';
import { ToolGuide } from '../components/common/ToolGuide';
import { ImageResizer } from '../components/tools/ImageResizer';
import { ToolLayout } from '../components/layout/ToolLayout';
import { usePageGuide } from '../lib/usePageGuide';
import { useTranslation } from 'react-i18next';

export const ImageResizerPage: React.FC = () => {
  const { i18n } = useTranslation();
  const guide = usePageGuide('imageResizer');
  return (
    <ToolLayout title={guide.title} subtitle={guide.subtitle} contentLanguage={i18n.language} seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}>
      <ImageResizer />
    </ToolLayout>
  );
};

export default ImageResizerPage;
