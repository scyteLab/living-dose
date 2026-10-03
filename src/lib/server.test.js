/**
 * The server connection, tested against a simulated Supabase client:
 * what the app sends to the secure functions, and how it reads the replies.
 * (The functions themselves are tested on a real database: supabase/tests.)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mock = vi.hoisted(() => ({ calls: [], replies: {} }))

vi.mock('@/lib/supabase', () => {
  const query = (table) => {
    const q = { from: table, filters: [] }
    const chain = {
      select: () => chain,
      order: () => chain,
      limit: () => chain,
      eq: (c, v) => (q.filters.push([c, v]), chain),
      update: (v) => ((q.update = v), chain),
      insert: (v) => (mock.calls.push({ ...q, insert: v }), Promise.resolve({ data: null, error: null })),
      maybeSingle: () => (mock.calls.push({ ...q, single: true }), Promise.resolve(mock.replies[`${table}:one`] ?? { data: null, error: null })),
      then: (ok, fail) => (mock.calls.push(q), Promise.resolve(mock.replies[table] ?? { data: [], error: null }).then(ok, fail)),
    }
    return chain
  }
  return {
    isSupabaseConfigured: true,
    supabase: {
      rpc: (name, args) => (mock.calls.push({ rpc: name, args }), Promise.resolve(mock.replies[`rpc:${name}`] ?? { data: null, error: null })),
      from: query,
      auth: {
        getUser: async () => ({ data: { user: { id: 'staff-uuid' } } }),
        signInWithOtp: async (args) => (mock.calls.push({ otp: args }), mock.replies.otp ?? { error: null }),
      },
    },
  }
})

// Moderation reports still live in the browser (phase 2), so give the tests a stand-in
const store = new Map()
globalThis.window = { localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), key: () => null, length: 0 } }

const { placeOrder, listOrders } = await import('@/lib/shop/orders')
const { bookAppointment, cancelAppointment, loadBookedSlots, appointmentFromRow } = await import('@/lib/care/appointments')
const { staffSetOrderStatus, staffOverview } = await import('@/lib/staff/service')

const ORDER_ROW = {
  id: 'LD-ABC234', user_id: 'u1', created_at: '2026-10-01T09:00:00Z', status: 'placed', subtotal: 2400, delivery: 1500, total: 3900,
  address: { name: 'Ada' }, slot: '2026-10-02|afternoon', payment: 'payOnDelivery', note: null, paid: false,
  history: [{ status: 'placed', at: '2026-10-01T09:00:00Z' }],
  order_items: [{ product_id: 'ugu', name: 'Ugu leaves', unit: '250 g bunch', price: 800, qty: 3 }],
}

beforeEach(() => {
  mock.calls.length = 0
  mock.replies = {}
})

describe('placing an order', () => {
  it('sends only product IDs and quantities, never prices', async () => {
    mock.replies['rpc:place_order'] = { data: { id: 'LD-ABC234', total: 3900 }, error: null }
    mock.replies['orders:one'] = { data: ORDER_ROW, error: null }
    const order = await placeOrder('u1', { basket: { ugu: 3 }, address: { name: 'Ada', state: 'Lagos' }, slot: '2026-10-02|afternoon', note: '  Gate  ' })
    const call = mock.calls.find((c) => c.rpc === 'place_order')
    expect(call.args.p_items).toEqual([{ productId: 'ugu', qty: 3 }])
    expect(JSON.stringify(call.args)).not.toMatch(/price|total|subtotal|delivery/)
    expect(call.args.p_note).toBe('Gate')
    expect(order).toMatchObject({ id: 'LD-ABC234', total: 3900, items: [{ productId: 'ugu', price: 800, qty: 3 }] })
  })

  it('turns server refusals into errors the checkout can explain', async () => {
    mock.replies['rpc:place_order'] = { data: null, error: { message: 'invalid-slot' } }
    await expect(placeOrder('u1', { basket: { ugu: 1 }, address: {}, slot: 'x' })).rejects.toMatchObject({ kind: 'invalid-slot' })
  })

  it('reads orders with their items', async () => {
    mock.replies.orders = { data: [ORDER_ROW], error: null }
    const [o] = await listOrders('u1')
    expect(o.items[0]).toEqual({ productId: 'ugu', name: 'Ugu leaves', unit: '250 g bunch', price: 800, qty: 3 })
    expect(o.history).toHaveLength(1)
  })
})

describe('booking', () => {
  it('sends the time and choices but not the fee', async () => {
    mock.replies['rpc:book_appointment'] = { data: { id: 'LC-XYZ789' }, error: null }
    await bookAppointment('u1', { professionalId: 'funmi-adeyemi', type: 'video', start: '2026-10-05T09:00:00.000Z', topic: 'plan', note: 'Hi', shareResults: true, memberName: 'Ada' })
    const call = mock.calls.find((c) => c.rpc === 'book_appointment')
    expect(call.args).toMatchObject({ p_professional_id: 'funmi-adeyemi', p_type: 'video', p_starts_at: '2026-10-05T09:00:00.000Z', p_share_results: true, p_member_name: 'Ada' })
    expect(JSON.stringify(call.args)).not.toMatch(/fee/)
  })

  it('treats a taken slot as "taken" so the panel can refresh the times', async () => {
    mock.replies['rpc:book_appointment'] = { data: null, error: { message: 'slot-taken' } }
    await expect(bookAppointment('u1', { professionalId: 'p', type: 'video', start: 'x' })).rejects.toMatchObject({ kind: 'taken' })
  })

  it('matches taken times from the server to the app\'s slots', async () => {
    mock.replies['rpc:booked_slots'] = { data: [{ professional_id: 'funmi-adeyemi', starts_at: '2026-10-05T09:00:00+00:00' }], error: null }
    const set = await loadBookedSlots(['funmi-adeyemi'])
    expect(set.has('funmi-adeyemi|2026-10-05T09:00:00.000Z')).toBe(true)
  })

  it('cancels through the server', async () => {
    mock.replies['rpc:cancel_appointment'] = { data: { status: 'cancelled' }, error: null }
    await cancelAppointment('u1', 'LC-XYZ789')
    expect(mock.calls.find((c) => c.rpc === 'cancel_appointment').args).toEqual({ p_id: 'LC-XYZ789' })
  })

  it('reads the professional\'s summary with the appointment', () => {
    const row = { id: 'LC-1', starts_at: '2026-10-05T09:00:00+00:00', share_results: true, consultation_summaries: { summary: 'Good start', next_steps: ['Walk'], follow_up: '4weeks', written_at: 'x' } }
    expect(appointmentFromRow(row).summary).toEqual({ summary: 'Good start', nextSteps: ['Walk'], followUp: '4weeks', writtenAt: 'x' })
    expect(appointmentFromRow({ ...row, consultation_summaries: [] }).summary).toBeNull()
  })
})

describe('staff console', () => {
  it('moves orders on through the secure function', async () => {
    await staffSetOrderStatus({ id: 'LD-ABC234', userId: 'u1' }, 'packed', { name: 'Bola' })
    expect(mock.calls.find((c) => c.rpc === 'set_order_status').args).toEqual({ p_order_id: 'LD-ABC234', p_status: 'packed' })
  })

  it('builds the overview from server data', async () => {
    mock.replies.orders = { data: [ORDER_ROW], error: null }
    mock.replies.appointments = { data: [], error: null }
    const o = await staffOverview(new Date('2026-10-01T12:00:00Z'))
    expect(o).toMatchObject({ ordersToday: 1, openOrders: 1, toPack: 1, cashDue: 3900 })
  })
})

describe('phase 2: community, professionals, organisations', async () => {
  const community = await import('@/lib/community/remote')
  const pro = await import('@/lib/pro/service')
  const org = await import('@/lib/org/service')

  it('reads the feed without author IDs and attaches replies', async () => {
    mock.replies.community_feed = { data: [{ id: 'p1', group_id: 'heart-health', anonymous: true, author_name: null, mine: false, body: 'Hello there everyone', created_at: 'x', helpful_count: '3', helpful_by_me: true }], error: null }
    mock.replies.community_feed_replies = { data: [{ id: 'r1', post_id: 'p1', author_name: 'Funmi', professional_id: 'funmi-adeyemi', mine: false, body: 'Well done', created_at: 'y' }], error: null }
    const [p] = await community.fetchFeed()
    expect(p).toMatchObject({ id: 'p1', group: 'heart-health', author: null, helpfulCount: 3, helpfulByMe: true })
    expect(p.replies[0]).toMatchObject({ author: 'Funmi', professionalId: 'funmi-adeyemi' })
  })

  it('posts, reacts and reports through the checked functions', async () => {
    await community.createPost({ group: 'mind-wellbeing', body: 'Feeling better today', anonymous: false })
    await community.toggleHelpful('p1')
    await community.reportItem('post', 'p1', 'spam')
    expect(mock.calls.find((c) => c.rpc === 'create_post').args).toEqual({ p_group: 'mind-wellbeing', p_body: 'Feeling better today', p_anonymous: false })
    expect(mock.calls.find((c) => c.rpc === 'toggle_helpful').args).toEqual({ p_post_id: 'p1' })
    expect(mock.calls.find((c) => c.rpc === 'report_item').args).toEqual({ p_kind: 'post', p_id: 'p1', p_reason: 'spam' })
  })

  it('explains a post the server refused', async () => {
    mock.replies['rpc:create_post'] = { data: null, error: { message: 'contact-details' } }
    await expect(community.createPost({ group: 'heart-health', body: 'x' })).rejects.toThrow()
  })

  it('saves a professional\'s summary through the checked function', async () => {
    await pro.proSaveSummary({ id: 'LC-1' }, { summary: 'We reviewed your plan together.', nextSteps: ['Walk'], followUp: '4weeks' })
    expect(mock.calls.find((c) => c.rpc === 'save_consultation_summary').args).toEqual({ p_appointment_id: 'LC-1', p_summary: 'We reviewed your plan together.', p_next_steps: ['Walk'], p_follow_up: '4weeks' })
  })

  it('joins an organisation with a code and reads server totals', async () => {
    expect(await org.joinWithCode('u1', 'LAGOSFOODS', false)).toEqual({ ok: false, reason: 'consent' })
    mock.replies['rpc:join_organisation'] = { data: null, error: { message: 'invalid-code' } }
    expect(await org.joinWithCode('u1', 'NOPE', true)).toEqual({ ok: false, reason: 'code' })
    mock.replies['rpc:organisation_summary'] = { data: { enrolled: 3, checked: 2, suppressed: true }, error: null }
    expect(await org.organisationStats('lagos-foods')).toMatchObject({ suppressed: true, needed: 8 })
  })
})

describe('sign-up errors', async () => {
  const { sendCode } = await import('@/lib/auth')

  it('explains when phone codes are not set up yet', async () => {
    mock.replies.otp = { error: { message: 'Unsupported phone provider', status: 400 } }
    await expect(sendCode({ channel: 'phone', phone: '+2348012345678', intent: 'signup' })).rejects.toMatchObject({ kind: 'phone_unavailable' })
  })

  it('explains when the account could not be created', async () => {
    mock.replies.otp = { error: { message: 'Database error saving new user', status: 500 } }
    await expect(sendCode({ channel: 'email', email: 'ada@example.com', intent: 'signup' })).rejects.toMatchObject({ kind: 'signup_failed' })
  })

  it('signs up by email with the name and consents attached', async () => {
    mock.replies.otp = { error: null }
    await sendCode({ channel: 'email', email: 'ada@example.com', intent: 'signup', metadata: { first_name: 'Ada' } })
    const call = mock.calls.find((c) => c.otp)
    expect(call.otp).toEqual({ email: 'ada@example.com', options: { shouldCreateUser: true, data: { first_name: 'Ada' } } })
  })
})
