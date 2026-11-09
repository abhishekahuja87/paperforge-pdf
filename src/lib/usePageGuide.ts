import { useTranslation } from 'react-i18next';
import { siteConfig } from '../config/site';
import { en } from '../locales/english';

export function usePageFaqs(id: keyof typeof en.pageGuides) {
  const { t, i18n } = useTranslation();
  const prefix = `pageGuides.${id}`;
  return {
    language: i18n.language,
    faqs: en.pageGuides[id].faq.map((_, index) => ({
      question: t(`${prefix}.faq.${index}.0`, { siteName: siteConfig.name }),
      answer: t(`${prefix}.faq.${index}.1`, { siteName: siteConfig.name }),
    })),
  };
}

export type PageGuideId = keyof typeof en.pageGuides;

export function usePageGuide(id: PageGuideId) {
  const { t } = useTranslation();
  const guide = usePageFaqs(id);
  return {
    ...guide,
    title: t(`pageGuides.${id}.title`),
    subtitle: t(`pageGuides.${id}.subtitle`),
  };
}
