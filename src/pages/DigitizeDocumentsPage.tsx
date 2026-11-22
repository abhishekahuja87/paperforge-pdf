import React from 'react';
import { useTranslation } from 'react-i18next';
import { ToolGuide } from '../components/common/ToolGuide';
import { ToolLayout } from '../components/layout/ToolLayout';
import { DigitizeTool } from '../components/tools/DigitizeTool';
import { UploadNote } from '../components/common/UploadNote';

export const DigitizeDocumentsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const steps = [1, 2, 3].map((index) => ({
    title: t(`digitize.step${index}`),
    description: t(`digitize.step${index}Detail`),
  }));
  const faqs = [1, 2, 3].map((index) => ({
    question: t(`digitize.q${index}`),
    answer: t(`digitize.a${index}`),
  }));

  return (
    <ToolLayout title={t('digitize.title')} subtitle={t('digitize.subtitle')} contentLanguage={i18n.language}
      seoContent={<ToolGuide toolName={t('digitize.title')} steps={steps} faqs={faqs} contentLanguage={i18n.language} />}>
      <div className="space-y-4">
        <div lang={i18n.language}><UploadNote>{t('digitize.note')}</UploadNote></div>
        <DigitizeTool />
      </div>
    </ToolLayout>
  );
};

export default DigitizeDocumentsPage;
