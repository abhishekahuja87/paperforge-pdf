import { useTranslation } from 'react-i18next';
import { siteConfig } from '../config/site';
import { useContent } from '../locales/contentLoader';
import type { Content } from '../locales/content';

export function usePageFaqs(id: keyof Content['pageGuides']) {
  const { t, i18n } = useTranslation();
  const { pageGuides } = useContent();
  const prefix = `pageGuides.${id}`;
  return {
    language: i18n.language,
    faqs: pageGuides[id].faq.map((_, index) => ({
      question: t(`${prefix}.faq.${index}.0`, { siteName: siteConfig.name }),
      answer: t(`${prefix}.faq.${index}.1`, { siteName: siteConfig.name }),
    })),
  };
}

export type PageGuideId = keyof Content['pageGuides'];

export function usePageGuide(id: PageGuideId) {
  const { t } = useTranslation();
  const guide = usePageFaqs(id);
  return {
    ...guide,
    title: t(`pageGuides.${id}.title`),
    subtitle: t(`pageGuides.${id}.subtitle`),
  };
}
