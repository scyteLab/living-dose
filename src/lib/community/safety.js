/**
 * Checks before something is posted. Posts that mention self-harm are not blocked:
 * the person sees a support panel first and chooses what to do next.
 * Before launch, real moderation (human review and reporting) must back this up.
 */
const CRISIS = [
  /\bkill (my ?self|me)\b/i,
  /\bsuicid/i,
  /\bend (my|it all|my life)\b/i,
  /\b(self[- ]?harm|harm(ing)? my ?self|hurt(ing)? my ?self|cut(ting)? my ?self)\b/i,
  /\bwant to die\b/i,
  /\bno reason to live\b/i,
  /\bbetter off without me\b/i,
]

export const mentionsCrisis = (text) => CRISIS.some((re) => re.test(text))

export const MIN_LENGTH = 10
export const MAX_LENGTH = 2000

// Phone numbers and email addresses are kept out of public posts for members' safety
const CONTACT = [/\b(?:\+?234|0)[789][01]\d{8}\b/, /[\w.+-]+@[\w-]+\.[\w.]+/]
// Spaces or dashes between digits are ignored, so "0801 234 5678" is caught too
export const sharesContact = (text) => {
  const joined = text.replace(/(?<=\d)[\s-]+(?=\d)/g, '')
  return CONTACT.some((re) => re.test(joined))
}

export function checkPost(text) {
  const body = text.trim()
  if (body.length < MIN_LENGTH) return { ok: false, reason: 'short' }
  if (body.length > MAX_LENGTH) return { ok: false, reason: 'long' }
  if (sharesContact(body)) return { ok: false, reason: 'contact' }
  return { ok: true, crisis: mentionsCrisis(body) }
}
