import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolGuide } from '../components/common/ToolGuide';
import { ToolLayout } from '../components/layout/ToolLayout';
import { MasterDocumentStudio } from '../components/tools/MasterDocumentStudio';

export const DigitizeDocumentsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [hasSources, setHasSources] = useState(false);
  const steps = [1, 2, 3].map((index) => ({
    title: t(`digitize.step${index}`),
    description: t(`digitize.step${index}Detail`),
  }));
  const faqs = [1, 2, 3].map((index) => ({
    question: t(`digitize.q${index}`),
    answer: t(`digitize.a${index}`),
  }));

  return (
    <ToolLayout wide title={t('digitize.title')} subtitle={t('digitize.subtitle')} contentLanguage={i18n.language}
      seoContent={!hasSources ? <ToolGuide toolName={t('digitize.title')} steps={steps} faqs={faqs} contentLanguage={i18n.language} /> : undefined}>
      <div className="space-y-4">
        <p lang={i18n.language} className="mx-auto max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{t('digitize.note')} {t('digitize.editorLanguage')}</p>
        <MasterDocumentStudio digitize onHasSourcesChange={setHasSources} />
      </div>
    </ToolLayout>
  );
};

export default DigitizeDocumentsPage;
