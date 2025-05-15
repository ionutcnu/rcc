"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

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
}

// Create the context with a default value
const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  isLoading: false,
  error: null,
  updateSeoSettings: async () => {},
  updateFirebaseSettings: async () => {},
  refreshSettings: async () => {},
})

// Custom hook to use the settings context
export const useSettings = () => useContext(SettingsContext)

// Flag to track if we've already started fetching settings
let isInitialFetchStarted = false

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  // Function to fetch settings
  const fetchSettings = useCallback(async () => {
    if (isInitialFetchStarted) return
    isInitialFetchStarted = true

    try {
      setIsLoading(true)
      console.log("Fetching settings from API...")

      const response = await fetch("/api/settings")

      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.status}`)
      }

      const data = await response.json()
      console.log("Settings fetched successfully:", data)
      setSettings(data)
      setError(null)
    } catch (err) {
      console.error("Error fetching settings:", err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Function to refresh settings
  const refreshSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/settings")

      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.status}`)
      }

      const data = await response.json()
      console.log("Settings refreshed:", data)
      setSettings(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [])

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

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings()
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
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}
