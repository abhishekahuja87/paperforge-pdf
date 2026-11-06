import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { RotatePdf } from '../components/tools/RotatePdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { useTranslation } from 'react-i18next';
import en from '../locales/en.json';
import { siteConfig } from '../config/site';

export const RotatePage: React.FC = () => {

  const { t, i18n } = useTranslation();
  const faqs = en.rotateGuide.faq.map((_, index) => ({
    question: t(`rotateGuide.faq.${index}.0`, { siteName: siteConfig.name }),
    answer: t(`rotateGuide.faq.${index}.1`, { siteName: siteConfig.name }),
  }));

  return (
    <ToolLayout
      title={t('rotateGuide.title')}
      subtitle={t('rotateGuide.subtitle')}
      contentLanguage={i18n.language}
      controlsLanguage={i18n.language}
      seoContent={<ToolGuide toolName={t('rotateGuide.title')} faqs={faqs} contentLanguage={i18n.language} />}
    >
      <RotatePdf />
    </ToolLayout>
  );
};