import React from 'react';
import { ToolGuide } from '../components/common/ToolGuide';
import { ToolLayout } from '../components/layout/ToolLayout';
import { PosInvoiceStudio } from '../components/tools/PosInvoiceStudio';
import { useTranslation } from 'react-i18next';
import en from '../locales/en.json';

export const PosInvoiceStudioPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const faqs = en.posPage.faq.map((_, index) => ({
    question: t(`posPage.faq.${index}.0`),
    answer: t(`posPage.faq.${index}.1`),
  }));

  return (
    <ToolLayout
      wide
      title={t('posPage.title')}
      subtitle={t('posPage.subtitle')}
      contentLanguage={i18n.language}
      seoContent={<ToolGuide toolName={t('posPage.title')} faqs={faqs} privacyNote={t('posPage.privacy')} contentLanguage={i18n.language} />}
    >
      <PosInvoiceStudio />
    </ToolLayout>
  );
};

export default PosInvoiceStudioPage;
