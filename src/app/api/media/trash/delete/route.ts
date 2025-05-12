import { NextResponse } from "next/server"
import { admin } from "@/lib/firebase/admin"
import { mediaLogger } from "@/lib/utils/media-logger"
import { getCurrentUserForApi } from "@/lib/auth/session"
import { deleteFileFromStorage } from "@/lib/firebase/storageService"

export async function POST(request: Request) {
  try {
    // Get the current user
    const { userId, userEmail } = await getCurrentUserForApi()

    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Parse the request body
    const { mediaId } = await request.json()

    // Validate mediaId
    if (!mediaId) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    console.log(`Attempting to permanently delete media: ${mediaId}`)

    // Get a reference to the media document
    const mediaRef = admin.db.collection("media").doc(mediaId)
    const mediaDoc = await mediaRef.get()

    // Check if the media exists
    if (!mediaDoc.exists) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    const mediaData = mediaDoc.data()

    // Check if the media is in trash (should be deleted first)
    if (!mediaData?.deleted) {
      return NextResponse.json({ error: "Media must be in trash before permanent deletion" }, { status: 400 })
    }

    // Check if the media is locked
    if (mediaData?.locked) {
      return NextResponse.json(
        {
          error: "Cannot delete locked media",
          locked: true,
          lockedReason: mediaData.lockedReason || "Unknown reason",
        },
        { status: 403 },
      )
    }

    // Log the deletion attempt
    mediaLogger.mediaDelete(
      mediaId,
      mediaData.path || mediaData.url || "",
      userId,
      false, // permanent delete (isSoftDelete = false)
    )

    // Delete the file from Firebase Storage
    let storageDeleteSuccess = false
    if (mediaData.path) {
      try {
        // Create a reference to the file in storage
        const fileRef = admin.storage.bucket().file(mediaData.path)

        // Delete the file
        await fileRef.delete()
        console.log(`Successfully deleted file from storage: ${mediaData.path}`)
        storageDeleteSuccess = true
      } catch (storageError) {
        console.error(`Error deleting file from storage: ${mediaData.path}`, storageError)
        // Continue with Firestore deletion even if Storage deletion fails
      }
    } else if (mediaData.url) {
      try {
        // If we only have the URL, try to delete using the URL
        storageDeleteSuccess = await deleteFileFromStorage(mediaData.url)
      } catch (urlError) {
        console.error(`Error deleting file from URL: ${mediaData.url}`, urlError)
        // Continue with Firestore deletion even if Storage deletion fails
      }
    }

    // Delete the media document from Firestore
    await mediaRef.delete()

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Media permanently deleted",
      storageDeleted: storageDeleteSuccess,
    })
  } catch (error) {
    console.error("Error permanently deleting media:", error)
    return NextResponse.json({ error: "Failed to permanently delete media" }, { status: 500 })
  }
}
