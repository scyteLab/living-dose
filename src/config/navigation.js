import { House, CalendarDays, ScanLine, ShoppingBag, HeartPulse, Users, BookOpen } from 'lucide-react'

/**
 * `tone` maps each area to its brand colour:
 * leaf = food and home, ember = nutrition, sky = care, plum = community.
 */

/** Mobile tab bar. `featured` = the raised centre button. */
export const tabNav = [
  { key: 'home', path: '/', icon: House, tone: 'leaf' },
  { key: 'plan', path: '/plan', icon: CalendarDays, tone: 'ember' },
  { key: 'scan', path: '/scan', icon: ScanLine, tone: 'ember', featured: true },
  { key: 'shop', path: '/shop', icon: ShoppingBag, tone: 'leaf' },
  { key: 'care', path: '/care', icon: HeartPulse, tone: 'sky' },
]

/**
 * Top navigation (desktop) and the slide-in menu (tablet and phone).
 * "Snap your plate" is a camera action, so it lives in the mobile tab bar only.
 */
export const siteNav = [
  { key: 'home', path: '/', icon: House, tone: 'leaf' },
  { key: 'plan', path: '/plan', icon: CalendarDays, tone: 'ember' },
  { key: 'shop', path: '/shop', icon: ShoppingBag, tone: 'leaf' },
  { key: 'care', path: '/care', icon: HeartPulse, tone: 'sky' },
  { key: 'community', path: '/community', icon: Users, tone: 'plum' },
  { key: 'learn', path: '/learn', icon: BookOpen, tone: 'leaf' },
]

/** Launch regions. The region sets currency, local foods and available experts. */
export const regions = [
  { code: 'NG', currency: 'NGN' },
  { code: 'GH', currency: 'GHS' },
  { code: 'KE', currency: 'KES' },
  { code: 'GB', currency: 'GBP' },
  { code: 'US', currency: 'USD' },
  { code: 'CA', currency: 'CAD' },
]

/** Language names stay in their own language so people can always find theirs. */
export const languages = [
  { code: 'en', label: 'English', available: true },
  { code: 'fr', label: 'Français' },
  { code: 'yo', label: 'Yorùbá' },
  { code: 'ha', label: 'Hausa' },
  { code: 'ig', label: 'Igbo' },
  { code: 'sw', label: 'Kiswahili' },
]
