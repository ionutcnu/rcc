"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Upload, Film, Trash2, Search, Loader2, AlertCircle, Download, Filter, X, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

// Add these imports and state variables at the appropriate places
import { mediaLogger } from "@/lib/utils/media-logger"
import { auth } from "@/lib/firebase/firebaseConfig"
import { getCurrentUserInfo } from "@/lib/utils/user-info"

// Add this state for bulk operations confirmation

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

    // State to hold items that need review before cleanup
    const [itemsToReview, setItemsToReview] = useState<MediaItem[]>([])

    // Add this state for bulk operations confirmation
    const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false)
    const [bulkAction, setBulkAction] = useState<{ type: string; items: MediaItem[] } | null>(null)

    // Add this state at the top with other state variables
    const [showIssuesPanel, setShowIssuesPanel] = useState(false)
    const [potentialIssues, setPotentialIssues] = useState<MediaItem[]>([])

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

            // DISABLED AUTOMATIC CLEANUP - Only log potential issues
            console.log("Media validation check running - cleanup disabled")

            // Create a list of potentially problematic items but don't take action
            const potentialIssues: MediaItem[] = []

            // Use Promise.allSettled to prevent one failure from stopping the whole process
            const checkPromises = validMedia.map(
                (item) =>
                    new Promise<void>(async (resolve) => {
                        try {
                            // Skip placeholder images and empty URLs
                            if (!item.url || item.url.includes("placeholder")) {
                                resolve()
                                return
                            }

                            // Use a timeout to prevent hanging
                            const controller = new AbortController()
                            const timeoutId = setTimeout(() => controller.abort(), 5000)

                            try {
                                const response = await fetch(item.url, {
                                    method: "HEAD",
                                    signal: controller.signal,
                                })

                                clearTimeout(timeoutId)

                                if (response.status === 404) {
                                    console.log(`Found 404 for media item: ${item.name} (${item.id}) - manual review required`)
                                    potentialIssues.push(item)
                                }
                            } catch (error) {
                                clearTimeout(timeoutId)
                                console.error(`Error checking media URL ${item.url}:`, error)
                                // Don't add to cleanup anymore
                            }
                        } catch (e) {
                            console.error("Error in media validation:", e)
                        } finally {
                            resolve() // Always resolve to continue with other items
                        }
                    }),
            )

            // Wait for all checks to complete
            await Promise.allSettled(checkPromises)

            // If issues found, show a notification but DON'T take action
            if (potentialIssues.length > 0) {
                console.log(`Found ${potentialIssues.length} potential issues that need manual review`)
                // Just show a notification, don't set items for review/cleanup
                showPopup(`Found ${potentialIssues.length} items that may need review. No action taken.`)
            }

            // Remove the automatic cleanup code entirely
            // if (mediaToCleanup.length > 0) {
            //   const confirmCleanup = window.confirm(...);
            //   if (confirmCleanup) {
            //     setItemsToReview(mediaToCleanup);
            //     ...
            //   }
            // }

            setMediaItems(validMedia)

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
        setTotalPages(Math.ceil(result.length / itemsPerPage))

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

    // Add this function to handle bulk operations
    const handleBulkAction = (type: string, items: MediaItem[]) => {
        setBulkAction({ type, items })
        setBulkActionDialogOpen(true)
    }

    // Function to handle actual deletion after confirmation
    const handleDeleteConfirm = async () => {
        if (!mediaToDelete) return

        try {
            // Get user info for logging
            const { userId, userEmail } = getCurrentUserInfo()

            // Log the deletion attempt with user email
            mediaLogger.mediaDelete(mediaToDelete.id, mediaToDelete.path || mediaToDelete.url, userId)

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

    // Add this function to confirm bulk operations
    const confirmBulkAction = async () => {
        if (!bulkAction) return

        const { type, items } = bulkAction
        const userId = auth.currentUser?.uid || "unknown"

        try {
            // Log the bulk operation
            mediaLogger.mediaBulkOperation(
                type,
                items.length,
                {
                    itemIds: items.map((item) => item.id),
                    itemTypes: items.map((item) => item.type),
                },
                userId,
            )

            // Perform the bulk operation
            if (type === "delete") {
                // Delete each item
                for (const item of items) {
                    await deleteMedia(item)
                }

                // Update the UI
                setMediaItems(mediaItems.filter((item) => !items.includes(item)))
                showPopup(`Successfully deleted ${items.length} items`)
            }
            // Add other bulk operations as needed
        } catch (error) {
            console.error(`Error performing bulk ${type}:`, error)
            mediaLogger.error(`Bulk ${type} operation failed`, error, userId)
            showPopup(`Error performing bulk ${type}`)
        } finally {
            setBulkActionDialogOpen(false)
            setBulkAction(null)
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
        setCurrentPage(1)
    }

    // Add this function to handle manual validation
    const handleManualValidation = async () => {
        try {
            setLoading(true)
            showPopup("Starting media validation check...")

            const issues: MediaItem[] = []

            // Use Promise.allSettled to prevent one failure from stopping the whole process
            const checkPromises = mediaItems.map(
                (item) =>
                    new Promise<void>(async (resolve) => {
                        try {
                            // Skip placeholder images and empty URLs
                            if (!item.url || item.url.includes("placeholder")) {
                                resolve()
                                return
                            }

                            // Use a timeout to prevent hanging
                            const controller = new AbortController()
                            const timeoutId = setTimeout(() => controller.abort(), 5000)

                            try {
                                const response = await fetch(item.url, {
                                    method: "HEAD",
                                    signal: controller.signal,
                                })

                                clearTimeout(timeoutId)

                                if (response.status === 404) {
                                    console.log(`Found 404 for media item: ${item.name} (${item.id})`)
                                    issues.push(item)
                                }
                            } catch (error) {
                                clearTimeout(timeoutId)
                                console.error(`Error checking media URL ${item.url}:`, error)
                                // Only add to issues if it's a network error, not a timeout
                                if (error instanceof TypeError && !error.message.includes("aborted")) {
                                    issues.push(item)
                                }
                            }
                        } catch (e) {
                            console.error("Error in media validation:", e)
                        } finally {
                            resolve() // Always resolve to continue with other items
                        }
                    }),
            )

            // Wait for all checks to complete
            await Promise.allSettled(checkPromises)

            // Update state with found issues
            setPotentialIssues(issues)

            if (issues.length > 0) {
                showPopup(`Found ${issues.length} items that may need review.`)
                setShowIssuesPanel(true)
            } else {
                showPopup("No media issues found.")
            }
        } catch (error) {
            console.error("Error during manual validation:", error)
            showPopup("Error during media validation.")
        } finally {
            setLoading(false)
        }
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
            {/* Add this button to the UI near the top of the component return */}
            {/* Find the section with the Upload Media button and add this: */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Media Manager</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleManualValidation} disabled={loading || isUploading}>
                        <Search className="mr-2 h-4 w-4" />
                        Validate Media
                    </Button>
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

                                            // Log the issue but DO NOT automatically delete
                                            mediaLogger.warn(`Failed to load media image: ${item.name}`, {
                                                id: item.id,
                                                url: item.url,
                                                path: item.path,
                                            })

                                            // Add a visual indicator that this item might have issues
                                            e.currentTarget.parentElement?.classList.add("border-red-300", "border-2")
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

            {/* Add this panel to show issues - add it before the pagination component */}
            {showIssuesPanel && potentialIssues.length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center text-amber-600">
                            <AlertTriangle className="mr-2 h-5 w-5" />
                            Media Issues Found ({potentialIssues.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4">The following media items may have issues. Please review before taking action.</p>

                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {potentialIssues.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden mr-3">
                                            {item.type === "image" ? (
                                                <img
                                                    src="/placeholder.svg?height=48&width=48"
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Film className="h-6 w-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm truncate max-w-[200px]">{item.name}</p>
                                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{item.path || item.url}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                            // Set up for deletion confirmation
                                            setMediaToDelete(item)
                                            setDeleteDialogOpen(true)
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowIssuesPanel(false)
                                    setPotentialIssues([])
                                }}
                            >
                                Close
                            </Button>
                        </div>
                    </CardContent>
                </Card>
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

            {/* Bulk Action Confirmation Dialog */}
            <SimpleConfirmDialog
                isOpen={bulkActionDialogOpen}
                title={`Confirm ${bulkAction?.type}`}
                message={`Are you sure you want to ${bulkAction?.type} ${bulkAction?.items.length} items? This action cannot be undone.`}
                onConfirm={confirmBulkAction}
                onCancel={() => {
                    setBulkActionDialogOpen(false)
                    setBulkAction(null)
                }}
            />
        </div>
    )
}
