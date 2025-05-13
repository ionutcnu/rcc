import { type NextRequest, NextResponse } from "next/server"
import { getAllMedia } from "@/lib/firebase/storageService"
import { verifySessionCookie } from "@/lib/auth/session"
import { isUserAdmin } from "@/lib/auth/admin-check"
// Import commented out to disable logging
// import { mediaLogger } from "@/lib/utils/media-logger"

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

    // Logging disabled to test if this is causing the permission error
    // mediaLogger.info(`API: Fetched active media`, { userEmail: "admin" }, session.uid)
    console.log("API: Fetched active media", { userId: session.uid })

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const includeDeleted = searchParams.get("includeDeleted") === "true"
    const includeLocked = searchParams.get("includeLocked") === "true"

    // Get all media
    const mediaItems = await getAllMedia(includeDeleted)

    // Filter out deleted and locked items unless specifically requested
    const filteredMedia = mediaItems.filter((item) => {
      // Filter out deleted items unless includeDeleted is true
      if (item.deleted && !includeDeleted) return false

      // Filter out locked items unless includeLocked is true
      if (item.locked && !includeLocked) return false

      return true
    })

    // Count images and videos
    const imageCount = filteredMedia.filter((item) => item.type === "image").length
    const videoCount = filteredMedia.filter((item) => item.type === "video").length

    return NextResponse.json({
      media: filteredMedia,
      totalCount: filteredMedia.length,
      imageCount,
      videoCount,
    })
  } catch (error) {
    console.error("Error in media/active API:", error)
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 })
  }
}
