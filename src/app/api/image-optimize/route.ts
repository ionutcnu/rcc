import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    const width = searchParams.get('w') || '800'
    const height = searchParams.get('h') || '600'
    const quality = searchParams.get('q') || '75'

    if (!imageUrl) {
        return new NextResponse('Missing image URL', { status: 400 })
    }

    try {
        // Fetch the original image
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ImageOptimizer/1.0)',
            },
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`)
        }

        const contentType = response.headers.get('content-type')
        if (!contentType?.startsWith('image/')) {
            return new NextResponse('Invalid image type', { status: 400 })
        }

        const buffer = await response.arrayBuffer()

        // Set optimization headers
        const headers = new Headers({
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Vary': 'Accept',
            'X-Optimized': 'true',
        })

        // For basic optimization, we'll just return the image with proper headers
        // In production, you could use sharp or other image processing libraries
        return new NextResponse(buffer, {
            status: 200,
            headers,
        })

    } catch (error) {
        console.error('Image optimization error:', error)
        return new NextResponse('Failed to optimize image', { status: 500 })
    }
}