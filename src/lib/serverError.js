/**
 * Turns an error from a Supabase server function into an Error with a `kind`
 * the pages can act on. The database raises short codes such as 'slot-taken'
 * or 'invalid-slot' (see supabase/migrations/0009_secure_shop_and_care.sql).
 */
const KNOWN = [
  'not-signed-in', 'empty-basket', 'too-many-items', 'duplicate-item', 'invalid-quantity', 'unavailable-product',
  'incomplete-address', 'outside-delivery-area', 'invalid-slot', 'note-too-long', 'shop-not-configured',
  'slot-taken', 'invalid-time', 'too-soon', 'too-far-ahead', 'outside-hours', 'day-off', 'too-many-bookings',
  'invalid-type', 'unavailable-professional', 'invalid-topic', 'not-found', 'not-booked', 'already-started',
  'not-allowed', 'order-closed', 'invalid-step',
]

export function serverError(error) {
  const message = String(error?.message ?? error ?? '')
  const code = KNOWN.find((k) => message.includes(k)) ?? 'generic'
  const err = new Error(code)
  err.kind = code === 'slot-taken' ? 'taken' : code
  err.cause = error
  return err
}

/** Unwraps a Supabase response, throwing a friendly error if it failed. */
export function unwrap({ data, error }) {
  if (error) throw serverError(error)
  return data
}
