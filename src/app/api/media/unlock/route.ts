import { type NextRequest, NextResponse } from "next/server"
import { verifySessionCookie, getCurrentUserForApi } from "@/lib/auth/session"
import { isUserAdmin } from "@/lib/auth/admin-check"
import { mediaLogger } from "@/lib/utils/media-logger"
import { admin } from "@/lib/firebase/admin"
import { Timestamp } from "firebase-admin/firestore"

export async function POST(request: NextRequest) {
  try {
    // Get the session from the request
    const session = await verifySessionCookie()

    // Check if user is authenticated
    if (!session.authenticated || !session.uid) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await isUserAdmin(session.uid)
    if (!adminUser) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get the media ID from the request body
    const { mediaId } = await request.json()

    if (!mediaId) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    // Get current user info for logging
    const userInfo = await getCurrentUserForApi()

    try {
      // Get a reference to the media document using admin.db instead of db
      const mediaRef = admin.db.collection("media").doc(mediaId)

      // Get the media document
      const mediaDoc = await mediaRef.get()

      if (!mediaDoc.exists) {
        return NextResponse.json({ error: "Media not found" }, { status: 404 })
      }

      const mediaData = mediaDoc.data()

      // Update the media document directly using admin SDK
      await mediaRef.update({
        locked: false,
        lockedBy: null,
        lockedAt: null,
        updatedAt: Timestamp.now(),
      })

      // Log the API access
      mediaLogger.info(
        `API: Unlocked media ${mediaData?.name || mediaId}`,
        { userEmail: userInfo.userEmail || "unknown" },
        userInfo.userId || "unknown",
      )

      return NextResponse.json({
        success: true,
        message: `Media "${mediaData?.name || mediaId}" unlocked successfully`,
        media: { id: mediaId, ...mediaData, locked: false, lockedBy: null, lockedAt: null },
      })
    } catch (error: any) {
      console.error("Firebase error unlocking media:", error)

      // Log the error
      mediaLogger.error(
        `API: Error unlocking media ${mediaId}`,
        {
          error: error.message || "Unknown error",
          code: error.code || "unknown",
          userEmail: userInfo.userEmail || "unknown",
        },
        userInfo.userId || "unknown",
      )

      return NextResponse.json(
        {
          error: `Failed to unlock media: ${error.message || "Unknown error"}`,
          code: error.code || "unknown",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error in media/unlock API:", error)
    return NextResponse.json(
      {
        error: `Failed to unlock media: ${error.message || "Unknown error"}`,
        code: error.code || "unknown",
      },
      { status: 500 },
    )
  }
}
