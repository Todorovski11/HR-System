import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import mk from './locales/mk.json';

const savedLanguage = localStorage.getItem('hr-language') ?? 'mk';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    mk: { translation: mk },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (language) => {
  localStorage.setItem('hr-language', language);
});

export default i18n;
