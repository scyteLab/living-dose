/**
 * What the staff console calls. With Supabase configured, orders, consultations
 * and the activity log come from the server (staff-only rules in 0006 and 0009);
 * in demo mode they come from this browser (lib/staff/api.js).
 * Moderation reads reports from the server too (phase 2).
 */
import { appointmentFromRow } from '@/lib/care/appointments'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { unwrap } from '@/lib/serverError'
import { orderFromRow } from '@/lib/shop/orders'
import { listActivity, listAllAppointments, listAllOrders, listReports, resolveReport, setAppointmentStatus, setOrderStatus } from './api'

const remote = isSupabaseConfigured
const local = () => window.localStorage

export async function staffOrders() {
  if (!remote) return listAllOrders(local())
  return unwrap(await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(300)).map(orderFromRow)
}

export async function staffSetOrderStatus(order, status, staff) {
  if (!remote) return setOrderStatus(local(), staff, order.userId, order.id, status, status === 'delivered' ? { paid: true } : undefined)
  unwrap(await supabase.rpc('set_order_status', { p_order_id: order.id, p_status: status }))
}

export async function staffAppointments() {
  if (!remote) return listAllAppointments(local())
  return unwrap(await supabase.from('appointments').select('*').order('starts_at', { ascending: true }).limit(500)).map(appointmentFromRow)
}

export async function staffSetAppointmentStatus(appt, status, staff) {
  if (!remote) return setAppointmentStatus(local(), staff, appt.userId, appt.id, status)
  unwrap(await supabase.from('appointments').update({ status }).eq('id', appt.id))
  await supabase.from('staff_activity').insert({ staff_id: (await supabase.auth.getUser()).data.user.id, action: 'appointment.status', detail: `${appt.id} → ${status}` })
}

export async function staffActivity() {
  if (!remote) return listActivity(local())
  const rows = unwrap(await supabase.from('staff_activity').select('*').order('created_at', { ascending: false }).limit(300))
  return rows.map((r) => ({ at: r.created_at, staff: `Staff ${String(r.staff_id).slice(0, 8)}`, action: r.action, detail: r.detail }))
}

export async function staffReports() {
  if (!remote) return listReports(local())
  const rows = unwrap(
    await supabase.from('community_reports').select('*, community_posts(body, group_id), community_replies(body, post_id)').order('created_at', { ascending: false }).limit(300),
  )
  return rows.map((r) => ({
    id: r.id,
    itemId: r.post_id ?? r.reply_id,
    kind: r.post_id ? 'post' : 'reply',
    reason: r.reason,
    body: r.community_posts?.body ?? r.community_replies?.body ?? '',
    group: r.community_posts?.group_id ?? null,
    postId: r.post_id ?? r.community_replies?.post_id ?? null,
    status: r.status,
    createdAt: r.created_at,
  }))
}

export async function staffResolveReport(report, decision, staff) {
  if (!remote) return resolveReport(local(), staff, report.id, decision)
  unwrap(await supabase.rpc('resolve_report', { p_report_id: report.id, p_decision: decision }))
}

/** The overview, worked out from the same lists the other pages use. */
export async function staffOverview(now = new Date()) {
  const [orders, appts, reports] = await Promise.all([staffOrders(), staffAppointments(), staffReports()])
  const today = now.toISOString().slice(0, 10)
  const open = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
  const upcoming = appts.filter((a) => a.status === 'booked' && new Date(a.start) >= now)
  return {
    ordersToday: orders.filter((o) => o.createdAt.slice(0, 10) === today).length,
    openOrders: open.length,
    toPack: open.filter((o) => o.status === 'placed').length,
    cashDue: open.reduce((sum, o) => sum + o.total, 0),
    upcomingAppointments: upcoming.length,
    next24h: upcoming.filter((a) => new Date(a.start) - now < 864e5).length,
    openReports: new Set(reports.filter((r) => r.status === 'open').map((r) => r.itemId)).size,
  }
}
