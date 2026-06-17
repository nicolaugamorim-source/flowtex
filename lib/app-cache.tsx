'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface CacheData {
  calendarEvents?: { thisWeek: any[]; nextWeek: any[] }
  inboxEmails?: any[]
  allInboxEmails?: any[]
  dashboardEmails?: { messages: any[]; totalUnread: number }
  kanbanTasks?: any[]
  quickNotes?: any[]
  streakData?: any
  activityData?: any[]
  clients?: any[]
  lastFetched?: Record<string, number>
}

interface AppCacheContextType {
  cache: CacheData
  setCache: (key: keyof CacheData, data: any) => void
  isStale: (key: string, maxAgeMs?: number) => boolean
  clearCache: () => void
}

const AppCacheContext = createContext<AppCacheContextType | null>(null)

const DEFAULT_MAX_AGE = 5 * 60 * 1000 // 5 minutes

export function AppCacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCacheState] = useState<CacheData>({})

  const setCache = useCallback((key: keyof CacheData, data: any) => {
    setCacheState((prev) => ({
      ...prev,
      [key]: data,
      lastFetched: {
        ...prev.lastFetched,
        [key]: Date.now(),
      },
    }))
  }, [])

  const isStale = useCallback(
    (key: string, maxAgeMs = DEFAULT_MAX_AGE) => {
      const lastFetch = cache.lastFetched?.[key]
      if (!lastFetch) return true
      return Date.now() - lastFetch > maxAgeMs
    },
    [cache.lastFetched]
  )

  const clearCache = useCallback(() => {
    setCacheState({})
  }, [])

  return (
    <AppCacheContext.Provider value={{ cache, setCache, isStale, clearCache }}>
      {children}
    </AppCacheContext.Provider>
  )
}

export const useAppCache = () => {
  const ctx = useContext(AppCacheContext)
  if (!ctx) throw new Error('useAppCache must be used within AppCacheProvider')
  return ctx
}
