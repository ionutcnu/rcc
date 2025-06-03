"use client"

import { useState, useEffect } from "react"

interface TranslationSettings {
  enabled: boolean
}

export function useTranslationSettings() {
  const [isEnabled, setIsEnabled] = useState(true) // Default to true to avoid flash
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkTranslationSettings = async () => {
      try {
        const response = await fetch('/api/translate/settings', {
          method: 'GET',
          credentials: 'include',
        })
        
        if (response.ok) {
          const settings: TranslationSettings = await response.json()
          setIsEnabled(settings.enabled)
        } else {
          // If API fails, default to disabled to be safe
          setIsEnabled(false)
        }
      } catch (error) {
        console.error('Error fetching translation settings:', error)
        // If there's an error, default to disabled
        setIsEnabled(false)
      } finally {
        setLoading(false)
      }
    }

    checkTranslationSettings()
  }, [])

  return { isEnabled, loading }
}