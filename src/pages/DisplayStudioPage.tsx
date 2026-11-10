import React, { useState } from 'react';
import { ToolGuide } from '../components/common/ToolGuide';
import { DisplayStudio } from '../components/tools/DisplayStudio';
import { ToolLayout } from '../components/layout/ToolLayout';
import { siteConfig } from '../config/site';
import { useTranslation } from 'react-i18next';
import en from '../locales/en.json';

export const DisplayStudioPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [hasSlides, setHasSlides] = useState(false);
  const faqs = en.displayPage.faq.map((_, index) => ({
    question: t(`displayPage.faq.${index}.0`, { siteName: siteConfig.name }),
    answer: t(`displayPage.faq.${index}.1`, { siteName: siteConfig.name }),
  }));

  return (
    <ToolLayout
      wide={hasSlides}
      title={t('displayPage.title')}
      subtitle={t('displayPage.subtitle')}
      contentLanguage={i18n.language}
      seoContent={!hasSlides
        ? <ToolGuide toolName={t('displayPage.title')} faqs={faqs} privacyNote={t('displayPage.privacy')} contentLanguage={i18n.language} />
        : <section aria-label={t('privacy')} className="mx-auto max-w-3xl rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-900">{t('privacy')}</h2>
          <p lang={i18n.language} className="mt-1 text-xs leading-relaxed text-emerald-900">{t('displayPage.privacy')}</p>
        </section>}
    >
      <DisplayStudio onHasSlidesChange={setHasSlides} />
    </ToolLayout>
  );
};

export default DisplayStudioPage;
