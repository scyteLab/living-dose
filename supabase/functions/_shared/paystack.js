/**
 * Paystack helpers shared by the payment functions. Plain JavaScript with no
 * imports, so the same code runs in Supabase Edge Functions (Deno) and in the
 * app's tests (src/lib/payments.test.js).
 */

/** Paystack charges in kobo: ₦1 = 100 kobo. Order totals are whole naira. */
export function toKobo(naira) {
  if (!Number.isInteger(naira) || naira <= 0) throw new Error('invalid-amount')
  return naira * 100
}

/** One reference per attempt, e.g. LD-7KQ2MX-1, LD-7KQ2MX-2 if the first try failed. */
export const paymentReference = (orderId, attempt) => `${orderId}-${attempt}`

/** Paystack needs an email. Members who signed up by phone get a private stand-in address. */
export function paystackEmail(user, fallbackDomain = 'members.livingdose.app') {
  return user?.email || `${user.id}@${fallbackDomain}`
}

const hex = (buffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')

/**
 * Checks that a webhook really came from Paystack: the x-paystack-signature
 * header must be the HMAC-SHA512 of the exact request body, keyed with your
 * secret key. Compared in constant time.
 */
export async function verifySignature(rawBody, signature, secret) {
  if (!signature || !secret) return false
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'])
  const expected = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody)))
  if (expected.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  return diff === 0
}
