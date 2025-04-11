"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Upload, Film, Trash2, Search, Loader2, AlertCircle, Download, Filter, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useCatPopup } from "@/components/CatPopupProvider"
import { getAllMedia, type MediaItem, deleteMedia, uploadFileAndGetURL } from "@/lib/firebase/storageService"
import { SimpleConfirmDialog } from "@/components/simple-confirm-dialog"
import { Pagination } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"

// Helper function to format date
function formatDate(date: Date | undefined | null): string {
    if (!date) return "Unknown date"

    try {
        return format(new Date(date), "MMM d, yyyy")
    } catch (error) {
        return "Invalid date"
    }
}

export default function MediaManagerPage() {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
    const [filteredItems, setFilteredItems] = useState<MediaItem[]>([])
    const [paginatedItems, setPaginatedItems] = useState<MediaItem[]>([])
    const [activeFilter, setActiveFilter] = useState<"all" | "images" | "videos" | "image" | "video">("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { showPopup } = useCatPopup()

    // Add state for delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null)

    // Add state for upload progress
    const [isUploading, setIsUploading] = useState(false)

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(12)
    const [totalPages, setTotalPages] = useState(1)

    // Simplified sorting state
    const [sortOption, setSortOption] = useState<string>("dateDesc")
    const [sizeFilter, setSizeFilter] = useState<string>("all")
    const [showFilters, setShowFilters] = useState(false)

    // Fetch media on component mount
    const fetchMedia = async () => {
        try {
            setLoading(true)
            const media = await getAllMedia()

            // Filter out any media items that might have invalid URLs
            const validMedia = media.filter((item) => {
                // Basic validation - ensure URL exists and is not empty
                return item.url && item.url.trim() !== ""
            })

            // Clean up any media items that return 404 errors
            const mediaToCleanup: MediaItem[] = []

            for (const item of validMedia) {
                try {
                    // Test if the URL is accessible
                    const response = await fetch(item.url, { method: "HEAD" })
                    if (response.status === 404) {
                        console.log(`Found 404 for media item: ${item.name} (${item.id})`)
                        mediaToCleanup.push(item)
                    }
                } catch (error) {
                    console.error(`Error checking media URL ${item.url}:`, error)
                    // Add to cleanup if there's an error accessing the URL
                    mediaToCleanup.push(item)
                }
            }

            // Clean up any 404 media items from Firestore
            if (mediaToCleanup.length > 0) {
                console.log(`Cleaning up ${mediaToCleanup.length} missing media items`)
                for (const item of mediaToCleanup) {
                    try {
                        await deleteMedia(item)
                        console.log(`Cleaned up missing media: ${item.name} (${item.id})`)
                    } catch (cleanupError) {
                        console.error(`Failed to clean up media item ${item.id}:`, cleanupError)
                    }
                }

                // Filter out the cleaned up items from our list
                const filteredMedia = validMedia.filter(
                    (item) => !mediaToCleanup.some((cleanupItem) => cleanupItem.id === item.id),
                )

                setMediaItems(filteredMedia)
                showPopup(`Cleaned up ${mediaToCleanup.length} missing media files`)
            } else {
                setMediaItems(validMedia)
            }

            // Apply initial filtering based on activeFilter
            applyFilters(
                validMedia.filter((item) => !mediaToCleanup.some((cleanupItem) => cleanupItem.id === item.id)),
                activeFilter,
                searchQuery,
                sortOption,
                sizeFilter,
            )
        } catch (err) {
            console.error("Error fetching media:", err)
            setError("Failed to load media files. Please try again later.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMedia()
    }, [])

    // Apply filters when filter criteria change
    const applyFilters = (items: MediaItem[], filter: string, query: string, sort: string, size: string) => {
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

        // Apply size filter
        if (size !== "all") {
            result = result.filter((item) => {
                if (!item.size) return false

                const sizeInMB = Number.parseFloat(item.size.replace(/[^0-9.]/g, ""))

                switch (size) {
                    case "small":
                        return sizeInMB < 1
                    case "medium":
                        return sizeInMB >= 1 && sizeInMB < 5
                    case "large":
                        return sizeInMB >= 5
                    default:
                        return true
                }
            })
        }

        // Apply sorting based on the selected option
        switch (sort) {
            case "dateAsc":
                result.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
                    return dateA - dateB
                })
                break
            case "dateDesc":
                result.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
                    return dateB - dateA
                })
                break
            case "sizeAsc":
                result.sort((a, b) => {
                    const sizeA = a.size ? Number.parseFloat(a.size.replace(/[^0-9.]/g, "")) : 0
                    const sizeB = b.size ? Number.parseFloat(b.size.replace(/[^0-9.]/g, "")) : 0
                    return sizeA - sizeB
                })
                break
            case "sizeDesc":
                result.sort((a, b) => {
                    const sizeA = a.size ? Number.parseFloat(a.size.replace(/[^0-9.]/g, "")) : 0
                    const sizeB = b.size ? Number.parseFloat(b.size.replace(/[^0-9.]/g, "")) : 0
                    return sizeB - sizeA
                })
                break
            case "nameAsc":
                result.sort((a, b) => a.name.localeCompare(b.name))
                break
            case "nameDesc":
                result.sort((a, b) => b.name.localeCompare(a.name))
                break
        }

        setFilteredItems(result)
        setTotalPages(Math.ceil(result.length / itemsPerPage) || 1) // Ensure at least 1 page

        // Update paginated items
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        setPaginatedItems(result.slice(startIndex, endIndex))
    }

    // Update filtered items when filter criteria change
    useEffect(() => {
        applyFilters(mediaItems, activeFilter, searchQuery, sortOption, sizeFilter)
    }, [mediaItems, activeFilter, searchQuery, sortOption, sizeFilter])

    // Update paginated items when page changes
    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        setPaginatedItems(filteredItems.slice(startIndex, endIndex))
    }, [currentPage, itemsPerPage, filteredItems])

    // Function to handle delete button click
    const handleDeleteClick = (item: MediaItem) => {
        setMediaToDelete(item)
        setDeleteDialogOpen(true)
    }

    // Function to handle actual deletion after confirmation
    const handleDeleteConfirm = async () => {
        if (!mediaToDelete) return

        try {
            const success = await deleteMedia(mediaToDelete)
            if (success) {
                // Remove the deleted item from the state
                setMediaItems((prev) => prev.filter((media) => media.id !== mediaToDelete.id))
                showPopup("Media deleted successfully")
            } else {
                showPopup("Failed to delete media")
            }
        } catch (err) {
            console.error("Error deleting media:", err)
            showPopup("Error deleting media")
        } finally {
            setDeleteDialogOpen(false)
            setMediaToDelete(null)
        }
    }

    // Function to cancel deletion
    const handleCancelDelete = () => {
        setDeleteDialogOpen(false)
        setMediaToDelete(null)
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
                setIsUploading(true)
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
                await fetchMedia()

                showPopup(`${files.length} file(s) uploaded successfully`)
            } catch (err) {
                console.error("Error uploading files:", err)
                showPopup("Error uploading files")
            } finally {
                setIsUploading(false)
            }
        }

        // Trigger file selection
        input.click()
    }

    const resetFilters = () => {
        setSearchQuery("")
        setActiveFilter("all")
        setSortOption("dateDesc")
        setSizeFilter("all")
        setItemsPerPage(12)
        setCurrentPage(1)
        // Force re-filtering with the reset values
        applyFilters(mediaItems, "all", "", "dateDesc", "all")
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
                <Button onClick={handleUpload} disabled={isUploading}>
                    {isUploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Media
                        </>
                    )}
                </Button>
            </div>

            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center space-x-2">
                            <Button
                                variant={activeFilter === "all" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => {
                                    setActiveFilter("all")
                                    setCurrentPage(1)
                                }}
                            >
                                All Media ({mediaItems.length})
                            </Button>
                            <Button
                                variant={activeFilter === "image" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => {
                                    setActiveFilter("image")
                                    setCurrentPage(1)
                                }}
                            >
                                Images ({imageCount})
                            </Button>
                            <Button
                                variant={activeFilter === "video" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => {
                                    setActiveFilter("video")
                                    setCurrentPage(1)
                                }}
                            >
                                Videos ({videoCount})
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder="Search media..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                />
                            </div>
                            <Button
                                variant={showFilters ? "secondary" : "outline"}
                                size="icon"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="mt-4 border-t pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-medium">Advanced Filters</h3>
                                <Button variant="ghost" size="sm" onClick={resetFilters}>
                                    <X className="mr-2 h-4 w-4" />
                                    Reset Filters
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Sort By */}
                                <div>
                                    <Label htmlFor="sort-by">Sort By</Label>
                                    <Select value={sortOption} onValueChange={(value) => setSortOption(value)}>
                                        <SelectTrigger id="sort-by" className="flex-1">
                                            <SelectValue placeholder="Sort by" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dateDesc">Date Added (Newest First)</SelectItem>
                                            <SelectItem value="dateAsc">Date Added (Oldest First)</SelectItem>
                                            <SelectItem value="sizeDesc">Size (Largest First)</SelectItem>
                                            <SelectItem value="sizeAsc">Size (Smallest First)</SelectItem>
                                            <SelectItem value="nameAsc">Name (A-Z)</SelectItem>
                                            <SelectItem value="nameDesc">Name (Z-A)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Size Filter */}
                                <div>
                                    <Label htmlFor="size-filter">File Size</Label>
                                    <Select
                                        value={sizeFilter}
                                        onValueChange={(value) => {
                                            setSizeFilter(value)
                                            setCurrentPage(1)
                                        }}
                                    >
                                        <SelectTrigger id="size-filter">
                                            <SelectValue placeholder="All Sizes" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Sizes</SelectItem>
                                            <SelectItem value="small">Small (&lt; 1MB)</SelectItem>
                                            <SelectItem value="medium">Medium (1-5MB)</SelectItem>
                                            <SelectItem value="large">Large (&gt; 5MB)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Items Per Page */}
                                <div>
                                    <Label htmlFor="items-per-page">Items Per Page</Label>
                                    <Select
                                        value={itemsPerPage.toString()}
                                        onValueChange={(value) => {
                                            setItemsPerPage(Number(value))
                                            setCurrentPage(1)
                                        }}
                                    >
                                        <SelectTrigger id="items-per-page">
                                            <SelectValue placeholder="12" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="12">12</SelectItem>
                                            <SelectItem value="24">24</SelectItem>
                                            <SelectItem value="48">48</SelectItem>
                                            <SelectItem value="96">96</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Results count */}
            <div className="text-sm text-gray-500">
                Showing {paginatedItems.length} of {filteredItems.length} media items
                {filteredItems.length !== mediaItems.length && ` (filtered from ${mediaItems.length} total)`}
            </div>

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
                        <Button onClick={handleUpload} disabled={isUploading}>
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Media
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {paginatedItems.map((item) => (
                        <Card key={item.id} className="overflow-hidden">
                            <div className="aspect-video relative bg-muted">
                                {item.type === "image" ? (
                                    <Image
                                        src={item.url || "/placeholder.svg?height=200&width=300"}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                        onError={(e) => {
                                            // Replace broken image with placeholder
                                            ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=300"
                                            console.error(`Failed to load image: ${item.url}`)

                                            // Automatically clean up this item if it's a 404
                                            if (item.id) {
                                                deleteMedia(item)
                                                    .then(() => {
                                                        setMediaItems((prev) => prev.filter((media) => media.id !== item.id))
                                                        showPopup(`Removed missing media: ${item.name}`)
                                                    })
                                                    .catch((err) => {
                                                        console.error(`Failed to auto-clean media item ${item.id}:`, err)
                                                    })
                                            }
                                        }}
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
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(item)}>
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

            {/* Pagination */}
            {filteredItems.length > 0 && (
                <Pagination
                    totalItems={filteredItems.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <SimpleConfirmDialog
                isOpen={deleteDialogOpen}
                title="Delete Media"
                message={`Are you sure you want to delete ${mediaToDelete?.name || "this media"}? This action cannot be undone.`}
                onConfirm={handleDeleteConfirm}
                onCancel={handleCancelDelete}
            />
        </div>
    )
}
