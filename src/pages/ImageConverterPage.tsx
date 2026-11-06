import React from 'react';
import { ToolGuide } from '../components/common/ToolGuide';
import { ImageConverter } from '../components/tools/ImageConverter';
import { ToolLayout } from '../components/layout/ToolLayout';
import { usePageFaqs } from '../lib/usePageGuide';
import { useTranslation } from 'react-i18next';

export const ImageConverterPage: React.FC = () => {
  const { t, i18n } = useTranslation('image');
  const guide = usePageFaqs('imageConverter');
  return (
    <ToolLayout title={t('converterTitle')} subtitle={t('converterSubtitle')} contentLanguage={i18n.language} seoContent={<ToolGuide toolName={t('converterTitle')} faqs={guide.faqs} contentLanguage={guide.language} />}>
      <ImageConverter />
    </ToolLayout>
  );
};

export default ImageConverterPage;
