"use client"

import { useState, useEffect } from "react"
import { useSettings } from "@/lib/contexts/settings-context"
import { Loader2 } from "lucide-react"
import SettingsUi from "@/components/admin/settings-ui"
import { useCatPopup } from "@/hooks/use-cat-popup"

export default function SettingsPage() {
    const { settings, isLoading, error, updateSeoSettings, updateFirebaseSettings, fetchSettingsIfNeeded } = useSettings()
    const { showPopup } = useCatPopup()
    const [localSeoSettings, setLocalSeoSettings] = useState<any>({})
    const [localFirebaseSettings, setLocalFirebaseSettings] = useState<any>({})
    const [saving, setSaving] = useState({
        seo: false,
        firebase: false,
    })

    // Update local state when settings are loaded
    useEffect(() => {
        if (settings) {
            console.log("Settings loaded:", settings)
            setLocalSeoSettings(settings.seo || {})
            setLocalFirebaseSettings(settings.firebase || {})
        }
    }, [settings])

    // Add this useEffect to fetch settings when the page mounts
    /*
    useEffect(() => {
      const loadSettings = async () => {
        try {
          await fetchSettingsIfNeeded()
        } catch (error) {
          console.error("Error loading settings:", error)
        }
      }

      loadSettings()
    }, [fetchSettingsIfNeeded])
    */

    const handleSaveSeo = async (seoData: any) => {
        try {
            setSaving({ ...saving, seo: true })
            await updateSeoSettings(seoData)
            showPopup("SEO settings saved successfully!")
        } catch (error) {
            console.error("Error saving SEO settings:", error)
            showPopup(`Failed to save SEO settings: ${(error as Error).message}`)
        } finally {
            setSaving({ ...saving, seo: false })
        }
    }

    const handleSaveFirebase = async (firebaseData: any) => {
        try {
            setSaving({ ...saving, firebase: true })
            await updateFirebaseSettings(firebaseData)
            showPopup("Firebase settings saved successfully!")
        } catch (error) {
            console.error("Error saving Firebase settings:", error)
            showPopup(`Failed to save Firebase settings: ${(error as Error).message}`)
        } finally {
            setSaving({ ...saving, firebase: false })
        }
    }

    if (isLoading && !settings) {
        return (
          <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <span className="ml-2 text-lg font-medium">Loading settings...</span>
          </div>
        )
    }

    if (error) {
        return (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p>Error loading settings: {error.message}</p>
              <p>Please try refreshing the page.</p>
          </div>
        )
    }

    return (
      <div className="container px-4 md:px-6">
          <SettingsUi
            seoSettings={localSeoSettings}
            firebaseSettings={localFirebaseSettings}
            onSeoSettingsChange={setLocalSeoSettings}
            onFirebaseSettingsChange={setLocalFirebaseSettings}
            onSaveSeo={handleSaveSeo}
            onSaveFirebase={handleSaveFirebase}
            savingSeo={saving.seo}
            savingFirebase={saving.firebase}
          />
      </div>
    )
}
