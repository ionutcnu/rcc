import { type NextRequest, NextResponse } from "next/server"
import { verifySessionCookie } from "@/lib/auth/session"
import { isUserAdmin } from "@/lib/auth/admin-check"
import { mediaLogger } from "@/lib/utils/media-logger"
import { adminDb } from "@/lib/firebase/admin"
import type { MediaItem } from "@/lib/types/media"

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

    // Parse request body
    const { mediaId } = await request.json()

    if (!mediaId) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    // Get the media item using admin SDK
    const mediaDoc = await adminDb.collection("media").doc(mediaId).get()

    if (!mediaDoc.exists) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    const mediaItem = { id: mediaDoc.id, ...mediaDoc.data() } as MediaItem

    // Check if media is already deleted
    if (mediaItem.deleted) {
      return NextResponse.json({
        success: true,
        message: "Media already in trash",
        media: mediaItem,
      })
    }

    // Check if media is locked
    if (mediaItem.locked) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot move locked media to trash",
          media: mediaItem,
        },
        { status: 403 },
      )
    }

    try {
      // Update the media document to mark as deleted
      await adminDb.collection("media").doc(mediaId).update({
        deleted: true,
        deletedAt: new Date(),
        deletedBy: uid,
      })

      // Log the action
      mediaLogger.info(`API: Moved media ${mediaItem.name} to trash`, { id: mediaId }, uid)

      // Get the updated media item
      const updatedMediaDoc = await adminDb.collection("media").doc(mediaId).get()
      const updatedMedia = { id: updatedMediaDoc.id, ...updatedMediaDoc.data() } as MediaItem

      return NextResponse.json({
        success: true,
        message: "Media moved to trash successfully",
        media: updatedMedia,
      })
    } catch (error: any) {
      console.error("Error moving media to trash:", error)

      // Return detailed error information
      return NextResponse.json(
        {
          error: "Failed to move media to trash",
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error in media/trash/move API:", error)
    return NextResponse.json(
      {
        error: "Failed to move media to trash",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
