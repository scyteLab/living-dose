/**
 * Starts and checks Paystack payments for the signed-in member's orders.
 *   POST { action: 'init', orderId }   → { authorizationUrl, reference }
 *   POST { action: 'verify', orderId } → { paymentStatus }
 * The amount always comes from the order in the database, never from the browser.
 *
 * Secrets (supabase secrets set ...): PAYSTACK_SECRET_KEY, SITE_URL
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { paymentReference, paystackEmail, toKobo } from '../_shared/paystack.js'

const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const PAYSTACK = 'https://api.paystack.co'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method-not-allowed' }, 405)

  const secret = Deno.env.get('PAYSTACK_SECRET_KEY')
  if (!secret) return json({ error: 'payments-not-configured' }, 503)
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // Who is asking
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: auth } = await admin.auth.getUser(token)
  const user = auth?.user
  if (!user) return json({ error: 'not-signed-in' }, 401)

  let body: { action?: string; orderId?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad-request' }, 400)
  }

  // Their order (checked against the signed-in member)
  const { data: order } = await admin.from('orders').select('id, user_id, total, payment, payment_status').eq('id', body.orderId ?? '').maybeSingle()
  if (!order || order.user_id !== user.id) return json({ error: 'not-found' }, 404)
  if (order.payment !== 'paystack') return json({ error: 'not-payable' }, 409)

  if (body.action === 'init') {
    if (order.payment_status === 'paid') return json({ error: 'already-paid' }, 409)
    const { count } = await admin.from('payments').select('id', { count: 'exact', head: true }).eq('order_id', order.id)
    const reference = paymentReference(order.id, (count ?? 0) + 1)
    const amount = toKobo(order.total)
    const site = Deno.env.get('SITE_URL') ?? 'https://livingdose.netlify.app'

    const { error: insertError } = await admin.from('payments').insert({ order_id: order.id, user_id: user.id, reference, amount_kobo: amount })
    if (insertError) return json({ error: 'could-not-start' }, 500)

    const res = await fetch(`${PAYSTACK}/transaction/initialize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: paystackEmail(user), amount, currency: 'NGN', reference, callback_url: `${site}/orders/${order.id}?payment=return`, metadata: { order_id: order.id } }),
    })
    const result = await res.json().catch(() => null)
    if (!res.ok || !result?.status) {
      await admin.rpc('mark_payment_failed', { p_reference: reference, p_response: { stage: 'initialize', message: result?.message ?? res.statusText } })
      return json({ error: 'gateway-error' }, 502)
    }
    // A fresh attempt after a failed one: the order is waiting for payment again
    await admin.from('orders').update({ payment_status: 'pending' }).eq('id', order.id).eq('payment_status', 'failed')
    return json({ authorizationUrl: result.data.authorization_url, reference })
  }

  if (body.action === 'verify') {
    // Ask Paystack directly about the latest attempt (useful if the webhook is slow)
    if (order.payment_status === 'paid') return json({ paymentStatus: 'paid' })
    const { data: latest } = await admin.from('payments').select('reference').eq('order_id', order.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (!latest) return json({ paymentStatus: order.payment_status })
    const res = await fetch(`${PAYSTACK}/transaction/verify/${encodeURIComponent(latest.reference)}`, { headers: { Authorization: `Bearer ${secret}` } })
    const result = await res.json().catch(() => null)
    const tx = result?.data
    if (tx?.status === 'success') {
      await admin.rpc('mark_order_paid', { p_reference: tx.reference, p_amount_kobo: tx.amount, p_currency: tx.currency, p_response: { id: tx.id, channel: tx.channel, paid_at: tx.paid_at, via: 'verify' } })
    } else if (tx?.status === 'failed' || tx?.status === 'abandoned') {
      await admin.rpc('mark_payment_failed', { p_reference: latest.reference, p_response: { status: tx.status, via: 'verify' } })
    }
    const { data: fresh } = await admin.from('orders').select('payment_status').eq('id', order.id).single()
    return json({ paymentStatus: fresh?.payment_status ?? order.payment_status })
  }

  return json({ error: 'bad-request' }, 400)
})
