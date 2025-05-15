"use client"

import { useState, useEffect, useRef } from "react"

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

// Type for the update function
type SettingsType = "seo" | "firebase" | "all"

// Simple cache to prevent duplicate API calls
const settingsCache: {
  data: AppSettings | null
  timestamp: number
  isLoading: boolean
  pendingPromise: Promise<AppSettings> | null
} = {
  data: null,
  timestamp: 0,
  isLoading: false,
  pendingPromise: null,
}

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    const fetchSettings = async () => {
      // If we're already loading settings, wait for that promise
      if (settingsCache.isLoading && settingsCache.pendingPromise) {
        try {
          const data = await settingsCache.pendingPromise
          if (isMounted.current) {
            setSettings(data)
          }
        } catch (err) {
          if (isMounted.current) {
            setError(err as Error)
          }
        }
        return
      }

      // If we have cached data that's not expired, use it
      const now = Date.now()
      if (settingsCache.data && now - settingsCache.timestamp < CACHE_EXPIRATION) {
        setSettings(settingsCache.data)
        return
      }

      // Otherwise, fetch new data
      setIsLoading(true)
      settingsCache.isLoading = true

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
          settingsCache.isLoading = false
          settingsCache.pendingPromise = null

          // Update state if component is still mounted
          if (isMounted.current) {
            setSettings(data)
            setIsLoading(false)
          }
          return data
        })
        .catch((err) => {
          settingsCache.isLoading = false
          settingsCache.pendingPromise = null

          if (isMounted.current) {
            setError(err as Error)
            setIsLoading(false)
          }
          throw err
        })

      settingsCache.pendingPromise = fetchPromise as Promise<AppSettings>

      try {
        await fetchPromise
      } catch (err) {
        // Error is handled in the promise chain
      }
    }

    fetchSettings()
  }, [])

  const updateSettings = async (type: SettingsType, data: any): Promise<any> => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, data }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update settings: ${response.status}`)
      }

      const result = await response.json()

      // Update cache with new data
      if (settingsCache.data) {
        if (type === "seo") {
          settingsCache.data.seo = { ...settingsCache.data.seo, ...data }
        } else if (type === "firebase") {
          settingsCache.data.firebase = { ...settingsCache.data.firebase, ...data }
        } else if (type === "all") {
          settingsCache.data = { ...settingsCache.data, ...data }
        }
        settingsCache.timestamp = Date.now()
      }

      // Update local state
      setSettings((prev: AppSettings | null): AppSettings => {
        if (!prev) return data as AppSettings

        if (type === "seo") {
          return { ...prev, seo: { ...prev.seo, ...data } }
        } else if (type === "firebase") {
          return { ...prev, firebase: { ...prev.firebase, ...data } }
        } else if (type === "all") {
          return { ...prev, ...data }
        }
        return prev
      })

      setIsLoading(false)
      return result
    } catch (err) {
      setError(err as Error)
      setIsLoading(false)
      throw err
    }
  }

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    updateSeoSettings: (data: any) => updateSettings("seo", data),
    updateFirebaseSettings: (data: any) => updateSettings("firebase", data),
    fetchSettingsIfNeeded: async (force = false) => {
      // If we're already loading settings, wait for that promise
      if (settingsCache.isLoading && settingsCache.pendingPromise) {
        try {
          return await settingsCache.pendingPromise
        } catch (err) {
          throw err
        }
      }

      // If we have cached data that's not expired and we're not forcing a refresh, use it
      const now = Date.now()
      if (!force && settingsCache.data && now - settingsCache.timestamp < CACHE_EXPIRATION) {
        return settingsCache.data
      }

      // Otherwise, fetch new data
      setIsLoading(true)
      settingsCache.isLoading = true

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
          settingsCache.isLoading = false
          settingsCache.pendingPromise = null

          // Update state if component is still mounted
          if (isMounted.current) {
            setSettings(data)
            setIsLoading(false)
          }
          return data
        })
        .catch((err) => {
          settingsCache.isLoading = false
          settingsCache.pendingPromise = null

          if (isMounted.current) {
            setError(err as Error)
            setIsLoading(false)
          }
          throw err
        })

      settingsCache.pendingPromise = fetchPromise as Promise<AppSettings>

      try {
        return await fetchPromise
      } catch (err) {
        throw err
      } finally {
        setIsLoading(false)
      }
    },
  }
}
