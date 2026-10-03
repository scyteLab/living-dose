import { createContext } from 'react'

/** { version, status }: version goes up when newer data arrives from another device. */
export const SyncContext = createContext({ version: 0, status: 'off' })
