"use client"

import { useState, useEffect } from "react"
import { Settings } from "@/components/admin/settings"
import { Loader2 } from "lucide-react"
import { getSettings } from "@/lib/firebase/settingsService"

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // This is just to ensure the settings are loaded from Firestore
        async function loadSettings() {
            try {
                setLoading(true)
                await getSettings()
            } catch (error) {
                console.error("Error loading settings:", error)
            } finally {
                setLoading(false)
            }
        }

        loadSettings()
    }, [])

    if (loading) {
        return (
          <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <span className="ml-2 text-lg font-medium">Loading settings...</span>
          </div>
        )
    }

    return <Settings />
}
