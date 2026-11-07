import React, { useState } from 'react';
import { ToolGuide } from '../components/common/ToolGuide';
import { ToolLayout } from '../components/layout/ToolLayout';
import { PosInvoiceStudio, type PosStudioStep } from '../components/tools/PosInvoiceStudio';
import { useTranslation } from 'react-i18next';
import en from '../locales/en.json';

export const PosInvoiceStudioPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<PosStudioStep>('setup');
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
      seoContent={step === 'setup' ? <ToolGuide toolName={t('posPage.title')} faqs={faqs} contentLanguage={i18n.language} /> : undefined}
    >
      <PosInvoiceStudio step={step} setStep={setStep} />
    </ToolLayout>
  );
};

export default PosInvoiceStudioPage;
