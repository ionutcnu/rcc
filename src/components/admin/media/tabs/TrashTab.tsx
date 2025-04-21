"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Film, TrashIcon, ArchiveRestore, Trash2, Search, X, LockIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import type { MediaItem } from "@/lib/firebase/storageService"

interface TrashTabProps {
    deletedMediaItems: MediaItem[]
    handleRestoreClick: (item: MediaItem) => void
    handleDeleteClick: (item: MediaItem, mode: "soft" | "permanent") => void
    handleEmptyTrash: () => void
    activeFilter: "all" | "image" | "video"
    searchQuery: string
    sortOption: string
    sizeFilter: string
}

export default function TrashTab({
                                     deletedMediaItems,
                                     handleRestoreClick,
                                     handleDeleteClick,
                                     handleEmptyTrash,
                                     activeFilter,
                                     searchQuery,
                                     sortOption,
                                     sizeFilter,
                                 }: TrashTabProps) {
    // Local filter state - this allows the trash tab to have its own filter
    const [trashFilter, setTrashFilter] = useState<"all" | "image" | "video">("all")
    const [localSearchQuery, setLocalSearchQuery] = useState("")

    // Initialize local search with parent search on mount
    useEffect(() => {
        setLocalSearchQuery(searchQuery)
    }, [searchQuery])

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(12)
    const [filteredItems, setFilteredItems] = useState<MediaItem[]>([])
    const [paginatedItems, setPaginatedItems] = useState<MediaItem[]>([])
    const [totalPages, setTotalPages] = useState(1)

    // Count items by type for display
    const imageCount = deletedMediaItems.filter((item) => item.type === "image").length
    const videoCount = deletedMediaItems.filter((item) => item.type === "video").length

    // Apply filters when filter criteria change
    useEffect(() => {
        let result = [...deletedMediaItems]

        // Apply type filter
        if (trashFilter !== "all") {
            result = result.filter((item) => item.type === trashFilter)
        }

        // Apply search filter
        if (localSearchQuery) {
            const lowercaseQuery = localSearchQuery.toLowerCase()
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

                const sizeInMB = Number.parseFloat(item.size.replace(/[^0-9.]/g, ""))

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
                    const dateA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0
                    const dateB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0
                    return dateA - dateB
                })
                break
            case "dateDesc":
                result.sort((a, b) => {
                    const dateA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0
                    const dateB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0
                    return dateB - dateA
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
    }, [deletedMediaItems, trashFilter, localSearchQuery, sortOption, sizeFilter, itemsPerPage])

    // Update paginated items when page changes
    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        setPaginatedItems(filteredItems.slice(startIndex, endIndex))
    }, [currentPage, itemsPerPage, filteredItems])

    // Format date helper function
    const formatDate = (date: Date | undefined | null): string => {
        if (!date) return "Unknown date"
        try {
            return new Date(date).toLocaleDateString()
        } catch (error) {
            return "Invalid date"
        }
    }

    // Reset filters function
    const resetFilters = () => {
        setTrashFilter("all")
        setLocalSearchQuery("")
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Trash</CardTitle>
                    <CardDescription>
                        Items in trash will be automatically deleted after 30 days. You can restore items or delete them
                        permanently.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {deletedMediaItems.length === 0 ? (
                        <div className="text-center py-12">
                            <TrashIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-lg font-medium text-gray-900">Trash is empty</h3>
                            <p className="mt-1 text-sm text-gray-500">No items in trash</p>
                        </div>
                    ) : (
                        <>
                            {/* Filter Controls */}
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant={trashFilter === "all" ? "secondary" : "ghost"}
                                        size="sm"
                                        onClick={() => setTrashFilter("all")}
                                    >
                                        All Items ({deletedMediaItems.length})
                                    </Button>
                                    <Button
                                        variant={trashFilter === "image" ? "secondary" : "ghost"}
                                        size="sm"
                                        onClick={() => setTrashFilter("image")}
                                    >
                                        Images ({imageCount})
                                    </Button>
                                    <Button
                                        variant={trashFilter === "video" ? "secondary" : "ghost"}
                                        size="sm"
                                        onClick={() => setTrashFilter("video")}
                                    >
                                        Videos ({videoCount})
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="relative w-full md:w-64">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                        <Input
                                            placeholder="Search trash..."
                                            className="pl-10"
                                            value={localSearchQuery}
                                            onChange={(e) => setLocalSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={resetFilters} className="whitespace-nowrap">
                                        <X className="mr-2 h-4 w-4" />
                                        Reset
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-4">
                                <div className="text-sm text-gray-500">
                                    Showing {paginatedItems.length} of {filteredItems.length} items in trash
                                    {filteredItems.length !== deletedMediaItems.length &&
                                        ` (filtered from ${deletedMediaItems.length} total)`}
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleEmptyTrash}
                                    disabled={deletedMediaItems.length === 0}
                                >
                                    <TrashIcon className="mr-2 h-4 w-4" />
                                    Empty Trash
                                </Button>
                            </div>

                            {filteredItems.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500">No items match your current filters.</p>
                                    <Button variant="ghost" size="sm" onClick={resetFilters} className="mt-2">
                                        Reset Filters
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {paginatedItems.map((item) => (
                                        <Card
                                            key={item.id}
                                            className={`overflow-hidden border-dashed ${item.locked ? "border-amber-300" : ""}`}
                                        >
                                            <div className="aspect-video relative bg-muted/50">
                                                {item.type === "image" ? (
                                                    <Image
                                                        src={item.url || "/placeholder.svg?height=200&width=300"}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover opacity-70"
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                                        onError={(e) => {
                                                            ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=300"
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                                        <Film className="h-8 w-8 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 flex gap-1">
                                                    <Badge variant="destructive">Deleted</Badge>
                                                    {item.locked && (
                                                        <Badge className="bg-amber-500 text-white flex items-center gap-1">
                                                            <LockIcon className="h-3 w-3" />
                                                            Locked
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <CardContent className="p-4">
                                                <div className="flex flex-col space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-medium truncate">{item.name}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              Deleted {item.deletedAt ? formatDate(item.deletedAt) : "recently"}
                            </span>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-2">
                                                        <Button variant="outline" size="sm" onClick={() => handleRestoreClick(item)}>
                                                            <ArchiveRestore className="h-4 w-4 mr-1" />
                                                            Restore
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            onClick={() => handleDeleteClick(item, "permanent")}
                                                            disabled={item.locked}
                                                            title={item.locked ? "Cannot delete locked media" : "Delete Permanently"}
                                                            className={item.locked ? "opacity-50 cursor-not-allowed" : ""}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Delete Permanently</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

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
