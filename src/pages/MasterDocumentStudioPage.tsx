import React, { useState } from 'react';
import { ToolGuide } from '../components/common/ToolGuide';
import { ToolLayout } from '../components/layout/ToolLayout';
import { MasterDocumentStudio } from '../components/tools/MasterDocumentStudio';
import { useTranslation } from 'react-i18next';
import en from '../locales/en.json';

export const MasterDocumentStudioPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [hasSources, setHasSources] = useState(false);
  const steps = [
    {
      title: t('master.step1Title'),
      description: t('master.step1Description'),
    },
    {
      title: t('master.step2Title'),
      description: t('master.step2Description'),
    },
    {
      title: t('master.step3Title'),
      description: t('master.step3Description'),
    },
  ];
  const faqs = en.master.faq.map((_, index) => ({
    question: t(`master.faq.${index}.question`),
    answer: t(`master.faq.${index}.answer`),
  }));

  return (
    <ToolLayout
      wide
      title={t('featuredTools.master-document-studio.title')}
      subtitle={t('master.subtitle')}
      contentLanguage={i18n.language}
      seoContent={!hasSources ? <ToolGuide toolName={t('featuredTools.master-document-studio.title')} steps={steps} faqs={faqs} contentLanguage={i18n.language} /> : undefined}
    >
      <MasterDocumentStudio onHasSourcesChange={setHasSources} />
    </ToolLayout>
  );
};

export default MasterDocumentStudioPage;
