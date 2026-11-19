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
import shuttleEn from './locales/shuttle.en.json'
import simpleEn from './locales/simple.en.json'
import checkinEn from './locales/checkin.en.json'
import familyEn from './locales/family.en.json'
import pushEn from './locales/push.en.json'

// Every piece of UI text lives in locales/*.json so we can add
// French, Yoruba, Hausa, Igbo, Swahili and more without touching components.
// Nigerian Pidgin: every *.pcm.json file next to the English ones (staff, doctor and
// legal pages stay in English, so they fall back to it)
const pcm = Object.fromEntries(
  Object.entries(import.meta.glob('./locales/*.pcm.json', { eager: true, import: 'default' })).map(([path, data]) => {
    const ns = path.split('/').pop().replace('.pcm.json', '')
    return [ns, data] // translation.pcm.json holds the main interface text
  }),
)

i18n.use(initReactI18next).init({
  resources: {
    // "translation" holds the interface text; long content has its own files
    en: {
      translation: en,
      legal: legalEn,
      faq: faqEn,
      auth: authEn,
      healthCheck: healthCheckEn,
      plan: planEn,
      shop: shopEn,
      care: careEn,
      dashboard: dashboardEn,
      learn: learnEn,
      community: communityEn,
      scan: scanEn,
      account: accountEn,
      staff: staffEn,
      pro: proEn,
      org: orgEn,
      shuttle: shuttleEn,
      simple: simpleEn,
      checkin: checkinEn,
      family: familyEn,
      push: pushEn,
    },
    pcm,
  },
  lng: storage.get('ld.language') || import.meta.env.VITE_DEFAULT_LOCALE || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes
})

// Screen readers and the browser need to know the page language
if (typeof document !== 'undefined') document.documentElement.lang = i18n.language === 'pcm' ? 'pcm' : i18n.language

/**
 * Locale for dates and numbers. Pidgin speakers read English month and day
 * names, so Pidgin formats dates and numbers as Nigerian English.
 */
export const formatLocale = (lng) => (String(lng).startsWith('pcm') ? 'en-NG' : lng)

export default i18n
