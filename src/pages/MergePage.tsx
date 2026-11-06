import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { MergePdf } from '../components/tools/MergePdf';
import { ToolGuide } from '../components/common/ToolGuide';
import { useTranslation } from 'react-i18next';

export const MergePage: React.FC = () => {
  const { t, i18n } = useTranslation('merge');
  const steps = [
    {
      title: t('step1Title'),
      description: t('step1Description'),
    },
    {
      title: t('step2Title'),
      description: t('step2Description'),
    },
    {
      title: t('step3Title'),
      description: t('step3Description'),
    },
  ];

  const faqs = [
    {
      question: t('faq1Question'),
      answer: t('faq1Answer'),
    },
    {
      question: t('faq2Question'),
      answer: t('faq2Answer'),
    },
    {
      question: t('faq3Question'),
      answer: t('faq3Answer'),
    },
  ];

  return (
    <ToolLayout
      title={t('title')}
      subtitle={t('subtitle')}
      contentLanguage={i18n.language}
      controlsLanguage={i18n.language}
      appearance="workshop"
      seoContent={<ToolGuide toolName={t('title')} steps={steps} faqs={faqs} appearance="workshop" contentLanguage={i18n.language} />}
    >
      <div className="mx-auto w-full max-w-3xl">
        <MergePdf />
      </div>
    </ToolLayout>
  );
};