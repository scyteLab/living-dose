/**
 * Read aloud with the phone's own voice (free, works offline on most phones).
 * Picks an English voice, preferring Nigerian or other African English when the phone has one.
 */
export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

export function pickVoice(voices, lang = 'en') {
  const list = (voices ?? []).filter((v) => v.lang?.toLowerCase().startsWith(lang.toLowerCase()))
  const prefer = ['en-ng', 'en-gh', 'en-ke', 'en-za', 'en-gb', 'en-us']
  for (const p of prefer) {
    const v = list.find((x) => x.lang.toLowerCase().replace('_', '-') === p)
    if (v) return v
  }
  return list[0] ?? null
}

/** Tidies page text for speaking: one line per item, no symbols read out. */
export function speakableText(text) {
  return String(text ?? '')
    .split('\n')
    .map((l) =>
      l
        .replace(/[→←•·|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((l) => l.length > 1)
    .join('. ')
    .replace(/\.\s*\./g, '.')
    .slice(0, 3000)
}

export function speak(text, { lang = 'en', onEnd } = {}) {
  // Pidgin and Nigerian English use the same English voices
  if (String(lang).startsWith('pcm')) lang = 'en'
  if (!canSpeak()) return false
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new window.SpeechSynthesisUtterance(speakableText(text))
  const voice = pickVoice(synth.getVoices(), lang)
  if (voice) u.voice = voice
  u.lang = voice?.lang ?? 'en-NG'
  u.rate = 0.9 // a little slower than normal, easier to follow
  u.onend = () => onEnd?.()
  u.onerror = () => onEnd?.()
  synth.speak(u)
  return true
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel()
}
