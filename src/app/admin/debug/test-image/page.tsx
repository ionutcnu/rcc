"use client"

import { useState, useEffect } from "react"
import { getSeoSettings } from "@/lib/firebase/seoService"
import { getStorage, ref, getDownloadURL } from "firebase/storage"
import { app } from "@/lib/firebase/firebaseConfig"

export default function TestImagePage() {
    const [ogImage, setOgImage] = useState("")
    const [proxyUrl, setProxyUrl] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadImage() {
            try {
                setLoading(true)
                // Get the OG image URL from settings
                const settings = await getSeoSettings()

                if (settings.ogImage) {
                    setOgImage(settings.ogImage)

                    // Create proxy URL
                    if (settings.ogImage.includes("firebasestorage.googleapis.com")) {
                        try {
                            const urlObj = new URL(settings.ogImage)
                            const pathStartIndex = urlObj.pathname.indexOf("/o/") + 3
                            if (pathStartIndex > 3) {
                                let filePath = urlObj.pathname.substring(pathStartIndex)
                                // Decode the URL-encoded path
                                filePath = decodeURIComponent(filePath)
                                // Set proxy URL
                                setProxyUrl(`/api/image/${encodeURIComponent(filePath)}`)
                            }
                        } catch (e) {
                            setError("Error parsing Firebase URL")
                        }
                    }
                } else {
                    // If no OG image is set, get a test image from Firebase
                    const storage = getStorage(app)
                    // Replace with a path to an actual image in your storage
                    const imageRef = ref(storage, "cats/sample.jpg")
                    const url = await getDownloadURL(imageRef)
                    setOgImage(url)

                    // Create proxy URL for this test image
                    const urlObj = new URL(url)
                    const pathStartIndex = urlObj.pathname.indexOf("/o/") + 3
                    if (pathStartIndex > 3) {
                        let filePath = urlObj.pathname.substring(pathStartIndex)
                        filePath = decodeURIComponent(filePath)
                        setProxyUrl(`/api/image/${encodeURIComponent(filePath)}`)
                    }
                }
            } catch (err) {
                setError("Error loading image: " + (err instanceof Error ? err.message : String(err)))
            } finally {
                setLoading(false)
            }
        }

        loadImage()
    }, [])

    if (loading) {
        return <div>Loading...</div>
    }

    if (error) {
        return <div>Error: {error}</div>
    }

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-2xl font-bold">Image Test Page</h1>

            <div className="space-y-4">
                <h2 className="text-xl">Original Firebase URL</h2>
                <div className="overflow-x-auto">
                    <code className="bg-gray-100 p-2 rounded block">{ogImage}</code>
                </div>
                <img
                    src={ogImage || "/placeholder.svg"}
                    alt="Original Firebase URL"
                    className="border rounded max-w-md"
                    onError={() => setError("Failed to load original image")}
                />
            </div>

            {proxyUrl && (
                <div className="space-y-4">
                    <h2 className="text-xl">Proxy URL</h2>
                    <div className="overflow-x-auto">
                        <code className="bg-gray-100 p-2 rounded block">{proxyUrl}</code>
                    </div>
                    <img
                        src={proxyUrl || "/placeholder.svg"}
                        alt="Proxied image"
                        className="border rounded max-w-md"
                        onError={() => setError("Failed to load proxied image")}
                    />
                </div>
            )}

            <div className="mt-8 p-4 bg-blue-50 rounded">
                <h3 className="font-bold">How this works:</h3>
                <p>
                    The proxy route converts Firebase Storage URLs to server-side requests, bypassing CORS restrictions and
                    ensuring your images work in OG tags.
                </p>
            </div>
        </div>
    )
}
