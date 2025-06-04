import { type NextRequest, NextResponse } from "next/server"
import { verifySessionCookie } from "@/lib/auth/session"
import { isUserAdmin } from "@/lib/auth/admin-check"
import { getMediaStats } from "@/lib/server/mediaService"

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

    // Get media stats
    const stats = await getMediaStats()

    const response = NextResponse.json(stats)
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
    return response
  } catch (error) {
    console.error("Error in media stats API:", error)
    return NextResponse.json(
      { error: "Failed to fetch media stats", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
