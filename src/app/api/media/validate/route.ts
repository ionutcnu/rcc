import { type NextRequest, NextResponse } from "next/server"
import { verifySessionCookie } from "@/lib/auth/session"
import { isUserAdmin } from "@/lib/auth/admin-check"
import { validateMediaUrls } from "@/lib/server/mediaService"

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await verifySessionCookie()
    if (!session.authenticated || !session.uid) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if user is admin
    const admin = await isUserAdmin(session.uid)
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Validate media URLs
    const result = await validateMediaUrls()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in validate media API:", error)
    return NextResponse.json(
      { error: "Failed to validate media URLs", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
