import { useCallback, useMemo, useState } from 'react'
import i18n from '@/i18n'
import { RegionContext } from '@/context/RegionContext'
import { regions } from '@/config/navigation'
import { storage } from '@/lib/storage'

const DEFAULT_REGION = import.meta.env.VITE_DEFAULT_REGION || 'NG'

export default function RegionProvider({ children }) {
  const [region, setRegionState] = useState(() => storage.get('ld.region') || DEFAULT_REGION)
  const [language, setLanguageState] = useState(() => i18n.language || 'en')

  const setRegion = useCallback((code) => {
    setRegionState(code)
    storage.set('ld.region', code)
  }, [])

  const setLanguage = useCallback((code) => {
    setLanguageState(code)
    storage.set('ld.language', code)
    i18n.changeLanguage(code)
    document.documentElement.lang = code
  }, [])

  const currency = regions.find((r) => r.code === region)?.currency ?? 'NGN'

  const value = useMemo(
    () => ({ region, setRegion, currency, language, setLanguage }),
    [region, setRegion, currency, language, setLanguage],
  )

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>
}
