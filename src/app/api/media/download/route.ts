import { type NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase/admin"
import { mediaLogger } from "@/lib/utils/media-logger"
import { getMediaById } from "@/lib/firebase/storageService"

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
    const sessionCookie = request.cookies.get("session")?.value

    if (!sessionCookie) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    try {
      // Verify the session cookie
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie)
      const userId = decodedClaims.uid

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
      mediaLogger.info(`Media download: ${mediaItem.name}`, {
        mediaId: mediaItem.id,
        userId,
        mediaType: mediaItem.type,
      })

      // Fetch the file from Firebase Storage
      try {
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
        newResponse.headers.set("Content-Type", response.headers.get("Content-Type") || "application/octet-stream")
        newResponse.headers.set(
          "Content-Length",
          response.headers.get("Content-Length") || String(fileBuffer.byteLength),
        )

        console.log(`Successfully prepared download for: ${mediaItem.name}`)
        return newResponse
      } catch (fetchError) {
        console.error("Error fetching file:", fetchError)

        // If fetch fails, redirect to the URL
        return NextResponse.redirect(mediaItem.url)
      }
    } catch (authError) {
      console.error("Authentication error:", authError)
      return NextResponse.json({ error: "Invalid authentication" }, { status: 401 })
    }
  } catch (error) {
    console.error("Error in download API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
