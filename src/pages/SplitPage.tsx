import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { SplitPdf } from '../components/tools/SplitPdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { useTranslation } from 'react-i18next';
import en from '../locales/en.json';

export const SplitPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const steps = en.splitGuide.steps.map((_, index) => ({
    title: t(`splitGuide.steps.${index}.title`),
    description: t(`splitGuide.steps.${index}.description`),
  }));
  const faqs = en.splitGuide.faq.map((_, index) => ({
    question: t(`splitGuide.faq.${index}.question`),
    answer: t(`splitGuide.faq.${index}.answer`),
  }));

  return (
    <ToolLayout
      title={t('splitGuide.title')}
      subtitle={t('splitGuide.subtitle')}
      contentLanguage={i18n.language}
      seoContent={<ToolGuide toolName={t('splitGuide.title')} steps={steps} faqs={faqs} contentLanguage={i18n.language} />}
    >
      <SplitPdf />
    </ToolLayout>
  );
};