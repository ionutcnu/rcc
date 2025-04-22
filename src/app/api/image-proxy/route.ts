import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    try {
        // Get the media URL from the query parameter
        const { searchParams } = new URL(request.url)
        const mediaUrl = searchParams.get("url")

        if (!mediaUrl) {
            return new NextResponse("Missing media URL", { status: 400 })
        }

        // Determine if this is likely a video based on URL
        const isVideo = /\.(mp4|webm|mov|avi|wmv|flv|mkv)($|\?)/.test(mediaUrl.toLowerCase())

        // Fetch the media through our server
        const response = await fetch(mediaUrl, {
            headers: {
                // Accept both image and video content types
                Accept: isVideo ? "video/*, */*" : "image/*, */*",
            },
        })

        if (!response.ok) {
            console.error(`Failed to fetch media: ${response.status} ${response.statusText}`)
            return new NextResponse(`Failed to fetch media: ${response.status}`, { status: response.status })
        }

        // Get the media data
        const mediaData = await response.arrayBuffer()

        // Get content type from original response or determine a default based on URL
        let contentType = response.headers.get("content-type")

        if (!contentType) {
            // Try to determine content type from URL if not provided in response
            if (isVideo) {
                contentType = "video/mp4" // Default video type
            } else {
                contentType = "image/jpeg" // Default image type
            }
        }

        // Log successful proxy for debugging
        console.log(`Successfully proxied ${isVideo ? "video" : "image"}: ${mediaUrl.substring(0, 100)}...`)

        // Return the media with appropriate headers
        return new NextResponse(mediaData, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400", // Cache for 24 hours
                "Access-Control-Allow-Origin": "*", // Allow any origin to access this resource
                "Accept-Ranges": "bytes", // Important for video seeking
            },
        })
    } catch (error) {
        console.error("Error proxying media:", error)
        return new NextResponse(`Error proxying media: ${error instanceof Error ? error.message : "Unknown error"}`, {
            status: 500,
        })
    }
}
