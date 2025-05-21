import { NextResponse } from "next/server"
import { recordTranslationUsage } from "@/lib/server/translationService"

export async function POST(request: Request) {
  try {
    // Get the character count from the request body
    const body = await request.json()
    const { characterCount } = body

    // Validate the character count
    if (typeof characterCount !== "number" || characterCount < 0) {
      console.error("Invalid character count:", characterCount)
      return NextResponse.json({ error: "Invalid character count. Must be a positive number." }, { status: 400 })
    }

    // Record the usage using the server-side service
    const success = await recordTranslationUsage(characterCount)

    if (!success) {
      return NextResponse.json({ error: "Failed to record translation usage" }, { status: 500 })
    }

    // Get today's date in YYYY-MM-DD format for the response
    const today = new Date().toISOString().split("T")[0]

    return NextResponse.json({
      success: true,
      date: today,
      characterCount,
    })
  } catch (error) {
    console.error("Error in /api/translate/record-usage:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
