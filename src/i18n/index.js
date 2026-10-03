import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { storage } from '@/lib/storage'
import en from './locales/en.json'
import legalEn from './locales/legal.en.json'
import faqEn from './locales/faq.en.json'
import authEn from './locales/auth.en.json'
import healthCheckEn from './locales/healthCheck.en.json'
import planEn from './locales/plan.en.json'
import shopEn from './locales/shop.en.json'
import careEn from './locales/care.en.json'
import dashboardEn from './locales/dashboard.en.json'
import learnEn from './locales/learn.en.json'
import communityEn from './locales/community.en.json'
import scanEn from './locales/scan.en.json'
import accountEn from './locales/account.en.json'
import staffEn from './locales/staff.en.json'
import proEn from './locales/pro.en.json'
import orgEn from './locales/org.en.json'

// Every piece of UI text lives in locales/*.json so we can add
// French, Yoruba, Hausa, Igbo, Swahili and more without touching components.
i18n.use(initReactI18next).init({
  resources: {
    // "translation" holds the interface text; long content has its own files
    en: { translation: en, legal: legalEn, faq: faqEn, auth: authEn, healthCheck: healthCheckEn, plan: planEn, shop: shopEn, care: careEn, dashboard: dashboardEn, learn: learnEn, community: communityEn, scan: scanEn, account: accountEn, staff: staffEn, pro: proEn, org: orgEn },
  },
  lng: storage.get('ld.language') || import.meta.env.VITE_DEFAULT_LOCALE || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes
})

export default i18n
