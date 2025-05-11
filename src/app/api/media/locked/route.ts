import { type NextRequest, NextResponse } from "next/server"
import { getAllMedia } from "@/lib/firebase/storageService"
import { verifySessionCookie } from "@/lib/auth/session"
import { isUserAdmin } from "@/lib/auth/admin-check"
import { mediaLogger } from "@/lib/utils/media-logger"

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
    mediaLogger.info(`API: Fetched locked media`, { userEmail: "admin" }, session.uid)

    // Get all media
    const mediaItems = await getAllMedia(false) // Don't include deleted items

    // Filter to only include locked items
    const lockedMedia = mediaItems.filter((item) => item.locked)

    // Count images and videos
    const imageCount = lockedMedia.filter((item) => item.type === "image").length
    const videoCount = lockedMedia.filter((item) => item.type === "video").length

    return NextResponse.json({
      media: lockedMedia,
      totalCount: lockedMedia.length,
      imageCount,
      videoCount,
    })
  } catch (error) {
    console.error("Error in media/locked API:", error)
    return NextResponse.json({ error: "Failed to fetch locked media" }, { status: 500 })
  }
}
