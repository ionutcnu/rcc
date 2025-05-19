import { type NextRequest, NextResponse } from "next/server"
import { verifySessionCookie } from "@/lib/auth/session"
import { isUserAdmin } from "@/lib/auth/admin-check"
import { getLockedMedia } from "@/lib/server/mediaService"

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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const searchQuery = searchParams.get("search") || undefined
    const typeFilter = searchParams.get("type") as "image" | "video" | "all" | undefined

    // Get locked media
    const { media, totalCount, imageCount, videoCount } = await getLockedMedia({
      searchQuery,
      type: typeFilter,
    })

    return NextResponse.json({
      media,
      totalCount,
      imageCount,
      videoCount,
    })
  } catch (error) {
    console.error("Error in locked media API:", error)
    return NextResponse.json(
      { error: "Failed to fetch locked media", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
