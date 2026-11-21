import React, { useContext, useLayoutEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useContent } from '../../locales/contentLoader';
import { AccordionList } from './AccordionList';
import { FoldToggle } from './FoldToggle';
import { GuideRegistryContext } from './guideRegistry';
import { useArticleSections } from './ToolArticle';

export interface GuideStep {
  title: string;
  description: string;
}

export interface GuideFaq {
  question: string;
  answer: string;
}

interface ToolGuideProps {
  toolName: string;
  steps?: GuideStep[];
  faqs: GuideFaq[];
  appearance?: 'standard' | 'workshop';
  contentLanguage?: string;
}

export const ToolGuide: React.FC<ToolGuideProps> = ({
  toolName,
  steps = [],
  faqs,
  appearance = 'workshop',
  contentLanguage = 'en',
}) => {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const { guideSteps } = useContent();
  const guideId = pathname.replace(/^\/|\/$/g, '');
  const hasLocalizedSteps = Object.prototype.hasOwnProperty.call(guideSteps, guideId);
  const displayedSteps = hasLocalizedSteps
    ? guideSteps[guideId as keyof typeof guideSteps].map((_, index) => ({
      title: t(`guideSteps.${guideId}.${index}.0`),
      description: t(`guideSteps.${guideId}.${index}.1`),
    }))
    : steps;
  const stepsLanguage = hasLocalizedSteps ? i18n.language : contentLanguage;
  const isWorkshop = appearance === 'workshop';
  const articleSections = useArticleSections(guideId);
  const { setGuideShowsArticle } = useContext(GuideRegistryContext);
  const showsArticle = isWorkshop && articleSections.length > 0;
  // Tell the layout this guide lists the written sections, so they are not shown a second time.
  useLayoutEffect(() => {
    setGuideShowsArticle(showsArticle);
    return () => setGuideShowsArticle(false);
  }, [showsArticle, setGuideShowsArticle]);
  if (isWorkshop) {
    const items = [
      ...articleSections.map((section) => ({
        key: `article-${section.heading}`,
        title: section.heading,
        level: 2 as const,
        children: <>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</>,
      })),
      ...faqs.map((faq) => ({
        key: `faq-${faq.question}`,
        title: faq.question,
        level: 3 as const,
        children: <p>{faq.answer}</p>,
      })),
    ];
    // One column: steps (three across when wide), then the accordion, then the privacy note.
    return (
      <div className="@container mx-auto w-full max-w-3xl">
        <div className="space-y-5">
          {displayedSteps.length > 0 && (
            <section aria-label={t('howToUse')} className="space-y-2">
              <h2 className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">{t('howToUse')}</h2>
              <ol lang={stepsLanguage} className="grid gap-3 @xl:grid-cols-3">
                {displayedSteps.map((step, index) => (
                  <li key={step.title} className="flex items-start gap-3 rounded-lg border-l-4 border-orange-500 bg-white px-3 py-3 shadow-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-800">{index + 1}</span>
                    <div>
                      <p className="text-sm font-extrabold text-stone-900">{step.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-stone-600">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
          {items.length > 0 && (
            <section aria-label={t('guideAndQuestions', { defaultValue: 'About this tool and questions' })} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h2 className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">{t('guideAndQuestions', { defaultValue: 'About this tool and questions' })}</h2>
                <FoldToggle />
              </div>
              <AccordionList items={items} lang={contentLanguage} />
            </section>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className={`space-y-6 ${isWorkshop ? '' : 'border-t border-slate-200 pt-6'}`}>
      {/* 3-Step Instructional Guide */}
      <section className="space-y-3">
        <h2 className={`text-sm font-bold uppercase tracking-wider ${isWorkshop ? 'text-stone-700' : 'text-slate-700'}`}>
          {t('howToUse')} {toolName}
        </h2>
        <div lang={stepsLanguage} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {displayedSteps.map((step, idx) => (
            <div
              key={idx}
              className={`space-y-1 rounded-xl border p-3.5 ${isWorkshop ? 'border-stone-200 bg-[var(--theme-surface)]' : 'border-slate-200/80 bg-slate-50'}`}
            >
              <div className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${isWorkshop ? 'bg-orange-100 text-orange-800' : 'bg-indigo-100 text-indigo-700'}`}>
                {idx + 1}
              </div>
              <h3 className={`pt-1 text-sm font-semibold ${isWorkshop ? 'text-stone-900' : 'text-slate-900'}`}>{step.title}</h3>
              <p className={`text-xs leading-relaxed ${isWorkshop ? 'text-stone-600' : 'text-slate-600'}`}>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="space-y-3">
        <div className="flex items-center space-x-1.5">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <h2 className={`text-sm font-bold ${isWorkshop ? 'text-stone-800' : 'text-slate-800'}`}>Frequently Asked Questions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className={`space-y-1 rounded-xl border p-3.5 shadow-2xs ${isWorkshop ? 'border-stone-200 bg-[var(--theme-surface)]' : 'border-slate-200 bg-white'}`}
            >
              <h3 className={`text-sm font-semibold ${isWorkshop ? 'text-stone-800' : 'text-slate-800'}`}>{faq.question}</h3>
              <p className={`text-xs leading-relaxed ${isWorkshop ? 'text-stone-600' : 'text-slate-600'}`}>{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};