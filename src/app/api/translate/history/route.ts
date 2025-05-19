import { NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import type { NextRequest } from "next/server"
import { getTranslationUsageHistory } from "@/lib/server/translationService"

export async function GET(request: NextRequest) {
  try {
    // Check if the user is an admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get usage history from the server-side service
    const history = await getTranslationUsageHistory(30) // Get last 30 days

    return NextResponse.json(history)
  } catch (error) {
    console.error("Error fetching translation usage history:", error)
    return NextResponse.json({ error: "Failed to fetch translation usage history" }, { status: 500 })
  }
}
