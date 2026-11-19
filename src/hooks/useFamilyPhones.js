import { useCallback, useState } from 'react'

/** Phone numbers a helper saved for the people they look after (kept on this phone). */
export default function useFamilyPhones(helperId) {
  const key = `ld.family.phones.${helperId}`
  const [phones, setPhones] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem(key)) ?? {}
    } catch {
      return {}
    }
  })
  const save = useCallback(
    (ownerId, phone) =>
      setPhones((p) => {
        const next = { ...p, [ownerId]: phone }
        window.localStorage.setItem(key, JSON.stringify(next))
        return next
      }),
    [key],
  )
  return [phones, save]
}
