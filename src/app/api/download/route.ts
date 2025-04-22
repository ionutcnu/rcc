import { type NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase/admin"
import { mediaLogger } from "@/lib/utils/media-logger"

export async function GET(request: NextRequest) {
    try {
        // Get the file path and download URL from the query parameters
        const searchParams = request.nextUrl.searchParams
        const downloadURL = searchParams.get("downloadURL")
        const mediaId = searchParams.get("id")
        const fileName = searchParams.get("fileName") || "download"

        // Check if downloadURL is provided
        if (!downloadURL) {
            mediaLogger.error("Download URL is missing in download request", { mediaId })
            return new NextResponse("Download URL is required", { status: 400 })
        }

        // Validate the download URL
        try {
            new URL(downloadURL)
        } catch (error) {
            mediaLogger.error("Invalid download URL", { mediaId, downloadURL, error: (error as Error).message })
            return new NextResponse("Invalid download URL", { status: 400 })
        }

        // Get the session token from the request
        const sessionCookie = request.cookies.get("session")?.value

        // Verify the session (optional - you can remove this if you want to allow public downloads)
        if (sessionCookie) {
            try {
                await adminAuth.verifySessionCookie(sessionCookie)
            } catch (error: any) {
                console.error("Invalid session:", error)
                mediaLogger.warn("Invalid session cookie", { mediaId, error: error.message })
                return new NextResponse("Unauthorized", { status: 401 })
            }
        }

        // Log the download
        mediaLogger.info(`File download: ${fileName}`, {
            id: mediaId || "unknown",
            downloadURL,
        })

        try {
            // Fetch the file from Firebase
            const response = await fetch(downloadURL)

            if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
            }

            // Get the file content
            const fileBuffer = await response.arrayBuffer()

            // Create a new response with the file content
            const newResponse = new NextResponse(fileBuffer)

            // Set headers to force download
            newResponse.headers.set("Content-Disposition", `attachment; filename="${fileName}"`)
            newResponse.headers.set("Content-Type", response.headers.get("Content-Type") || "application/octet-stream")
            newResponse.headers.set("Content-Length", response.headers.get("Content-Length") || String(fileBuffer.byteLength))

            return newResponse
        } catch (fetchError) {
            console.error("Error fetching file:", fetchError)
            mediaLogger.error("Error fetching file for download", {
                mediaId,
                downloadURL,
                error: (fetchError as Error).message,
            })

            // If fetch fails, fall back to redirect
            return NextResponse.redirect(downloadURL, 302)
        }
    } catch (error) {
        console.error("Error in download API:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
