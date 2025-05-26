import { NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import type { NextRequest } from "next/server"
import { getTranslationSettings, updateTranslationSettings } from "@/lib/server/translationService"

// Extended TranslationSettings to include rate limiter settings
export interface ExtendedTranslationSettings {
  enabled: boolean
  customLimit: number
  warningThreshold: number
  criticalThreshold: number
  defaultLanguage: string
  availableLanguages: string[]
  cacheEnabled: boolean
  cacheTTL: number
  useGroupedCache?: boolean
  storeUsageInRedis?: boolean
  // New rate limiter settings
  rateLimiterEnabled: boolean
  maxRequestsPerMinute: number
  rateLimitWindow: number // in milliseconds
}

// GET endpoint to fetch translation settings
export async function GET() {
  try {
    const settings = await getTranslationSettings()

    // Add default rate limiter settings if they don't exist
    const extendedSettings: ExtendedTranslationSettings = {
      ...settings,
      rateLimiterEnabled: settings.rateLimiterEnabled ?? false, // Default to disabled
      maxRequestsPerMinute: settings.maxRequestsPerMinute ?? 10, // Default to 10 requests
      rateLimitWindow: settings.rateLimitWindow ?? 60000, // Default to 1 minute (60000ms)
    }

    return NextResponse.json(extendedSettings)
  } catch (error) {
    console.error("Error fetching translation settings:", error)
    return NextResponse.json({ error: "Failed to fetch translation settings" }, { status: 500 })
  }
}

// POST endpoint to update translation settings
export async function POST(request: NextRequest) {
  try {
    // Check if the user is an admin using the server-side session cookie
    const isAdmin = await adminCheck(request)

    if (!isAdmin) {
      console.log("User is not an admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get the settings from the request body
    const settings = await request.json()
    console.log("Received settings update:", settings)

    // Update settings using the server-side service
    await updateTranslationSettings(settings)
    console.log("Settings updated successfully")

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating translation settings:", error)
    return NextResponse.json(
      {
        error: "Failed to update translation settings",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
