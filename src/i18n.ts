import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import zhCN from './locales/zh-CN.json';

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

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en, merge: en.merge, image: en.image, categories: en.categories },
    hi: { translation: hi, merge: hi.merge, image: hi.image, categories: hi.categories },
    es: { translation: es, merge: es.merge, image: es.image, categories: es.categories },
    fr: { translation: fr, merge: fr.merge, image: fr.image, categories: fr.categories },
    de: { translation: de, merge: de.merge, image: de.image, categories: de.categories },
    'zh-CN': { translation: zhCN, merge: zhCN.merge, image: zhCN.image, categories: zhCN.categories },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  initAsync: false,
});

document.documentElement.lang = initialLanguage;
i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
  try {
    localStorage.setItem(storageKey, language);
  } catch (error) {
    console.warn('Could not save the language preference:', error);
  }
});

export default i18n;
