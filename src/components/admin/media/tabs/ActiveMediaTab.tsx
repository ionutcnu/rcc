"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
    Film,
    Search,
    Filter,
    X,
    Download,
    ArchiveIcon,
    Upload,
    Loader2,
    LockIcon,
    Trash2,
    AlertTriangle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import { mediaLogger } from "@/lib/utils/media-logger"
import type { MediaItem } from "@/lib/types/media"
import { BulkLockMediaDialog } from "../BulkLockMediaDialog"
import { Checkbox } from "@/components/ui/checkbox"
import { downloadMedia } from "@/lib/api/mediaClient"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ActiveMediaTabProps {
    mediaItems: MediaItem[]
    activeFilter: "all" | "image" | "video"
    setActiveFilter: (filter: "all" | "image" | "video") => void
    searchQuery: string
    setSearchQuery: (query: string) => void
    showFilters: boolean
    setShowFilters: (show: boolean) => void
    sortOption: string
    setSortOption: (option: string) => void
    sizeFilter: string
    setSizeFilter: (filter: string) => void
    resetFilters: () => void
    handleDeleteClick: (item: MediaItem, mode: "soft" | "permanent") => void
    handleDownload: (item: MediaItem) => void
    handleBulkDownload: (items: MediaItem[]) => void
    handleUpload: () => void
    isUploading: boolean
    imageCount: number
    videoCount: number
    handleLockMedia: (item: MediaItem) => void
    handleUnlockMedia: (item: MediaItem) => void
    showPopup: (message: string) => void
    selectedItems: MediaItem[]
    setSelectedItems: (items: MediaItem[]) => void
    handleBulkAction: (type: string, items: MediaItem[]) => void
    handleBulkLock: (items: MediaItem[], reason: string) => void
}

export default function ActiveMediaTab({
                                           mediaItems,
                                           activeFilter,
                                           setActiveFilter,
                                           searchQuery,
                                           setSearchQuery,
                                           showFilters,
                                           setShowFilters,
                                           sortOption,
                                           setSortOption,
                                           sizeFilter,
                                           setSizeFilter,
                                           resetFilters,
                                           handleDeleteClick,
                                           handleDownload,
                                           handleBulkDownload,
                                           handleUpload,
                                           isUploading,
                                           imageCount,
                                           videoCount,
                                           handleLockMedia,
                                           handleUnlockMedia,
                                           showPopup,
                                           selectedItems,
                                           setSelectedItems,
                                           handleBulkAction,
                                           handleBulkLock,
                                       }: ActiveMediaTabProps) {
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(12)
    const [filteredItems, setFilteredItems] = useState<MediaItem[]>([])
    const [paginatedItems, setPaginatedItems] = useState<MediaItem[]>([])
    const [totalPages, setTotalPages] = useState(1)

    // Bulk lock dialog state
    const [bulkLockDialogOpen, setBulkLockDialogOpen] = useState(false)

    // Add a state to track failed image loads
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

    // Add state for download in progress
    const [isDownloading, setIsDownloading] = useState(false)
    const [downloadingItem, setDownloadingItem] = useState<string | null>(null)

    // Add state for media validation
    const [isValidating, setIsValidating] = useState(false)
    const [validationResults, setValidationResults] = useState<{
        broken: string[]
        missing: string[]
        valid: string[]
        total: number
    } | null>(null)

    const handleBulkLockClick = () => {
        if (selectedItems.length === 0) return
        setBulkLockDialogOpen(true)
    }

    const handleBulkLockConfirm = (reason: string) => {
        handleBulkLock(selectedItems, reason)
        setBulkLockDialogOpen(false)
    }

    const handleSelectItem = (item: MediaItem, isSelected: boolean) => {
        if (isSelected) {
            setSelectedItems([...selectedItems, item])
        } else {
            setSelectedItems(selectedItems.filter((selectedItem) => selectedItem.id !== item.id))
        }
    }

    const handleSelectAll = (isSelected: boolean) => {
        if (isSelected) {
            setSelectedItems([...paginatedItems])
        } else {
            setSelectedItems([])
        }
    }

    const isItemSelected = (item: MediaItem) => {
        return selectedItems.some((selectedItem) => selectedItem.id === item.id)
    }

    const areAllSelected = paginatedItems.length > 0 && selectedItems.length === paginatedItems.length

    // Handle download with the new API
    const handleDownloadClick = async (item: MediaItem) => {
        if (isDownloading) return

        try {
            setIsDownloading(true)
            setDownloadingItem(item.id)

            // Use the new API client function
            await downloadMedia(item.id, item.name)

            // Log the download
            mediaLogger.info(`Downloaded media: ${item.name}`, { id: item.id, type: item.type })

            showPopup(`Downloading ${item.name}...`)
        } catch (error) {
            console.error("Download error:", error)
            showPopup(`Error downloading ${item.name}`)
        } finally {
            setIsDownloading(false)
            setDownloadingItem(null)
        }
    }

    // Handle bulk download with the new API
    const handleBulkDownloadClick = async (items: MediaItem[]) => {
        if (isDownloading || items.length === 0) return

        try {
            setIsDownloading(true)
            showPopup(`Starting download of ${items.length} items...`)

            // Download each item with a small delay to prevent browser throttling
            for (let i = 0; i < items.length; i++) {
                const item = items[i]
                setDownloadingItem(item.id)

                // Use the new API client function
                await downloadMedia(item.id, item.name)

                // Add a small delay between downloads
                if (i < items.length - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 500))
                }
            }

            // Log the bulk download
            mediaLogger.info(`Bulk downloaded ${items.length} media items`, {
                count: items.length,
                types: `${items.filter((i) => i.type === "image").length} images, ${items.filter((i) => i.type === "video").length} videos`,
            })

            showPopup(`Downloaded ${items.length} items`)
        } catch (error) {
            console.error("Bulk download error:", error)
            showPopup("Error downloading files")
        } finally {
            setIsDownloading(false)
            setDownloadingItem(null)
        }
    }

    // Handle media validation
    const handleValidateMedia = async () => {
        if (isValidating) return

        try {
            setIsValidating(true)
            showPopup("Validating media files...")

            const response = await fetch("/api/media/validate")
            if (!response.ok) {
                throw new Error(`Validation failed: ${response.statusText}`)
            }

            const results = await response.json()
            setValidationResults(results)

            // Show results in popup
            const { broken, missing, valid, total } = results
            showPopup(
              `Media validation complete: ${valid.length} valid, ${broken.length} broken, ${missing.length} missing out of ${total} total`,
            )

            // Log the validation
            mediaLogger.info(`Media validation completed`, {
                brokenCount: broken.length,
                missingCount: missing.length,
                validCount: valid.length,
                total,
            })
        } catch (error) {
            console.error("Validation error:", error)
            showPopup("Error validating media files")
        } finally {
            setIsValidating(false)
        }
    }

    // Apply filters when filter criteria change
    useEffect(() => {
        let result = [...mediaItems]

        // Apply type filter
        if (activeFilter !== "all") {
            result = result.filter((item) => item.type === activeFilter)
        }

        // Apply search filter
        if (searchQuery) {
            const lowercaseQuery = searchQuery.toLowerCase()
            result = result.filter(
              (item) =>
                item.name.toLowerCase().includes(lowercaseQuery) ||
                (item.catName && item.catName.toLowerCase().includes(lowercaseQuery)),
            )
        }

        // Apply size filter
        if (sizeFilter !== "all") {
            result = result.filter((item) => {
                if (!item.size) return false

                const sizeInMB = Number.parseFloat(item.size.toString().replace(/[^0-9.]/g, ""))

                switch (sizeFilter) {
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
        switch (sortOption) {
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
                    const sizeA = a.size ? Number.parseFloat(a.size.toString().replace(/[^0-9.]/g, "")) : 0
                    const sizeB = b.size ? Number.parseFloat(b.size.toString().replace(/[^0-9.]/g, "")) : 0
                    return sizeA - sizeB
                })
                break
            case "sizeDesc":
                result.sort((a, b) => {
                    const sizeA = a.size ? Number.parseFloat(a.size.toString().replace(/[^0-9.]/g, "")) : 0
                    const sizeB = b.size ? Number.parseFloat(b.size.toString().replace(/[^0-9.]/g, "")) : 0
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

        // Reset to first page when filters change
        setCurrentPage(1)
    }, [mediaItems, activeFilter, searchQuery, sortOption, sizeFilter, itemsPerPage])

    // Update paginated items when page changes
    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        setPaginatedItems(filteredItems.slice(startIndex, endIndex))
    }, [currentPage, itemsPerPage, filteredItems])

    // Format date helper function
    const formatDate = (date: Date | string | undefined | null): string => {
        if (!date) return "Unknown date"
        try {
            return new Date(date).toLocaleDateString()
        } catch (error) {
            return "Invalid date"
        }
    }

    // Check if a media item is broken based on validation results
    const isMediaBroken = (item: MediaItem): boolean => {
        if (!validationResults) return false
        return validationResults.broken.some((url) => url === item.url)
    }

    return (
      <>
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

                      <div className="flex items-center gap-2">
                          <div className="relative w-full md:w-64">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                              <Input
                                placeholder="Search media..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                              />
                          </div>
                          <Button
                            variant={showFilters ? "secondary" : "outline"}
                            size="icon"
                            onClick={() => setShowFilters(!showFilters)}
                          >
                              <Filter className="h-4 w-4" />
                          </Button>
                          {selectedItems.length > 0 && (
                            <>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleBulkAction("softDelete", selectedItems)}
                                  className="ml-2"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Move {selectedItems.length} to Trash
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleBulkLockClick}
                                  className="ml-2 border-amber-500 text-amber-500 hover:bg-amber-50"
                                >
                                    <LockIcon className="h-4 w-4 mr-2" />
                                    Lock {selectedItems.length} Items
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleBulkDownloadClick(selectedItems)}
                                  className="ml-2 border-blue-500 text-blue-500 hover:bg-blue-50"
                                  disabled={isDownloading}
                                >
                                    {isDownloading ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Download className="h-4 w-4 mr-2" />
                                    )}
                                    Download {selectedItems.length} Items
                                </Button>
                            </>
                          )}
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
                                <Select value={sortOption} onValueChange={setSortOption}>
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
                                <Select value={sizeFilter} onValueChange={setSizeFilter}>
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

          <div className="flex flex-wrap justify-between items-center mt-4 mb-4">
              <div className="text-sm text-gray-500 mb-2 md:mb-0">
                  Showing {paginatedItems.length} of {filteredItems.length} media items
                  {filteredItems.length !== mediaItems.length && ` (filtered from ${mediaItems.length} total)`}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                  {/* Validate Media Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleValidateMedia}
                    disabled={isValidating}
                    className="border-orange-500 text-orange-500 hover:bg-orange-50"
                  >
                      {isValidating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Validating...
                        </>
                      ) : (
                        <>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Validate Media
                        </>
                      )}
                  </Button>

                  {paginatedItems.length > 0 && (
                    <div className="flex items-center gap-2 ml-2">
                        <Checkbox
                          checked={areAllSelected}
                          onCheckedChange={(checked) => handleSelectAll(checked === true)}
                          id="select-all"
                        />
                        <label htmlFor="select-all" className="text-sm cursor-pointer">
                            Select All
                        </label>
                        {selectedItems.length > 0 && (
                          <span className="text-sm text-muted-foreground ml-2">({selectedItems.length} selected)</span>
                        )}
                    </div>
                  )}
              </div>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {paginatedItems.map((item) => (
                  <Card key={item.id} className={`overflow-hidden ${isMediaBroken(item) ? "border-red-500 border-2" : ""}`}>
                      <div className="aspect-video relative bg-muted">
                          <div className="absolute top-2 right-2 z-10">
                              <Checkbox
                                checked={isItemSelected(item)}
                                onCheckedChange={(checked) => handleSelectItem(item, checked === true)}
                                className="bg-white/80 border-gray-400"
                              />
                          </div>
                          {item.type === "image" ? (
                            <Image
                              src={
                                  failedImages.has(item.url)
                                    ? `/api/image-proxy?placeholder=true&width=200&height=300`
                                    : item.url || `/api/image-proxy?placeholder=true&width=200&height=300`
                              }
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                              onError={(e) => {
                                  // Replace broken image with placeholder
                                  const url = item.url || ""

                                  // Add to failed images set to prevent future attempts
                                  setFailedImages((prev) => {
                                      const newSet = new Set(prev)
                                      newSet.add(url)
                                      return newSet
                                  })

                                  // Set placeholder URL directly
                                  ;(e.target as HTMLImageElement).src = `/api/image-proxy?placeholder=true&width=200&height=300`

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
                          {item.locked && (
                            <div className="absolute top-2 left-2">
                                <Badge
                                  className="bg-amber-500 text-white flex items-center gap-1"
                                  title={item.lockedReason || "Protected"}
                                >
                                    <LockIcon className="h-3 w-3" />
                                    Locked
                                </Badge>
                            </div>
                          )}
                          {isMediaBroken(item) && (
                            <div className="absolute bottom-2 left-2">
                                <Badge className="bg-red-500 text-white flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Broken
                                </Badge>
                            </div>
                          )}
                      </div>
                      <CardContent className="p-4">
                          <div className="flex flex-col space-y-2">
                              <div className="flex items-center justify-between">
                                  <TooltipProvider>
                                      <Tooltip>
                                          <TooltipTrigger asChild>
                                              <p className="font-medium truncate cursor-pointer">{item.name}</p>
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom" className="max-w-xs bg-black text-white p-2 rounded">
                                              <div className="text-sm">
                                                  <p className="font-bold">{item.name}</p>
                                                  <p className="text-xs text-gray-300 mt-1">
                                                      {item.type.toUpperCase()} • {item.size || "Unknown size"}
                                                      {item.createdAt ? ` • Added: ${formatDate(item.createdAt)}` : ""}
                                                  </p>
                                              </div>
                                          </TooltipContent>
                                      </Tooltip>
                                  </TooltipProvider>
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
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadClick(item)}
                                    disabled={isDownloading && downloadingItem === item.id}
                                  >
                                      {isDownloading && downloadingItem === item.id ? (
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                      ) : (
                                        <Download className="h-4 w-4 mr-1" />
                                      )}
                                      Download
                                  </Button>
                                  <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleLockMedia(item)}
                                        title="Lock this media to prevent deletion"
                                      >
                                          <LockIcon className="h-4 w-4 text-amber-500" />
                                          <span className="sr-only">Lock Media</span>
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(item, "soft")}>
                                          <ArchiveIcon className="h-4 w-4" />
                                          <span className="sr-only">Move to Trash</span>
                                      </Button>
                                  </div>
                              </div>
                          </div>
                      </CardContent>
                  </Card>
                ))}
            </div>
          )}

          {/* Bulk Lock Dialog */}
          <BulkLockMediaDialog
            isOpen={bulkLockDialogOpen}
            onClose={() => setBulkLockDialogOpen(false)}
            onConfirm={handleBulkLockConfirm}
            itemCount={selectedItems.length}
            items={selectedItems}
          />

          {/* Pagination */}
          {filteredItems.length > 0 && (
            <Pagination
              totalItems={filteredItems.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          )}
      </>
    )
}
