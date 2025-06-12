import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get("url")

    if (!url) {
        return new NextResponse("Missing URL parameter", { status: 400 })
    }

    try {
        // Get range header from incoming request
        const range = request.headers.get("range")
        
        // Prepare headers for the fetch request
        const fetchHeaders: Record<string, string> = {}
        
        // Forward range header if present
        if (range) {
            fetchHeaders["Range"] = range
        }

        // Fetch the video from Firebase Storage
        const response = await fetch(url, {
            headers: fetchHeaders,
        })

        if (!response.ok) {
            console.error(`Video proxy failed: ${response.status} ${response.statusText}`)
            return new NextResponse("Video not found", { status: 404 })
        }

        // Get video data
        const videoData = await response.arrayBuffer()

        // Prepare response headers
        const responseHeaders = new Headers()
        
        // Copy important headers from original response
        const headersToForward = [
            "content-type",
            "content-length", 
            "content-range",
            "accept-ranges",
            "cache-control",
            "etag",
            "last-modified"
        ]

        headersToForward.forEach(header => {
            const value = response.headers.get(header)
            if (value) {
                responseHeaders.set(header, value)
            }
        })

        // Set default content type if not present
        if (!responseHeaders.get("content-type")) {
            responseHeaders.set("content-type", "video/mp4")
        }

        // Ensure accept-ranges is set for video seeking
        if (!responseHeaders.get("accept-ranges")) {
            responseHeaders.set("accept-ranges", "bytes")
        }

        // Set CORS headers
        responseHeaders.set("access-control-allow-origin", "*")
        responseHeaders.set("access-control-allow-methods", "GET, HEAD, OPTIONS")
        responseHeaders.set("access-control-allow-headers", "Range")

        // Return appropriate status code
        const status = response.status === 206 ? 206 : 200

        return new NextResponse(videoData, {
            status,
            headers: responseHeaders,
        })

    } catch (error) {
        console.error("Video proxy error:", error)
        return new NextResponse("Internal server error", { status: 500 })
    }
}

export async function HEAD(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get("url")

    if (!url) {
        return new NextResponse(null, { status: 400 })
    }

    try {
        // HEAD request to get video metadata
        const response = await fetch(url, {
            method: "HEAD",
        })

        if (!response.ok) {
            return new NextResponse(null, { status: 404 })
        }

        // Prepare response headers
        const responseHeaders = new Headers()
        
        // Copy headers
        const headersToForward = [
            "content-type",
            "content-length",
            "accept-ranges",
            "cache-control",
            "etag",
            "last-modified"
        ]

        headersToForward.forEach(header => {
            const value = response.headers.get(header)
            if (value) {
                responseHeaders.set(header, value)
            }
        })

        // Set defaults
        if (!responseHeaders.get("content-type")) {
            responseHeaders.set("content-type", "video/mp4")
        }
        if (!responseHeaders.get("accept-ranges")) {
            responseHeaders.set("accept-ranges", "bytes")
        }

        // Set CORS headers
        responseHeaders.set("access-control-allow-origin", "*")
        responseHeaders.set("access-control-allow-methods", "GET, HEAD, OPTIONS")
        responseHeaders.set("access-control-allow-headers", "Range")

        return new NextResponse(null, {
            status: 200,
            headers: responseHeaders,
        })

    } catch (error) {
        console.error("Video proxy HEAD error:", error)
        return new NextResponse(null, { status: 500 })
    }
}

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, HEAD, OPTIONS",
            "access-control-allow-headers": "Range",
            "access-control-max-age": "86400",
        },
    })
}