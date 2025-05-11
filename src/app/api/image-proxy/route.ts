import { type NextRequest, NextResponse } from "next/server"
import { mediaLogger } from "@/lib/utils/media-logger"

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get("url")
    const isPlaceholder = searchParams.get("placeholder") === "true"
    const width = Number.parseInt(searchParams.get("width") || "200")
    const height = Number.parseInt(searchParams.get("height") || "200")

    // If placeholder is requested, generate a simple SVG placeholder
    if (isPlaceholder) {
        const svg = generatePlaceholderSVG(width, height)
        return new NextResponse(svg, {
            headers: {
                "Content-Type": "image/svg+xml",
                "Cache-Control": "public, max-age=31536000, immutable", // Cache for a year
            },
        })
    }

    // If no URL provided, return an error or placeholder
    if (!url) {
        const svg = generatePlaceholderSVG(width, height)
        return new NextResponse(svg, {
            headers: {
                "Content-Type": "image/svg+xml",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        })
    }

    try {
        // Fetch the image from the provided URL
        const response = await fetch(url, {
            next: { revalidate: 3600 }, // Revalidate every hour
        })

        if (!response.ok) {
            // Log the error
            mediaLogger.warn(`Image proxy failed to load: ${url}`, {
                status: response.status,
                statusText: response.statusText,
            })

            // Return a placeholder for failed images
            const svg = generatePlaceholderSVG(width, height)
            return new NextResponse(svg, {
                headers: {
                    "Content-Type": "image/svg+xml",
                    "Cache-Control": "public, max-age=300", // Cache for 5 minutes
                },
            })
        }

        // Get the original image's content type
        const contentType = response.headers.get("Content-Type") || "image/jpeg"

        // Get the image data
        const imageData = await response.arrayBuffer()

        // Return the image with appropriate headers
        return new NextResponse(imageData, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400", // Cache for a day
            },
        })
    } catch (error) {
        console.error("Image proxy error:", error)

        // Log the error
        mediaLogger.error(`Image proxy error for URL: ${url}`, {
            error: error instanceof Error ? error.message : "Unknown error",
        })

        // Return a placeholder for errors
        const svg = generatePlaceholderSVG(width, height)
        return new NextResponse(svg, {
            headers: {
                "Content-Type": "image/svg+xml",
                "Cache-Control": "public, max-age=300", // Cache for 5 minutes
            },
        })
    }
}

// Generate a simple SVG placeholder
function generatePlaceholderSVG(width: number, height: number): string {
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#f1f5f9" />
    <svg x="${width / 2 - 20}" y="${height / 2 - 20}" width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9C3 7.89543 3.89543 7 5 7H7L8 5H16L17 7H19C20.1046 7 21 7.89543 21 9V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V9Z" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="13" r="3" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <text x="50%" y="85%" font-family="Arial, sans-serif" font-size="12" fill="#64748b" text-anchor="middle">Image not available</text>
  </svg>`
}
