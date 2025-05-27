import { type NextRequest, NextResponse } from "next/server"
import { getServerStorage } from "@/lib/firebase/server-only"

// The key fix: In Next.js 15, params is now a Promise
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        // Await the params to get the id
        const { id } = await context.params

        // Get the image path from the URL parameter
        const imagePath = decodeURIComponent(id)

        // Get server-side Firebase Storage instance
        const storage = await getServerStorage()

        // Get a reference to the file
        const file = storage.bucket().file(imagePath)

        // Get a signed URL for the file
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000, // 1 hour expiration
        })

        // Fetch the image through our server
        const response = await fetch(url)

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`)
        }

        // Get the image data and content type
        const imageData = await response.arrayBuffer()
        const contentType = response.headers.get("content-type") || "image/jpeg"

        // Return the image with appropriate headers
        return new NextResponse(imageData, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400", // Cache for 24 hours
            },
        })
    } catch (error) {
        console.error("Error serving image:", error)
        return new NextResponse("Error serving image", { status: 500 })
    }
}
