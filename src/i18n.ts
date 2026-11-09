import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { enCore } from './locales/core';
import type { English } from './locales/english';

const allLanguages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh-CN', label: '简体中文' },
] as const;

/**
 * Languages offered to visitors. The other locale files stay in the repository and are still
 * registered with i18next, but they are only partly translated (see README), so they are hidden
 * until a language is complete and reviewed. To offer a language again, add its code here.
 */
const enabledLanguageCodes: readonly string[] = ['en'];
export const languages = allLanguages.filter(({ code }) => enabledLanguageCodes.includes(code));

const storageKey = 'mdu_language';
let initialLanguage = 'en';
try {
  const savedLanguage = localStorage.getItem(storageKey);
  if (savedLanguage && languages.some(({ code }) => code === savedLanguage)) initialLanguage = savedLanguage;
} catch (error) {
  console.warn('Could not read the saved language preference:', error);
}

type LocaleFile = English;

/**
 * Other languages are loaded only when a visitor actually switches to one, so the English-only
 * site does not ship their text in the main JavaScript file.
 */
const lazyLocales: Record<string, () => Promise<{ default: unknown }>> = {
  hi: () => import('./locales/hi.json'),
  es: () => import('./locales/es.json'),
  fr: () => import('./locales/fr.json'),
  de: () => import('./locales/de.json'),
  'zh-CN': () => import('./locales/zh-CN.json'),
};

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enCore, merge: enCore.merge, image: enCore.image, categories: enCore.categories },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  initAsync: false,
});

/** Switches language, loading its text first when it is not English. */
export async function changeAppLanguage(code: string): Promise<void> {
  const load = lazyLocales[code];
  if (load && !i18n.hasResourceBundle(code, 'translation')) {
    const data = (await load()).default as LocaleFile;
    i18n.addResourceBundle(code, 'translation', data, true, true);
    i18n.addResourceBundle(code, 'merge', data.merge, true, true);
    i18n.addResourceBundle(code, 'image', data.image, true, true);
    i18n.addResourceBundle(code, 'categories', data.categories, true, true);
  }
  await i18n.changeLanguage(code);
}

document.documentElement.lang = 'en';
i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
  try {
    localStorage.setItem(storageKey, language);
  } catch (error) {
    console.warn('Could not save the language preference:', error);
  }
});

if (initialLanguage !== 'en') void changeAppLanguage(initialLanguage);

export default i18n;
