import { type NextRequest, NextResponse } from "next/server"
import { verifySessionCookie } from "@/lib/auth/session"
import { serverLogger } from "@/lib/utils/server-logger"
import { getMediaById } from "@/lib/server/mediaService"
import { getStorage } from "firebase-admin/storage"

/**
 * API route for downloading media files
 * This provides a secure way to download files without exposing Firebase Storage URLs directly
 */
export async function GET(request: NextRequest) {
  try {
    // Get the media ID from the query parameters
    const searchParams = request.nextUrl.searchParams
    const mediaId = searchParams.get("id")

    // Check if media ID is provided
    if (!mediaId) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    console.log(`Download request for media ID: ${mediaId}`)

    // Verify authentication
    const session = await verifySessionCookie()
    if (!session.authenticated || !session.uid) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get the media item
    const mediaItem = await getMediaById(mediaId)

    if (!mediaItem) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    // Check if the media has a URL
    if (!mediaItem.url) {
      return NextResponse.json({ error: "Media URL not available" }, { status: 404 })
    }

    console.log(`Fetching media from URL: ${mediaItem.url}`)

    // Log the download
    serverLogger.info(`Media download: ${mediaItem.name}`, {
      mediaId: mediaItem.id,
      mediaType: mediaItem.type,
    }, session.uid)

    // Fetch the file from Firebase Storage
    try {
      // If we have a path, download directly from Firebase Storage
      if (mediaItem.path) {
        const storage = getStorage()
        const bucket = storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "")
        const fileRef = bucket.file(mediaItem.path)

        const [fileBuffer] = await fileRef.download()

        // Create a new response with the file content
        const response = new NextResponse(fileBuffer)

        // Set headers to force download
        response.headers.set("Content-Disposition", `attachment; filename="${mediaItem.name}"`)
        response.headers.set("Content-Type", mediaItem.contentType || "application/octet-stream")
        response.headers.set("Content-Length", String(fileBuffer.byteLength))

        console.log(`Successfully prepared download for: ${mediaItem.name}`)
        return response
      } else {
        // Fallback to URL if path is not available
        const response = await fetch(mediaItem.url)

        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
        }

        // Get the file content
        const fileBuffer = await response.arrayBuffer()

        // Create a new response with the file content
        const newResponse = new NextResponse(fileBuffer)

        // Set headers to force download
        newResponse.headers.set("Content-Disposition", `attachment; filename="${mediaItem.name}"`)
        newResponse.headers.set("Content-Type", mediaItem.contentType || "application/octet-stream")
        newResponse.headers.set("Content-Length", String(fileBuffer.byteLength))

        console.log(`Successfully prepared download for: ${mediaItem.name}`)
        return newResponse
      }
    } catch (fetchError) {
      console.error("Error fetching file:", fetchError)

      // If fetch fails, redirect to the URL
      return NextResponse.redirect(mediaItem.url)
    }
  } catch (error) {
    console.error("Error in download API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
