import { shop } from '@/config/shop'

const formatters = {}

/** ₦12,500 (no kobo, since shop prices are whole naira). */
export function formatPrice(amount, locale = 'en-NG') {
  formatters[locale] ??= new Intl.NumberFormat(locale, { style: 'currency', currency: shop.currency, maximumFractionDigits: 0 })
  return formatters[locale].format(amount)
}
