"use client"

import { useState, useEffect } from "react"
import { SettingsUi } from "@/components/admin/settings-ui"
import { Loader2 } from "lucide-react"
import { useCatPopup } from "@/components/CatPopupProvider"
import {
  getSettings,
  updateFirebaseSettings,
  type SeoSettings,
  type FirebaseSettings,
  defaultSettings,
} from "@/lib/firebase/settingsService"
import { validateSeoSettings, validateFirebaseSettings } from "@/lib/utils/settings-validator"
import { getSeoSettings, updateSeoSettings as updateSeo, defaultSeoSettings } from "@/lib/firebase/seoService"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

export function Settings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({
    seo: false,
    firebase: false,
  })

  const [seoSettings, setSeoSettings] = useState<SeoSettings>(defaultSeoSettings)
  const [firebaseSettings, setFirebaseSettings] = useState<FirebaseSettings>(defaultSettings.firebase)

  const { showPopup } = useCatPopup()

  // Fetch settings on component mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true)
        const settings = await getSettings()
        const seo = await getSeoSettings()

        setSeoSettings(seo)
        setFirebaseSettings(settings.firebase)
      } catch (error) {
        console.error("Error fetching settings:", error)
        showPopup("Failed to load settings")
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [showPopup])

  const handleSaveSeo = async () => {
    // Validate settings
    const validation = validateSeoSettings(seoSettings)
    if (!validation.valid) {
      // Convert the first error to string to ensure type safety
      const firstError = String(Object.values(validation.errors)[0])
      showPopup(firstError)
      return
    }

    try {
      setSaving({ ...saving, seo: true })
      const success = await updateSeo(seoSettings)

      if (success) {
        showPopup("SEO settings saved successfully!")
      } else {
        showPopup("Failed to save SEO settings")
      }
    } catch (error) {
      console.error("Error saving SEO settings:", error)
      showPopup("An error occurred while saving settings")
    } finally {
      setSaving({ ...saving, seo: false })
    }
  }

  const handleSaveFirebase = async () => {
    // Validate settings
    const validation = validateFirebaseSettings(firebaseSettings)
    if (!validation.valid) {
      // Convert the first error to string to ensure type safety
      const firstError = String(Object.values(validation.errors)[0])
      showPopup(firstError)
      return
    }

    try {
      setSaving({ ...saving, firebase: true })
      const success = await updateFirebaseSettings(firebaseSettings)

      if (success) {
        showPopup("Firebase settings saved successfully!")
      } else {
        showPopup("Failed to save Firebase settings")
      }
    } catch (error) {
      console.error("Error saving Firebase settings:", error)
      showPopup("An error occurred while saving settings")
    } finally {
      setSaving({ ...saving, firebase: false })
    }
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <span className="ml-2 text-lg">Loading settings...</span>
        </div>
    )
  }

  return (
      <div className="container px-4 md:px-6">


        <SettingsUi
            seoSettings={seoSettings}
            firebaseSettings={firebaseSettings}
            onSeoSettingsChange={setSeoSettings}
            onFirebaseSettingsChange={setFirebaseSettings}
            onSaveSeo={handleSaveSeo}
            onSaveFirebase={handleSaveFirebase}
            savingSeo={saving.seo}
            savingFirebase={saving.firebase}
        />
      </div>
  )
}
