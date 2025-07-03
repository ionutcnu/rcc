"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useCatPopup } from "@/components/CatPopupProvider"
import { type SeoSettings, type FirebaseSettings, defaultSettings, defaultSeoSettings } from "@/lib/types/settings"

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

        // Fetch settings from the API
        const response = await fetch("/api/settings")

        if (!response.ok) {
          throw new Error(`Failed to fetch settings: ${response.status}`)
        }

        const settings = await response.json()

        setSeoSettings(settings.seo)
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
    try {
      setSaving({ ...saving, seo: true })

      // Save SEO settings via the API
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "seo",
          data: seoSettings,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to save SEO settings: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        showPopup("SEO settings saved successfully!")
      } else {
        showPopup("Failed to save SEO settings")
      }
    } catch (error: any) {
      console.error("Error saving SEO settings:", error)
      showPopup(error.message || "An error occurred while saving settings")
    } finally {
      setSaving({ ...saving, seo: false })
    }
  }

  const handleSaveFirebase = async () => {
    try {
      setSaving({ ...saving, firebase: true })

      // Save Firebase settings via the API
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "firebase",
          data: firebaseSettings,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to save Firebase settings: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        showPopup("Firebase settings saved successfully!")
      } else {
        showPopup("Failed to save Firebase settings")
      }
    } catch (error: any) {
      console.error("Error saving Firebase settings:", error)
      showPopup(error.message || "An error occurred while saving settings")
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

  // Create a custom settings UI since SettingsUi is no longer available
  return (
    <div className="container px-4 md:px-6">
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">SEO Settings</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Meta Title
              </label>
              <input
                id="metaTitle"
                type="text"
                className="w-full p-2 border rounded-md"
                value={seoSettings.metaTitle}
                onChange={(e) => setSeoSettings({ ...seoSettings, metaTitle: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Meta Description
              </label>
              <textarea
                id="metaDescription"
                className="w-full p-2 border rounded-md"
                rows={3}
                value={seoSettings.metaDescription}
                onChange={(e) => setSeoSettings({ ...seoSettings, metaDescription: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="ogImage" className="block text-sm font-medium text-gray-700 mb-1">
                OG Image URL
              </label>
              <input
                id="ogImage"
                type="text"
                className="w-full p-2 border rounded-md"
                value={seoSettings.ogImage}
                onChange={(e) => setSeoSettings({ ...seoSettings, ogImage: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="googleAnalyticsId" className="block text-sm font-medium text-gray-700 mb-1">
                Google Analytics ID
              </label>
              <input
                id="googleAnalyticsId"
                type="text"
                className="w-full p-2 border rounded-md"
                value={seoSettings.googleAnalyticsId}
                onChange={(e) => setSeoSettings({ ...seoSettings, googleAnalyticsId: e.target.value })}
              />
            </div>
            <button
              onClick={handleSaveSeo}
              disabled={saving.seo}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving.seo ? "Saving..." : "Save SEO Settings"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Firebase Settings</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="maxImageSize" className="block text-sm font-medium text-gray-700 mb-1">
                Max Image Size (MB)
              </label>
              <input
                id="maxImageSize"
                type="number"
                className="w-full p-2 border rounded-md"
                value={firebaseSettings.maxImageSize}
                onChange={(e) =>
                  setFirebaseSettings({
                    ...firebaseSettings,
                    maxImageSize: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label htmlFor="maxVideoSize" className="block text-sm font-medium text-gray-700 mb-1">
                Max Video Size (MB)
              </label>
              <input
                id="maxVideoSize"
                type="number"
                className="w-full p-2 border rounded-md"
                value={firebaseSettings.maxVideoSize}
                onChange={(e) =>
                  setFirebaseSettings({
                    ...firebaseSettings,
                    maxVideoSize: Number(e.target.value),
                  })
                }
              />
            </div>
            <button
              onClick={handleSaveFirebase}
              disabled={saving.firebase}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving.firebase ? "Saving..." : "Save Firebase Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
