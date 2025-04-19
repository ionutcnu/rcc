"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function TestProxyPage() {
    const [imageUrl, setImageUrl] = useState("")
    const [proxyUrl, setProxyUrl] = useState("")
    const [error, setError] = useState<string | null>(null)

    const handleTest = () => {
        if (!imageUrl) {
            setError("Please enter an image URL")
            return
        }

        setError(null)
        setProxyUrl(`/api/image-proxy?url=${encodeURIComponent(imageUrl)}`)
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">Image Proxy Test</h1>

            <div className="space-y-4">
                <div className="flex gap-4">
                    <Input
                        placeholder="Enter Firebase Storage image URL"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="flex-1"
                    />
                    <Button onClick={handleTest}>Test Proxy</Button>
                </div>

                {error && <p className="text-red-500">{error}</p>}
            </div>

            {proxyUrl && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Original Image</h2>
                        <div className="overflow-x-auto mb-2">
                            <code className="bg-gray-100 p-2 rounded block text-sm">{imageUrl}</code>
                        </div>
                        <div className="border rounded p-4 bg-gray-50">
                            <img
                                src={imageUrl || "/placeholder.svg"}
                                alt="Original"
                                className="max-h-64 mx-auto"
                                onError={() => console.log("Original image failed to load (expected due to CORS)")}
                            />
                            <p className="text-center text-sm text-gray-500 mt-2">This may fail due to CORS restrictions</p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-2">Proxied Image</h2>
                        <div className="overflow-x-auto mb-2">
                            <code className="bg-gray-100 p-2 rounded block text-sm">{proxyUrl}</code>
                        </div>
                        <div className="border rounded p-4 bg-gray-50">
                            <img
                                src={proxyUrl || "/placeholder.svg"}
                                alt="Proxied"
                                className="max-h-64 mx-auto"
                                onError={() => setError("Proxied image failed to load")}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold">How to use:</h3>
                <ol className="list-decimal ml-5 space-y-2 mt-2">
                    <li>Paste a Firebase Storage URL in the input field</li>
                    <li>Click "Test Proxy" to see if our proxy can successfully load the image</li>
                    <li>If the proxied image loads correctly, the proxy is working!</li>
                    <li>Use this proxy URL format in your OG tags and anywhere else you need to display Firebase images</li>
                </ol>
            </div>
        </div>
    )
}
