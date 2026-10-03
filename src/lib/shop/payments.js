/**
 * Paying for an order online with Paystack.
 *  Connected: the 'paystack' server function starts the payment and returns
 *  Paystack's secure page; Paystack then tells the server (paystack-webhook)
 *  and the order is marked paid. The browser never decides that it's paid.
 *  Demo mode: nothing is charged; the order is marked paid on this device.
 */
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

/** Online payment is offered in demo mode, and live once VITE_PAYSTACK_ENABLED=true. */
export const onlinePaymentAvailable = !isSupabaseConfigured || import.meta.env.VITE_PAYSTACK_ENABLED === 'true'

async function call(body) {
  const { data, error } = await supabase.functions.invoke('paystack', { body })
  if (error || data?.error) {
    const err = new Error(data?.error ?? 'gateway-error')
    err.kind = data?.error ?? 'gateway-error'
    throw err
  }
  return data
}

/** Sends the member to Paystack's secure page (or, in demo mode, marks it paid). */
export async function startPayment(userId, orderId) {
  if (!isSupabaseConfigured) {
    const key = `ld.orders.${userId}`
    const orders = JSON.parse(window.localStorage.getItem(key) ?? '[]')
    window.localStorage.setItem(key, JSON.stringify(orders.map((o) => (o.id === orderId ? { ...o, paymentStatus: 'paid', paid: true } : o))))
    return { demo: true }
  }
  const { authorizationUrl } = await call({ action: 'init', orderId })
  window.location.assign(authorizationUrl)
  return { redirected: true }
}

/** After returning from Paystack: ask the server for the latest status. */
export async function confirmPayment(orderId) {
  if (!isSupabaseConfigured) return null
  const { paymentStatus } = await call({ action: 'verify', orderId })
  return paymentStatus
}
