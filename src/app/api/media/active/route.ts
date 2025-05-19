import { type NextRequest, NextResponse } from "next/server"
import { verifySessionCookie } from "@/lib/auth/session"
import { isUserAdmin } from "@/lib/auth/admin-check"
import { mediaLogger } from "@/lib/utils/media-logger"
import { getActiveMedia } from "@/lib/server/mediaService"

export async function GET(request: NextRequest) {
  try {
    // Get the session from the request
    const session = await verifySessionCookie()

    // Check if user is authenticated
    if (!session.authenticated || !session.uid) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if user is admin
    const admin = await isUserAdmin(session.uid)
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Log the API access
    console.log("API: Fetched active media", { userId: session.uid })
    mediaLogger.info(`API: Fetched active media`, { userEmail: "admin" }, session.uid)

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const includeDeleted = searchParams.get("includeDeleted") === "true"
    const includeLocked = searchParams.get("includeLocked") === "true"
    const searchQuery = searchParams.get("search") || undefined
    const typeFilter = searchParams.get("type") as "image" | "video" | "all" | undefined

    // Get all media using the server-side mediaService
    const { media, totalCount, imageCount, videoCount } = await getActiveMedia({
      includeDeleted,
      includeLocked,
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
    console.error("Error in media/active API:", error)
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 })
  }
}
