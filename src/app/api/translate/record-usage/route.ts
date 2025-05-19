import { NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import type { NextRequest } from "next/server"
import { recordTranslationUsage } from "@/lib/server/translationService"

export async function POST(request: NextRequest) {
  try {
    // Check if the user is an admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get the current usage from the request body
    const { characterCount } = await request.json()

    if (typeof characterCount !== "number" || characterCount < 0) {
      return NextResponse.json({ error: "Invalid character count" }, { status: 400 })
    }

    // Record usage using the server-side service
    const success = await recordTranslationUsage(characterCount)

    if (!success) {
      return NextResponse.json({ error: "Failed to record usage" }, { status: 500 })
    }

    // Get today's date in YYYY-MM-DD format for the response
    const today = new Date().toISOString().split("T")[0]

    return NextResponse.json({ success: true, date: today, characterCount })
  } catch (error) {
    console.error("Error recording translation usage:", error)
    return NextResponse.json({ error: "Failed to record usage" }, { status: 500 })
  }
}
