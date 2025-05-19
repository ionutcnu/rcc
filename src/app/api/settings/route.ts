import { type NextRequest, NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { getSettings, getSeoSettings, updateSeoSettings, updateFirebaseSettings } from "@/lib/server/settingsService"
import { serverLogger } from "@/lib/utils/server-logger"

/**
 * GET /api/settings
 * Retrieves application settings
 * Optional query param: type=seo|firebase
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin - pass the request parameter
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")

    // Get settings based on type
    if (type === "seo") {
      const seoSettings = await getSeoSettings()
      return NextResponse.json(seoSettings)
    } else {
      // Get all settings
      const settings = await getSettings()

      // Log the data for debugging
      serverLogger.debug("Settings data:", settings)

      // Return the settings
      return NextResponse.json(settings)
    }
  } catch (error) {
    serverLogger.error("Error getting settings:", error)
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 })
  }
}

/**
 * POST /api/settings
 * Updates application settings
 * Body: { type: "seo" | "firebase" | "all", data: any }
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin - pass the request parameter
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate type
    if (!["seo", "firebase", "all"].includes(type)) {
      return NextResponse.json({ error: "Invalid type. Must be 'seo', 'firebase', or 'all'" }, { status: 400 })
    }

    // Update settings based on type
    if (type === "seo") {
      const success = await updateSeoSettings(data)
      if (!success) {
        return NextResponse.json({ error: "Failed to update SEO settings" }, { status: 500 })
      }
    } else if (type === "firebase") {
      const success = await updateFirebaseSettings(data)
      if (!success) {
        return NextResponse.json({ error: "Failed to update Firebase settings" }, { status: 500 })
      }
    } else if (type === "all") {
      // Update all settings
      const seoSuccess = await updateSeoSettings(data.seo || {})
      const firebaseSuccess = await updateFirebaseSettings(data.firebase || {})

      if (!seoSuccess || !firebaseSuccess) {
        return NextResponse.json({ error: "Failed to update all settings" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, type })
  } catch (error) {
    serverLogger.error("Error updating settings:", error)

    // Provide more specific error message if available
    const errorMessage = error instanceof Error ? error.message : "Failed to update settings"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
