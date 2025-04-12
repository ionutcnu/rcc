import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    try {
        // Get the image URL from the query parameter
        const { searchParams } = new URL(request.url)
        const imageUrl = searchParams.get("url")

        if (!imageUrl) {
            return new NextResponse("Missing image URL", { status: 400 })
        }

        // Fetch the image through our server
        const response = await fetch(imageUrl, {
            headers: {
                // Add any necessary headers here
                Accept: "image/*",
            },
        })

        if (!response.ok) {
            return new NextResponse(`Failed to fetch image: ${response.status}`, { status: response.status })
        }

        // Get the image data
        const imageData = await response.arrayBuffer()

        // Get content type from original response or default to jpeg
        const contentType = response.headers.get("content-type") || "image/jpeg"

        // Return the image with appropriate headers
        return new NextResponse(imageData, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400", // Cache for 24 hours
                "Access-Control-Allow-Origin": "*", // Allow any origin to access this resource
            },
        })
    } catch (error) {
        console.error("Error proxying image:", error)
        return new NextResponse("Error proxying image", { status: 500 })
    }
}
