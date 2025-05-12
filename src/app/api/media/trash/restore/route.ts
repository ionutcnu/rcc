import { type NextRequest, NextResponse } from "next/server"
import { admin } from "@/lib/firebase/admin"
import { getCurrentUserForApi } from "@/lib/auth/session"
import { mediaLogger } from "@/lib/utils/media-logger"
import { Timestamp } from "firebase-admin/firestore"

export async function POST(request: NextRequest) {
  try {
    // Get the current user - use the correct pattern
    const { userId, userEmail } = await getCurrentUserForApi()

    // Check if user is authenticated - use the correct properties
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Parse the request body
    const { mediaId } = await request.json()

    // Validate mediaId
    if (!mediaId) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    console.log(`Attempting to restore media: ${mediaId}`)

    // Get a reference to the media document
    const mediaRef = admin.db.collection("media").doc(mediaId)
    const mediaDoc = await mediaRef.get()

    // Check if the media exists
    if (!mediaDoc.exists) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    const mediaData = mediaDoc.data()

    // Check if the media is actually in trash
    if (!mediaData?.deleted) {
      return NextResponse.json({ error: "Media is not in trash" }, { status: 400 })
    }

    // Restore the media by updating the document - use the correct Timestamp
    await mediaRef.update({
      deleted: false,
      deletedAt: null,
      deletedBy: null,
      updatedAt: Timestamp.now(),
    })

    // Log the restoration
    mediaLogger.info(
      `Media restored: ${mediaId}`,
      {
        id: mediaId,
        name: mediaData.name,
        userEmail: userEmail || "unknown",
      },
      userId,
    )

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Media restored successfully",
      media: {
        id: mediaId,
        ...mediaData,
        deleted: false,
        deletedAt: null,
        deletedBy: null,
      },
    })
  } catch (error) {
    console.error("Error restoring media:", error)
    return NextResponse.json(
      { error: "Failed to restore media", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
