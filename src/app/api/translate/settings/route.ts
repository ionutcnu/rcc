import { NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import type { NextRequest } from "next/server"
import { getTranslationSettings, updateTranslationSettings } from "@/lib/server/translationService"

// GET endpoint to fetch translation settings
export async function GET() {
  try {
    const settings = await getTranslationSettings()
    return NextResponse.json(settings)
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
