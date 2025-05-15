"use client"

import type React from "react"

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"

// Define the structure of our settings
interface AppSettings {
  seo?: {
    metaTitle?: string
    metaDescription?: string
    ogImage?: string
    googleAnalyticsId?: string
    [key: string]: any
  }
  firebase?: {
    enableImageCompression?: boolean
    imageQuality?: string
    maxImageSize?: number
    maxVideoSize?: number
    [key: string]: any
  }
  [key: string]: any
}

interface SettingsContextType {
  settings: AppSettings | null
  isLoading: boolean
  error: Error | null
  updateSeoSettings: (data: any) => Promise<void>
  updateFirebaseSettings: (data: any) => Promise<void>
  refreshSettings: () => Promise<void>
  fetchSettingsIfNeeded: (force?: boolean) => Promise<AppSettings | null>
}

// Create the context with a default value
const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  isLoading: false,
  error: null,
  updateSeoSettings: async () => {},
  updateFirebaseSettings: async () => {},
  refreshSettings: async () => {},
  fetchSettingsIfNeeded: async () => null,
})

// Custom hook to use the settings context
export const useSettings = () => useContext(SettingsContext)

// Cache for settings data
const settingsCache = {
  data: null as AppSettings | null,
  timestamp: 0,
  pendingPromise: null as Promise<AppSettings | null> | null,
}

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const isMounted = useRef(true)

  // Clean up on unmount
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Function to fetch settings
  const fetchSettings = useCallback(async (force = false): Promise<AppSettings | null> => {
    // If we're already loading settings and not forcing a refresh, return the pending promise
    if (settingsCache.pendingPromise && !force) {
      return settingsCache.pendingPromise
    }

    // If we have cached data that's not expired and not forcing a refresh, use it
    const now = Date.now()
    if (!force && settingsCache.data && now - settingsCache.timestamp < CACHE_EXPIRATION) {
      if (isMounted.current) {
        setSettings(settingsCache.data)
      }
      return settingsCache.data
    }

    // Otherwise, fetch new data
    setIsLoading(true)

    const fetchPromise = fetch("/api/settings")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch settings: ${res.status}`)
        }
        return res.json()
      })
      .then((data: AppSettings) => {
        // Update cache
        settingsCache.data = data
        settingsCache.timestamp = Date.now()
        settingsCache.pendingPromise = null

        // Update state if component is still mounted
        if (isMounted.current) {
          setSettings(data)
          setIsLoading(false)
        }
        return data
      })
      .catch((err) => {
        settingsCache.pendingPromise = null

        if (isMounted.current) {
          setError(err as Error)
          setIsLoading(false)
        }
        throw err
      })

    settingsCache.pendingPromise = fetchPromise

    try {
      return await fetchPromise
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }, [])

  // Function to refresh settings
  const refreshSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await fetchSettings(true)
      if (isMounted.current) {
        setSettings(data)
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err as Error)
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }, [fetchSettings])

  // Function to update SEO settings
  const updateSeoSettings = useCallback(
    async (seoData: any) => {
      try {
        setIsLoading(true)

        const response = await fetch("/api/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "seo",
            data: seoData,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to update SEO settings: ${response.status}`)
        }

        // Update local state optimistically
        setSettings((prev) => {
          if (!prev) return { seo: seoData }
          return {
            ...prev,
            seo: {
              ...prev.seo,
              ...seoData,
            },
          }
        })

        // Update cache
        if (settingsCache.data) {
          settingsCache.data = {
            ...settingsCache.data,
            seo: {
              ...settingsCache.data.seo,
              ...seoData,
            },
          }
        }

        // Refresh settings to ensure we have the latest data
        await refreshSettings()
      } catch (err) {
        setError(err as Error)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [refreshSettings],
  )

  // Function to update Firebase settings
  const updateFirebaseSettings = useCallback(
    async (firebaseData: any) => {
      try {
        setIsLoading(true)

        const response = await fetch("/api/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "firebase",
            data: firebaseData,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to update Firebase settings: ${response.status}`)
        }

        // Update local state optimistically
        setSettings((prev) => {
          if (!prev) return { firebase: firebaseData }
          return {
            ...prev,
            firebase: {
              ...prev.firebase,
              ...firebaseData,
            },
          }
        })

        // Update cache
        if (settingsCache.data) {
          settingsCache.data = {
            ...settingsCache.data,
            firebase: {
              ...settingsCache.data.firebase,
              ...firebaseData,
            },
          }
        }

        // Refresh settings to ensure we have the latest data
        await refreshSettings()
      } catch (err) {
        setError(err as Error)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [refreshSettings],
  )

  // Function to fetch settings if needed
  const fetchSettingsIfNeeded = useCallback(
    async (force = false) => {
      try {
        return await fetchSettings(force)
      } catch (err) {
        console.error("Error fetching settings:", err)
        return null
      }
    },
    [fetchSettings],
  )

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings().catch((err) => {
      console.error("Error fetching settings on mount:", err)
    })
  }, [fetchSettings])

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        error,
        updateSeoSettings,
        updateFirebaseSettings,
        refreshSettings,
        fetchSettingsIfNeeded,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}
