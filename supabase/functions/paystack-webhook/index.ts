/**
 * Receives Paystack's payment notifications. Deploy WITHOUT JWT checks
 * (Paystack can't sign in): supabase functions deploy paystack-webhook --no-verify-jwt
 *
 * Every notification is checked three ways before anything changes:
 *   1. its signature must match your secret key,
 *   2. Paystack is asked directly to confirm the transaction,
 *   3. mark_order_paid() only accepts the exact order total in naira.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { verifySignature } from '../_shared/paystack.js'

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 })
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY')
  if (!secret) return new Response('not configured', { status: 503 })

  const raw = await req.text()
  if (!(await verifySignature(raw, req.headers.get('x-paystack-signature') ?? '', secret))) {
    return new Response('invalid signature', { status: 401 })
  }

  let event: { event?: string; data?: { reference?: string } }
  try {
    event = JSON.parse(raw)
  } catch {
    return new Response('bad request', { status: 400 })
  }
  const reference = event.data?.reference
  if (!reference) return new Response('ok')
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  if (event.event === 'charge.success') {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${secret}` } })
    const tx = (await res.json().catch(() => null))?.data
    if (tx?.status === 'success') {
      await admin.rpc('mark_order_paid', { p_reference: tx.reference, p_amount_kobo: tx.amount, p_currency: tx.currency, p_response: { id: tx.id, channel: tx.channel, paid_at: tx.paid_at, via: 'webhook' } })
    }
  } else if (event.event === 'charge.failed') {
    await admin.rpc('mark_payment_failed', { p_reference: reference, p_response: { via: 'webhook' } })
  }
  // Always answer 200 quickly so Paystack doesn't keep retrying a handled event
  return new Response('ok')
})
