import { type NextRequest, NextResponse } from "next/server"
import { getStorage, ref, getDownloadURL } from "firebase/storage"
import { app } from "@/lib/firebase/firebaseConfig"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Get the image path from the URL parameter
        const imagePath = decodeURIComponent(params.id)

        // Initialize Firebase Storage
        const storage = getStorage(app)

        // Get a fresh download URL
        const imageRef = ref(storage, imagePath)
        const url = await getDownloadURL(imageRef)

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
