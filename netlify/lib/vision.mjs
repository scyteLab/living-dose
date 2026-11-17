/**
 * The AI vision logic behind Snap your plate and the water challenge.
 * Pure functions (no network), so they're tested in src/lib/scan/vision.test.js.
 * The Netlify function (netlify/functions/vision.mjs) sends the request and
 * runs the answer through these checks before anything reaches the app.
 */
import { FOODS } from '../../src/data/foods.js'
import { RECIPES } from '../../src/data/recipes.js'

export const MAX_IMAGE_BYTES = 1_500_000 // base64 characters after compression; about 1.1 MB of image
export const PORTIONS = [0.75, 1, 1.5]

const CATALOGUE = [
  ...FOODS.map((f) => ({ id: `food:${f.id}`, name: f.name, portion: f.portion })),
  ...RECIPES.map((r) => ({ id: `recipe:${r.id}`, name: r.name, portion: '1 serving' })),
]
const CATALOGUE_IDS = new Set(CATALOGUE.map((c) => c.id))

const PLATE_TOOL = {
  name: 'report_plate',
  description: 'Report the foods visible in the photo.',
  input_schema: {
    type: 'object',
    properties: {
      is_food: { type: 'boolean', description: 'False if the photo does not show food or drink.' },
      items: {
        type: 'array',
        maxItems: 8,
        items: {
          type: 'object',
          properties: {
            catalogue_id: { type: 'string', description: 'An id from the catalogue when the food matches one, otherwise an empty string.' },
            name: { type: 'string', description: 'Short everyday name, e.g. "Jollof rice".' },
            portion: { type: 'number', enum: PORTIONS, description: '0.75 smaller, 1 medium, 1.5 larger than the catalogue portion (or a typical portion).' },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
            estimate: {
              type: 'object',
              description: 'Only when catalogue_id is empty: nutrition for the portion you see.',
              properties: {
                kcal: { type: 'number' },
                protein: { type: 'number' },
                carbs: { type: 'number' },
                fat: { type: 'number' },
                fibre: { type: 'number' },
                salt: { type: 'number', description: 'grams of salt' },
                veg: { type: 'number', description: 'portions of fruit and vegetables, 0 to 2' },
              },
            },
          },
          required: ['catalogue_id', 'name', 'portion', 'confidence'],
        },
      },
    },
    required: ['is_food', 'items'],
  },
}

const WATER_TOOL = {
  name: 'report_selfie',
  description: 'Report what the selfie shows.',
  input_schema: {
    type: 'object',
    properties: {
      face_visible: { type: 'boolean', description: 'A real human face is clearly visible.' },
      drinking: { type: 'boolean', description: 'The person is drinking, or holding a cup, glass or bottle of water to their mouth.' },
      looks_live: { type: 'boolean', description: 'False if it looks like a photo of a screen or of a printed photo.' },
      reason: { type: 'string', description: 'One short, friendly sentence the person will see if it is not accepted.' },
    },
    required: ['face_visible', 'drinking', 'looks_live', 'reason'],
  },
}

const PLATE_PROMPT = `You are a nutrition assistant for Living Dose, a Nigerian health app.
Identify each food and drink in the photo. Foods are often Nigerian or West African.
Match each one to this catalogue when it is the same food (use its id); otherwise leave catalogue_id empty and give a careful estimate.
Judge the portion against the catalogue portion. List at most 8 items; combine garnishes into the main dish.
Catalogue (id | name | medium portion):
${CATALOGUE.map((c) => `${c.id} | ${c.name} | ${c.portion}`).join('\n')}`

const WATER_PROMPT = `This is a live selfie for a water-drinking challenge in a health app.
Check that a real person's face is visible, that they are drinking water (or holding water to their mouth),
and that it is not a photo of a screen or printed picture. Do not try to identify who the person is.`

/** The request body for the Claude Messages API. */
export function buildRequest(mode, base64Jpeg, model) {
  const plate = mode === 'plate'
  const tool = plate ? PLATE_TOOL : WATER_TOOL
  return {
    model,
    max_tokens: plate ? 1500 : 300,
    tools: [tool],
    tool_choice: { type: 'tool', name: tool.name },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Jpeg } },
          { type: 'text', text: plate ? PLATE_PROMPT : WATER_PROMPT },
        ],
      },
    ],
  }
}

/**
 * The same request for Google's Gemini API (free tier available).
 * Gemini fills in the same JSON shape, so the checks below work for both.
 */
export function buildGeminiRequest(mode, base64Jpeg) {
  const plate = mode === 'plate'
  const schema = structuredClone((plate ? PLATE_TOOL : WATER_TOOL).input_schema)
  if (plate) {
    // Gemini's schema support is stricter about number lists, so describe the choices instead
    schema.properties.items.items.properties.portion = {
      type: 'number',
      description: 'Exactly one of 0.75 (smaller), 1 (medium) or 1.5 (larger) than the catalogue portion.',
    }
  }
  return {
    contents: [
      {
        role: 'user',
        parts: [{ inline_data: { mime_type: 'image/jpeg', data: base64Jpeg } }, { text: plate ? PLATE_PROMPT : WATER_PROMPT }],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseJsonSchema: schema,
      maxOutputTokens: plate ? 4000 : 1000,
    },
  }
}

/** The JSON Gemini returned, or null. */
export function geminiInput(response) {
  const text = (response?.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? '')
    .join('')
    .trim()
  if (!text) return null
  try {
    return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''))
  } catch {
    return null
  }
}

/** The tool input Claude filled in, or null. */
export function toolInput(response) {
  const block = response?.content?.find((b) => b.type === 'tool_use')
  return block?.input ?? null
}

const num = (v, max) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(max, Math.max(0, Math.round(n * 10) / 10)) : 0
}

/**
 * Turns Claude's answer into diary items the app understands.
 * Catalogue matches use the app's own nutrition values; anything else is kept as
 * an AI estimate, with every number limited to a sensible range.
 */
export function cleanPlate(input) {
  if (!input || !input.is_food) return { isFood: false, items: [] }
  const items = (Array.isArray(input.items) ? input.items : []).slice(0, 8).flatMap((it) => {
    const portion = PORTIONS.includes(Number(it.portion)) ? Number(it.portion) : 1
    const confidence = ['high', 'medium', 'low'].includes(it.confidence) ? it.confidence : 'medium'
    const name = String(it.name ?? '')
      .trim()
      .slice(0, 60)
    if (CATALOGUE_IDS.has(it.catalogue_id)) {
      const [source, id] = it.catalogue_id.split(':')
      return [{ source, id, portion, confidence }]
    }
    const e = it.estimate
    if (!name || !e) return []
    return [
      {
        source: 'ai',
        id:
          name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || 'food',
        portion: 1, // the estimate already covers the portion seen
        confidence,
        food: {
          name,
          portion: 'as in your photo',
          kcal: num(e.kcal, 2500),
          protein: num(e.protein, 200),
          carbs: num(e.carbs, 400),
          fat: num(e.fat, 200),
          fibre: num(e.fibre, 80),
          salt: num(e.salt, 15),
          veg: num(e.veg, 2),
        },
      },
    ]
  })
  return { isFood: items.length > 0, items }
}

/** Water selfie verdict: all three checks must pass. */
export function cleanWater(input) {
  if (!input) return { verified: false, reason: '' }
  const verified = input.face_visible === true && input.drinking === true && input.looks_live === true
  return {
    verified,
    faceVisible: input.face_visible === true,
    drinking: input.drinking === true,
    reason: verified ? '' : String(input.reason ?? '').slice(0, 200),
  }
}

/** Accepts a data URL or bare base64 JPEG; returns the base64 or null if unusable. */
export function readImage(image) {
  if (typeof image !== 'string') return null
  const data = image.replace(/^data:image\/jpeg;base64,/, '')
  if (!data || data.length > MAX_IMAGE_BYTES || !/^[A-Za-z0-9+/=]+$/.test(data)) return null
  return data
}
