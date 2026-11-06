import React from 'react';
import { ToolGuide } from '../components/common/ToolGuide';
import { ImageCompressor } from '../components/tools/ImageCompressor';
import { ToolLayout } from '../components/layout/ToolLayout';
import { usePageFaqs } from '../lib/usePageGuide';
import { useTranslation } from 'react-i18next';

export const ImageCompressorPage: React.FC = () => {
  const { t, i18n } = useTranslation('image');
  const guide = usePageFaqs('imageCompressor');
  return (
    <ToolLayout title={t('compressorTitle')} subtitle={t('compressorSubtitle')} contentLanguage={i18n.language} seoContent={<ToolGuide toolName={t('compressorTitle')} faqs={guide.faqs} contentLanguage={guide.language} />}>
      <ImageCompressor />
    </ToolLayout>
  );
};

export default ImageCompressorPage;
