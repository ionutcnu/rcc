"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Upload, Film, Trash2, Search, Loader2, AlertCircle, Download } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useCatPopup } from "@/components/CatPopupProvider"
import { getAllMedia, type MediaItem, deleteMedia, uploadFileAndGetURL } from "@/lib/firebase/storageService"

export default function MediaManagerPage() {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
    const [filteredItems, setFilteredItems] = useState<MediaItem[]>([])
    const [activeFilter, setActiveFilter] = useState<"all" | "images" | "videos" | "image" | "video">("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { showPopup } = useCatPopup()

    // Fetch media on component mount
    useEffect(() => {
        async function fetchMedia() {
            try {
                setLoading(true)
                const media = await getAllMedia()
                setMediaItems(media)

                // Apply initial filtering based on activeFilter
                applyFilters(media, activeFilter, searchQuery)
            } catch (err) {
                console.error("Error fetching media:", err)
                setError("Failed to load media files. Please try again later.")
            } finally {
                setLoading(false)
            }
        }

        fetchMedia()
    }, [])

    // Apply filters when activeFilter or searchQuery changes
    const applyFilters = (items: MediaItem[], filter: string, query: string) => {
        let result = [...items]

        // Apply type filter
        if (filter !== "all") {
            result = result.filter((item) => item.type === filter)
        }

        // Apply search filter
        if (query) {
            const lowercaseQuery = query.toLowerCase()
            result = result.filter(
                (item) =>
                    item.name.toLowerCase().includes(lowercaseQuery) ||
                    (item.catName && item.catName.toLowerCase().includes(lowercaseQuery)),
            )
        }

        setFilteredItems(result)
    }

    // Update filtered items when filter criteria change
    useEffect(() => {
        applyFilters(mediaItems, activeFilter, searchQuery)
    }, [mediaItems, activeFilter, searchQuery])

    const handleDeleteMedia = async (item: MediaItem) => {
        try {
            const success = await deleteMedia(item)
            if (success) {
                setMediaItems((prev) => prev.filter((media) => media.id !== item.id))
                showPopup("Media deleted successfully")
            } else {
                showPopup("Failed to delete media")
            }
        } catch (err) {
            console.error("Error deleting media:", err)
            showPopup("Error deleting media")
        }
    }

    const handleDownload = (item: MediaItem) => {
        // Create a temporary anchor element
        const link = document.createElement("a")
        link.href = item.url
        link.download = item.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        showPopup(`Downloading ${item.name}`)
    }

    const handleUpload = () => {
        // Create a file input element
        const input = document.createElement("input")
        input.type = "file"
        input.accept = "image/*,video/*"
        input.multiple = true

        // Handle file selection
        input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files
            if (!files || files.length === 0) return

            try {
                showPopup(`Uploading ${files.length} file(s)...`)

                // Upload each file
                for (let i = 0; i < files.length; i++) {
                    const file = files[i]

                    // Determine folder based on file type
                    const folder = file.type.startsWith("image/") ? "images" : "videos"

                    // Upload file
                    await uploadFileAndGetURL(file, folder)
                }

                // Refresh media list
                const media = await getAllMedia()
                setMediaItems(media)
                applyFilters(media, activeFilter, searchQuery)

                showPopup(`${files.length} file(s) uploaded successfully`)
            } catch (err) {
                console.error("Error uploading files:", err)
                showPopup("Error uploading files")
            }
        }

        // Trigger file selection
        input.click()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <span className="ml-2">Loading media files...</span>
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive" className="my-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    // Count items by type
    const imageCount = mediaItems.filter((item) => item.type === "image").length
    const videoCount = mediaItems.filter((item) => item.type === "video").length

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Media Manager</h1>
                <Button onClick={handleUpload}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Media
                </Button>
            </div>

            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center space-x-2">
                            <Button
                                variant={activeFilter === "all" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setActiveFilter("all")}
                            >
                                All Media ({mediaItems.length})
                            </Button>
                            <Button
                                variant={activeFilter === "image" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setActiveFilter("image")}
                            >
                                Images ({imageCount})
                            </Button>
                            <Button
                                variant={activeFilter === "video" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setActiveFilter("video")}
                            >
                                Videos ({videoCount})
                            </Button>
                        </div>

                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search media..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {filteredItems.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <Film className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No media files</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {mediaItems.length > 0
                            ? "No files match your current filters. Try adjusting your search or filter criteria."
                            : "Get started by uploading your first media file."}
                    </p>
                    <div className="mt-6">
                        <Button onClick={handleUpload}>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Media
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredItems.map((item) => (
                        <Card key={item.id} className="overflow-hidden">
                            <div className="aspect-video relative bg-muted">
                                {item.type === "image" ? (
                                    <Image
                                        src={item.url || "/placeholder.svg?height=200&width=300"}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <Film className="h-8 w-8 text-white" />
                                    </div>
                                )}
                            </div>
                            <CardContent className="p-4">
                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium truncate">{item.name}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {item.catName && (
                                            <Badge variant="outline" className="text-xs">
                                                {item.catName}
                                            </Badge>
                                        )}
                                        <span className="text-xs text-muted-foreground">{item.size || formatDate(item.createdAt)}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <Button variant="outline" size="sm" onClick={() => handleDownload(item)}>
                                            <Download className="h-4 w-4 mr-1" />
                                            Download
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteMedia(item)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

// Helper function to format date
function formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    })
}
