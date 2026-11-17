/* global process */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGeminiRequest, buildRequest, cleanPlate, cleanWater, geminiInput, readImage, toolInput } from '../../../netlify/lib/vision.mjs'
import handler from '../../../netlify/functions/vision.mjs'
import { totals } from './diary'
import { mealAdvice } from './advice'

describe('request to Claude', () => {
  it('sends the photo and forces a structured answer', () => {
    const r = buildRequest('plate', 'AAAA', 'claude-sonnet-5-5')
    expect(r.model).toBe('claude-sonnet-5-5')
    expect(r.tool_choice).toEqual({ type: 'tool', name: 'report_plate' })
    expect(r.messages[0].content[0]).toEqual({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'AAAA' } })
    expect(r.messages[0].content[1].text).toContain('food:jollof-rice | Jollof rice')
    expect(buildRequest('water', 'AAAA', 'm').tool_choice.name).toBe('report_selfie')
  })

  it('reads the tool answer', () => {
    expect(
      toolInput({
        content: [
          { type: 'text', text: 'x' },
          { type: 'tool_use', input: { a: 1 } },
        ],
      }),
    ).toEqual({ a: 1 })
    expect(toolInput({ content: [] })).toBeNull()
  })

  it('accepts only sensible JPEG data', () => {
    expect(readImage('data:image/jpeg;base64,QUJD')).toBe('QUJD')
    expect(readImage('<script>')).toBeNull()
    expect(readImage('A'.repeat(1_600_000))).toBeNull()
    expect(readImage(42)).toBeNull()
  })
})

describe('Gemini request', () => {
  it('sends the photo and asks for the same JSON shape', () => {
    const r = buildGeminiRequest('plate', 'AAAA')
    expect(r.contents[0].parts[0]).toEqual({ inline_data: { mime_type: 'image/jpeg', data: 'AAAA' } })
    expect(r.generationConfig.responseMimeType).toBe('application/json')
    expect(r.generationConfig.responseJsonSchema.required).toEqual(['is_food', 'items'])
    expect(r.generationConfig.responseJsonSchema.properties.items.items.properties.portion.enum).toBeUndefined()
    expect(buildRequest('plate', 'A', 'm').tools[0].input_schema.properties.items.items.properties.portion.enum).toEqual([0.75, 1, 1.5])
  })

  it('reads the JSON answer, even wrapped in a code fence', () => {
    const wrap = (text) => ({ candidates: [{ content: { parts: [{ text }] } }] })
    expect(geminiInput(wrap('{"a":1}'))).toEqual({ a: 1 })
    expect(geminiInput(wrap('```json\n{"a":2}\n```'))).toEqual({ a: 2 })
    expect(geminiInput(wrap('not json'))).toBeNull()
    expect(geminiInput({})).toBeNull()
  })
})

describe('checking the plate answer', () => {
  it("maps catalogue matches to the app's own foods", () => {
    const r = cleanPlate({
      is_food: true,
      items: [
        { catalogue_id: 'food:jollof-rice', name: 'Jollof rice', portion: 1.5, confidence: 'high' },
        { catalogue_id: 'recipe:moimoi-pap', name: 'Moi moi and pap', portion: 1, confidence: 'medium' },
      ],
    })
    expect(r.items).toEqual([
      { source: 'food', id: 'jollof-rice', portion: 1.5, confidence: 'high' },
      { source: 'recipe', id: 'moimoi-pap', portion: 1, confidence: 'medium' },
    ])
  })

  it('keeps unknown foods as estimates, with numbers kept in range', () => {
    const r = cleanPlate({
      is_food: true,
      items: [
        {
          catalogue_id: '',
          name: 'Asun (spicy goat)',
          portion: 1,
          confidence: 'medium',
          estimate: { kcal: 99999, protein: 30, carbs: -5, fat: 20, fibre: 1, salt: 1.8, veg: 0.5 },
        },
      ],
    })
    const it = r.items[0]
    expect(it.source).toBe('ai')
    expect(it.food.name).toBe('Asun (spicy goat)')
    expect(it.food.kcal).toBe(2500)
    expect(it.food.carbs).toBe(0)
    expect(totals([it]).protein).toBe(30)
  })

  it('ignores made-up ids, bad portions and items without estimates', () => {
    const r = cleanPlate({
      is_food: true,
      items: [
        { catalogue_id: 'food:unicorn', name: 'Mystery', portion: 1, confidence: 'high' },
        { catalogue_id: 'food:eba', name: 'Eba', portion: 7, confidence: 'nonsense' },
      ],
    })
    expect(r.items).toEqual([{ source: 'food', id: 'eba', portion: 1, confidence: 'medium' }])
  })

  it('reports when there is no food', () => {
    expect(cleanPlate({ is_food: false, items: [] })).toEqual({ isFood: false, items: [] })
    expect(cleanPlate(null).isFood).toBe(false)
  })
})

describe('checking the water selfie', () => {
  it('needs a face, a drink and a live photo', () => {
    expect(cleanWater({ face_visible: true, drinking: true, looks_live: true, reason: '' }).verified).toBe(true)
    expect(cleanWater({ face_visible: true, drinking: false, looks_live: true, reason: 'No drink seen.' })).toMatchObject({
      verified: false,
      reason: 'No drink seen.',
    })
    expect(cleanWater({ face_visible: true, drinking: true, looks_live: false, reason: 'Photo of a screen.' }).verified).toBe(false)
    expect(cleanWater({ face_visible: 'yes', drinking: true, looks_live: true }).verified).toBe(false)
  })
})

describe('the vision function', () => {
  const realFetch = globalThis.fetch
  const call = (body, headers = {}) =>
    handler(
      new Request('https://x/.netlify/functions/vision', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify(body),
      }),
    )
  const claude = (input) => vi.fn(async () => new Response(JSON.stringify({ content: [{ type: 'tool_use', name: 'x', input }] }), { status: 200 }))

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test'
    delete process.env.GEMINI_API_KEY
    delete process.env.AI_PROVIDER
    delete process.env.VITE_SUPABASE_URL
    delete process.env.VITE_SUPABASE_ANON_KEY
  })
  afterEach(() => {
    globalThis.fetch = realFetch
  })

  it('says when no API key is set, so the app falls back to manual', async () => {
    delete process.env.ANTHROPIC_API_KEY
    expect((await call({ mode: 'plate', image: 'QUJD' })).status).toBe(503)
  })

  it('returns checked plate items', async () => {
    globalThis.fetch = claude({ is_food: true, items: [{ catalogue_id: 'food:eba', name: 'Eba', portion: 1, confidence: 'high' }] })
    const res = await call({ mode: 'plate', image: 'data:image/jpeg;base64,QUJD' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ isFood: true, items: [{ source: 'food', id: 'eba', portion: 1, confidence: 'high' }] })
    const sent = JSON.parse(globalThis.fetch.mock.calls[0][1].body)
    expect(globalThis.fetch.mock.calls[0][1].headers['x-api-key']).toBe('sk-ant-test')
    expect(sent.messages[0].content[0].source.data).toBe('QUJD')
  })

  it('rejects bad requests', async () => {
    expect((await call({ mode: 'other', image: 'QUJD' })).status).toBe(400)
    expect((await call({ mode: 'plate', image: '!!' })).status).toBe(400)
  })

  it('needs a signed-in member once Supabase is set up', async () => {
    process.env.VITE_SUPABASE_URL = 'https://p.supabase.co'
    process.env.VITE_SUPABASE_ANON_KEY = 'anon'
    globalThis.fetch = vi.fn(async (url) => (String(url).includes('/auth/v1/user') ? new Response('{}', { status: 401 }) : new Response('{}')))
    expect((await call({ mode: 'water', image: 'QUJD' })).status).toBe(401)
    expect((await call({ mode: 'water', image: 'QUJD' }, { authorization: 'Bearer bad' })).status).toBe(401)
    globalThis.fetch = vi.fn(async (url) =>
      String(url).includes('/auth/v1/user')
        ? new Response(JSON.stringify({ id: 'u1' }))
        : new Response(JSON.stringify({ content: [{ type: 'tool_use', input: { face_visible: true, drinking: true, looks_live: true, reason: '' } }] })),
    )
    const res = await call({ mode: 'water', image: 'QUJD' }, { authorization: 'Bearer good' })
    expect(await res.json()).toMatchObject({ verified: true })
  })

  it('uses Gemini when only a Gemini key is set', async () => {
    delete process.env.ANTHROPIC_API_KEY
    process.env.GEMINI_API_KEY = 'gem-test'
    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify({ is_food: true, items: [{ catalogue_id: 'food:eba', name: 'Eba', portion: 1.5, confidence: 'high' }] }) }],
                },
              },
            ],
          }),
        ),
    )
    const res = await call({ mode: 'plate', image: 'QUJD' })
    expect(await res.json()).toEqual({ isFood: true, items: [{ source: 'food', id: 'eba', portion: 1.5, confidence: 'high' }] })
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toContain('generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent')
    expect(init.headers['x-goog-api-key']).toBe('gem-test')
  })

  it('lets AI_PROVIDER pick Gemini when both keys are set', async () => {
    process.env.GEMINI_API_KEY = 'gem-test'
    process.env.AI_PROVIDER = 'gemini'
    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"face_visible":true,"drinking":true,"looks_live":true,"reason":""}' }] } }] }),
        ),
    )
    expect(await (await call({ mode: 'water', image: 'QUJD' })).json()).toMatchObject({ verified: true })
    expect(String(globalThis.fetch.mock.calls[0][0])).toContain('googleapis')
  })

  it('reports when Claude is unreachable', async () => {
    globalThis.fetch = vi.fn(async () => new Response('overloaded', { status: 529 }))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await call({ mode: 'plate', image: 'QUJD' })).status).toBe(502)
  })
})

describe('meal advice', () => {
  const advise = (items, priorities) => mealAdvice(items, totals(items), priorities)

  it('praises a balanced meal', () => {
    const items = [
      { source: 'food', id: 'okra-soup', portion: 1 },
      { source: 'food', id: 'boli', portion: 1 },
    ]
    expect(advise(items).map((t) => t.id)).toEqual(['balanced'])
  })

  it('spots a sugary drink, frying and missing vegetables', () => {
    const ids = advise([
      { source: 'food', id: 'jollof-rice', portion: 1 },
      { source: 'food', id: 'fried-fish', portion: 1 },
      { source: 'food', id: 'soft-drink', portion: 1 },
    ]).map((t) => t.id)
    expect(ids).toEqual(expect.arrayContaining(['sugaryDrink', 'fried']))
  })

  it("puts the member's health check priorities first, with a link to read more", () => {
    const tips = advise(
      [
        { source: 'food', id: 'jollof-rice', portion: 1 },
        { source: 'food', id: 'soft-drink', portion: 1 },
      ],
      ['vegetables'],
    )
    expect(tips[0]).toMatchObject({ id: 'addVeg', fromCheck: true, article: 'more-vegetables' })
  })

  it('reads AI-estimated foods too', () => {
    const tips = advise([
      { source: 'ai', id: 'fried-yam', portion: 1, food: { name: 'Fried yam', kcal: 400, protein: 4, carbs: 60, fat: 16, fibre: 4, salt: 0.5, veg: 0 } },
    ])
    expect(tips.map((t) => t.id)).toContain('fried')
  })

  it('warns about salt', () => {
    const tips = advise([
      { source: 'food', id: 'noodles', portion: 1 },
      { source: 'food', id: 'suya', portion: 1 },
    ])
    expect(tips[0].id).toBe('saltHigh')
  })
})
