import { useContext } from 'react'
import { HealthCheckContext } from '@/context/HealthCheckContext'

/** { answers, update(section, patch), reset(), hasDraft, savedAt } */
export default function useHealthCheck() {
  const value = useContext(HealthCheckContext)
  if (!value) throw new Error('useHealthCheck must be used inside <HealthCheckProvider>')
  return value
}
