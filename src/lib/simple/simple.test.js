import { beforeEach, describe, expect, it } from 'vitest'
import { cleanPhone, isSimple, loadFamily, saveFamily, setSimple, validPhone } from './view'
import { pickVoice, speakableText } from './speak'

beforeEach(() => {
  const map = new Map()
  globalThis.window = {
    localStorage: { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) },
    dispatchEvent: () => true,
  }
})

describe('simple view setting', () => {
  it('is off until switched on, and is kept per member', () => {
    expect(isSimple('u1')).toBe(false)
    setSimple('u1', true)
    expect(isSimple('u1')).toBe(true)
    expect(isSimple('u2')).toBe(false)
    setSimple('u1', false)
    expect(isSimple('u1')).toBe(false)
  })
})

describe('family number', () => {
  it('cleans and checks phone numbers', () => {
    expect(cleanPhone(' 0803 123-4567 ')).toBe('08031234567')
    expect(cleanPhone('+234 803 123 4567')).toBe('+2348031234567')
    expect(validPhone('0803 123 4567')).toBe(true)
    expect(validPhone('12')).toBe(false)
    expect(validPhone('call me')).toBe(false)
  })

  it('saves, loads and removes one family member', () => {
    expect(loadFamily('u1')).toBeNull()
    saveFamily('u1', { name: ' Tunde ', phone: '0803 123 4567' })
    expect(loadFamily('u1')).toEqual({ name: 'Tunde', phone: '08031234567' })
    saveFamily('u1', null)
    expect(loadFamily('u1')).toBeNull()
  })
})

describe('read aloud', () => {
  it('prefers a Nigerian English voice, then other English voices', () => {
    const voices = [{ lang: 'fr-FR' }, { lang: 'en-US' }, { lang: 'en-NG' }, { lang: 'en-GB' }]
    expect(pickVoice(voices).lang).toBe('en-NG')
    expect(pickVoice([{ lang: 'en-US' }, { lang: 'en-GB' }]).lang).toBe('en-GB')
    expect(pickVoice([{ lang: 'fr-FR' }])).toBeNull()
  })

  it('reads page text as sentences, without symbols', () => {
    expect(speakableText('Good morning, Ada\n\n→ Snap my food\n·\nTake a photo')).toBe('Good morning, Ada. Snap my food. Take a photo')
  })
})
