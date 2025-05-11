import { type NextRequest, NextResponse } from "next/server"
import { lockMedia, getMediaById } from "@/lib/firebase/storageService"
import { verifySessionCookie } from "@/lib/auth/session"
import { isUserAdmin } from "@/lib/auth/admin-check"
import { mediaLogger } from "@/lib/utils/media-logger"

export async function POST(request: NextRequest) {
  try {
    // Verify session and get auth info
    const { authenticated, uid } = await verifySessionCookie()

    // Check if user is authenticated
    if (!authenticated || !uid) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if user is admin
    const admin = await isUserAdmin(uid)
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get request body
    const { mediaId, reason } = await request.json()

    // Validate required fields
    if (!mediaId) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    if (!reason) {
      return NextResponse.json({ error: "Lock reason is required" }, { status: 400 })
    }

    // Get the media item
    const mediaItem = await getMediaById(mediaId)
    if (!mediaItem) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    // Check if already locked
    if (mediaItem.locked) {
      return NextResponse.json({ error: "Media is already locked", mediaItem }, { status: 400 })
    }

    // Lock the media
    const success = await lockMedia(mediaItem, reason)

    if (!success) {
      return NextResponse.json({ error: "Failed to lock media" }, { status: 500 })
    }

    // Log the action
    mediaLogger.info(`API: Locked media ${mediaItem.name}`, { id: mediaId, reason }, uid)

    // Get the updated media item
    const updatedMedia = await getMediaById(mediaId)

    return NextResponse.json({ success: true, media: updatedMedia })
  } catch (error) {
    console.error("Error in media/lock API:", error)
    return NextResponse.json({ error: "Failed to lock media" }, { status: 500 })
  }
}
