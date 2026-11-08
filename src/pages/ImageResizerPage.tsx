import React from 'react';
import { ToolGuide } from '../components/common/ToolGuide';
import { ImageResizer } from '../components/tools/ImageResizer';
import { ToolLayout } from '../components/layout/ToolLayout';
import { usePageGuide } from '../lib/usePageGuide';
import { useTranslation } from 'react-i18next';

interface ImageResizerPageProps {
  guideId: 'imageResizer' | 'imageResizer20' | 'imageResizer50' | 'imageResizer100' | 'imageResizer200';
  defaultMaxKb: number;
}

export const ImageResizerPage: React.FC<ImageResizerPageProps> = ({ guideId, defaultMaxKb }) => {
  const { i18n } = useTranslation();
  const guide = usePageGuide(guideId);
  return (
    <ToolLayout title={guide.title} subtitle={guide.subtitle} contentLanguage={i18n.language} seoContent={<ToolGuide toolName={guide.title} faqs={guide.faqs} contentLanguage={guide.language} />}>
      <ImageResizer key={guideId} defaultMaxKb={defaultMaxKb} />
    </ToolLayout>
  );
};

export default ImageResizerPage;
