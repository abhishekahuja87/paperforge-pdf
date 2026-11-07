import React from 'react';
import { ToolGuide } from '../components/common/ToolGuide';
import { DisplayStudio } from '../components/tools/DisplayStudio';
import { ToolLayout } from '../components/layout/ToolLayout';
import { siteConfig } from '../config/site';
import { useTranslation } from 'react-i18next';
import en from '../locales/en.json';

export const DisplayStudioPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const faqs = en.displayPage.faq.map((_, index) => ({
    question: t(`displayPage.faq.${index}.0`, { siteName: siteConfig.name }),
    answer: t(`displayPage.faq.${index}.1`, { siteName: siteConfig.name }),
  }));

  return (
    <ToolLayout
      wide
      title={t('displayPage.title')}
      subtitle={t('displayPage.subtitle')}
      contentLanguage={i18n.language}
      seoContent={<ToolGuide toolName={t('displayPage.title')} faqs={faqs} privacyNote={t('displayPage.privacy')} contentLanguage={i18n.language} />}
    >
      <DisplayStudio />
    </ToolLayout>
  );
};

export default DisplayStudioPage;
