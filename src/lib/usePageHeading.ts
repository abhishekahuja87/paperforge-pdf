import { useTranslation } from 'react-i18next';
import en from '../locales/en.json';

export function usePageHeading(id: keyof typeof en.pageHeadings) {
  const { t, i18n } = useTranslation();
  return {
    title: t(`pageHeadings.${id}.0`),
    subtitle: t(`pageHeadings.${id}.1`),
    language: i18n.language,
  };
}
