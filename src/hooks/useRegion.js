import { useContext } from 'react'
import { RegionContext } from '@/context/RegionContext'

/** { region, setRegion, currency, language, setLanguage } */
export default function useRegion() {
  const value = useContext(RegionContext)
  if (!value) throw new Error('useRegion must be used inside <RegionProvider>')
  return value
}
