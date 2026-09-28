/**
 * Phone helpers for sign-in. `nsn` = national number length without the
 * leading 0 (e.g. Nigeria: 0801 234 5678 → 801 234 5678 = 10 digits).
 * Codes match the region codes in config/navigation.js.
 */
export const COUNTRIES = [
  { code: 'NG', dial: '+234', nsn: 10, example: '801 234 5678' },
  { code: 'GH', dial: '+233', nsn: 9, example: '24 123 4567' },
  { code: 'KE', dial: '+254', nsn: 9, example: '712 345 678' },
  { code: 'GB', dial: '+44', nsn: 10, example: '7400 123456' },
  { code: 'US', dial: '+1', nsn: 10, example: '201 555 0123' },
  { code: 'CA', dial: '+1', nsn: 10, example: '416 555 0123' },
]

export const findCountry = (code) => COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0]

/** Keep digits only, allowing one extra digit for a leading 0. */
export const cleanDigits = (value, country) => value.replace(/\D/g, '').slice(0, findCountry(country).nsn + 1)

const stripTrunk = (digits) => (digits.startsWith('0') ? digits.slice(1) : digits)

/** Group digits for display as the person types: "0801 234 5678" or "801 234 5678". */
export function formatNational(digits) {
  if (digits.startsWith('0') && digits.length > 4) {
    return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7)].filter(Boolean).join(' ')
  }
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)].filter(Boolean).join(' ')
}

export const isValidNational = (digits, country) => stripTrunk(digits).length === findCountry(country).nsn

/** International format for sending codes, e.g. +2348012345678 */
export const toE164 = (digits, country) => `${findCountry(country).dial}${stripTrunk(digits)}`

/** Friendly display of an international number: "+234 801 234 5678" */
export function displayPhone(e164) {
  const country = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find((c) => e164.startsWith(c.dial))
  if (!country) return e164
  return `${country.dial} ${formatNational(e164.slice(country.dial.length))}`
}
