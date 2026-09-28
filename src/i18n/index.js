import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { storage } from '@/lib/storage'
import en from './locales/en.json'
import legalEn from './locales/legal.en.json'
import faqEn from './locales/faq.en.json'
import authEn from './locales/auth.en.json'

// Every piece of UI text lives in locales/*.json so we can add
// French, Yoruba, Hausa, Igbo, Swahili and more without touching components.
i18n.use(initReactI18next).init({
  resources: {
    // "translation" holds the interface text; long content has its own files
    en: { translation: en, legal: legalEn, faq: faqEn, auth: authEn },
  },
  lng: storage.get('ld.language') || import.meta.env.VITE_DEFAULT_LOCALE || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes
})

export default i18n
