import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { paymentReference, paystackEmail, toKobo, verifySignature } from '../../supabase/functions/_shared/paystack.js'

describe('Paystack helpers', () => {
  it('converts naira to kobo exactly', () => {
    expect(toKobo(3900)).toBe(390000)
    expect(() => toKobo(0)).toThrow()
    expect(() => toKobo(12.5)).toThrow()
  })

  it('makes one reference per attempt', () => {
    expect(paymentReference('LD-7KQ2MX', 1)).toBe('LD-7KQ2MX-1')
    expect(paymentReference('LD-7KQ2MX', 2)).toBe('LD-7KQ2MX-2')
  })

  it('uses a stand-in email for members who signed up by phone', () => {
    expect(paystackEmail({ id: 'u1', email: 'ada@example.com' })).toBe('ada@example.com')
    expect(paystackEmail({ id: 'u1', email: '' })).toBe('u1@members.livingdose.app')
  })
})

describe('webhook signatures', () => {
  const secret = 'sk_test_example'
  const body = JSON.stringify({ event: 'charge.success', data: { reference: 'LD-7KQ2MX-1', amount: 390000 } })
  const sign = (b, s) => createHmac('sha512', s).update(b).digest('hex')

  it('accepts a genuine Paystack signature', async () => {
    expect(await verifySignature(body, sign(body, secret), secret)).toBe(true)
  })

  it('rejects a changed body, a wrong key, or no signature', async () => {
    expect(await verifySignature(body.replace('390000', '100'), sign(body, secret), secret)).toBe(false)
    expect(await verifySignature(body, sign(body, 'sk_test_other'), secret)).toBe(false)
    expect(await verifySignature(body, '', secret)).toBe(false)
    expect(await verifySignature(body, sign(body, secret).slice(2), secret)).toBe(false)
  })
})
