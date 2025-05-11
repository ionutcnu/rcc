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
    const { mediaId, reason } = await request.json()

    if (!mediaId) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    if (!reason) {
      return NextResponse.json({ error: "Lock reason is required" }, { status: 400 })
    }

    // Get the media item using admin SDK
    const mediaDoc = await adminDb.collection("media").doc(mediaId).get()

    if (!mediaDoc.exists) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    const mediaItem = { id: mediaDoc.id, ...mediaDoc.data() } as MediaItem

    // If already locked, return success without changing
    if (mediaItem.locked) {
      return NextResponse.json({
        success: true,
        message: "Media already locked",
        media: mediaItem,
      })
    }

    try {
      // Update the media document using admin SDK (bypasses security rules)
      await adminDb.collection("media").doc(mediaId).update({
        locked: true,
        lockedReason: reason,
        lockedAt: new Date(),
        lockedBy: uid,
      })

      // Log the action
      mediaLogger.info(`API: Locked media ${mediaItem.name}`, { id: mediaId, reason }, uid)

      // Get the updated media item
      const updatedMediaDoc = await adminDb.collection("media").doc(mediaId).get()
      const updatedMedia = { id: updatedMediaDoc.id, ...updatedMediaDoc.data() } as MediaItem

      return NextResponse.json({
        success: true,
        message: "Media locked successfully",
        media: updatedMedia,
      })
    } catch (lockError: any) {
      console.error("Error locking media:", lockError)

      // Return detailed error information
      return NextResponse.json(
        {
          error: "Failed to lock media",
          details: lockError.message,
          code: lockError.code,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error in media/lock API:", error)
    return NextResponse.json(
      {
        error: "Failed to lock media",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
