"use client"

import { useState, useEffect } from "react"
import { Loader2, UnlockIcon, LockIcon, Film, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { useCatPopup } from "@/components/CatPopupProvider"
import { getAllMedia, type MediaItem, unlockMedia, lockMedia } from "@/lib/firebase/storageService"
import { UnlockConfirmDialog } from "./UnlockConfirmDialog"
import { Checkbox } from "@/components/ui/checkbox"
import { SimpleConfirmDialog } from "@/components/ui/simple-confirm-dialog"

export default function LockedMediaManager() {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const { showPopup } = useCatPopup()

    // Dialog state
    const [unlockDialogOpen, setUnlockDialogOpen] = useState(false)
    const [mediaToUnlock, setMediaToUnlock] = useState<MediaItem | null>(null)

    // Add state for selected items after the existing state declarations
    const [selectedItems, setSelectedItems] = useState<MediaItem[]>([])

    // Add state for bulk unlock dialog
    const [bulkUnlockDialogOpen, setBulkUnlockDialogOpen] = useState(false)

    // Filter media by search query
    const filteredMedia = searchQuery
        ? mediaItems.filter(
            (item) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.lockedReason && item.lockedReason.toLowerCase().includes(searchQuery.toLowerCase())),
        )
        : mediaItems

    const areAllSelected = filteredMedia.length > 0 && selectedItems.length === filteredMedia.length

    useEffect(() => {
        const fetchMedia = async () => {
            try {
                setLoading(true)
                const allMedia = await getAllMedia(true)
                const lockedMedia = allMedia.filter((item) => item.locked)
                setMediaItems(lockedMedia)
            } catch (err) {
                console.error("Error fetching locked media:", err)
                showPopup("Failed to load locked media")
            } finally {
                setLoading(false)
            }
        }

        fetchMedia()
    }, [showPopup])

    const handleUnlockClick = (item: MediaItem) => {
        setMediaToUnlock(item)
        setUnlockDialogOpen(true)
    }

    const handleUnlockConfirm = async () => {
        if (!mediaToUnlock) return

        try {
            const success = await unlockMedia(mediaToUnlock)
            if (success) {
                setMediaItems(mediaItems.filter((media) => media.id !== mediaToUnlock.id))
                showPopup(`Media "${mediaToUnlock.name}" unlocked. It can now be deleted.`)
            } else {
                showPopup("Failed to unlock media")
            }
        } catch (err) {
            console.error("Error unlocking media:", err)
            showPopup("Error unlocking media")
        } finally {
            setUnlockDialogOpen(false)
            setMediaToUnlock(null)
        }
    }

    const handleLockMedia = async (item: MediaItem) => {
        try {
            // Prompt user for a reason
            const reason = window.prompt("Please enter a reason for locking this media:", "Important system media")
            if (reason === null) return // User canceled

            const success = await lockMedia(item, reason)
            if (success) {
                // Update the state
                setMediaItems(
                    mediaItems.map((media) => (media.id === item.id ? { ...media, locked: true, lockedReason: reason } : media)),
                )
                showPopup(`Media "${item.name}" locked. It's now protected from deletion.`)
            } else {
                showPopup("Failed to lock media")
            }
        } catch (err) {
            console.error("Error locking media:", err)
            showPopup("Error locking media")
        }
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
            setSelectedItems([...filteredMedia])
        } else {
            setSelectedItems([])
        }
    }

    const isItemSelected = (item: MediaItem) => {
        return selectedItems.some((selectedItem) => selectedItem.id === item.id)
    }

    const handleBulkUnlock = async () => {
        if (selectedItems.length === 0) return
        setBulkUnlockDialogOpen(true)
    }

    const handleBulkUnlockConfirm = async () => {
        try {
            let successCount = 0
            let failCount = 0

            for (const item of selectedItems) {
                try {
                    const success = await unlockMedia(item)
                    if (success) {
                        successCount++
                    } else {
                        failCount++
                    }
                } catch (err) {
                    console.error(`Error unlocking media item ${item.id}:`, err)
                    failCount++
                }
            }

            // Update the UI - remove unlocked items
            if (successCount > 0) {
                const unlockedItemIds = selectedItems.map((item) => item.id)
                setMediaItems((prevItems) => prevItems.filter((item) => !unlockedItemIds.includes(item.id)))
            }

            // Show result message
            if (failCount === 0) {
                showPopup(`Successfully unlocked ${successCount} items`)
            } else {
                showPopup(`Unlocked ${successCount} items, failed to unlock ${failCount} items`)
            }

            // Clear selected items
            setSelectedItems([])
        } catch (error) {
            console.error("Error performing bulk unlock:", error)
            showPopup("Error performing bulk unlock")
        } finally {
            setBulkUnlockDialogOpen(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <span className="ml-2">Loading locked media...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <LockIcon className="h-5 w-5 text-amber-500" />
                                Locked Media
                            </CardTitle>
                            <CardDescription>These media files are protected from deletion.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder="Search locked media..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            {selectedItems.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBulkUnlock}
                                    className="ml-2 border-amber-500 text-amber-500 hover:bg-amber-50"
                                >
                                    <UnlockIcon className="h-4 w-4 mr-2" />
                                    Unlock {selectedItems.length} Items
                                </Button>
                            )}
                        </div>
                    </div>
                    {selectedItems.length > 0 && (
                        <div className="mt-4">
                            <span className="text-sm text-muted-foreground">{selectedItems.length} items selected</span>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="p-6">
                    {filteredMedia.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <LockIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-lg font-medium text-gray-900">
                                {searchQuery ? "No matching locked media" : "No media files are currently locked"}
                            </h3>
                            <p className="mt-1 text-gray-500">
                                {searchQuery
                                    ? "Try adjusting your search query"
                                    : "Lock important media files to prevent them from being deleted"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <div className="text-sm text-gray-500">Showing {filteredMedia.length} locked media items</div>
                                {filteredMedia.length > 0 && (
                                    <div className="flex items-center gap-2">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {filteredMedia.map((item) => (
                                    <Card key={item.id} className="overflow-hidden border-amber-200 border">
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
                                                    src={item.url || "/placeholder.svg?height=200&width=300"}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                    <Film className="h-8 w-8 text-white" />
                                                </div>
                                            )}
                                            <div className="absolute top-2 left-2">
                                                <Badge className="bg-amber-500 text-white">Locked</Badge>
                                            </div>
                                        </div>
                                        <CardContent className="p-4">
                                            <div className="space-y-3">
                                                <p className="font-medium truncate">{item.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {item.type}
                                                    </Badge>
                                                </div>
                                                {item.lockedReason && (
                                                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">{item.lockedReason}</p>
                                                )}
                                                <div className="flex justify-end pt-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleUnlockClick(item)}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <UnlockIcon className="h-3 w-3" />
                                                        Unlock
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Unlock Confirmation Dialog */}
            {mediaToUnlock && (
                <UnlockConfirmDialog
                    isOpen={unlockDialogOpen}
                    onClose={() => {
                        setUnlockDialogOpen(false)
                        setMediaToUnlock(null)
                    }}
                    onConfirm={handleUnlockConfirm}
                    mediaName={mediaToUnlock.name}
                />
            )}
            {/* Bulk Unlock Confirmation Dialog */}
            <SimpleConfirmDialog
                isOpen={bulkUnlockDialogOpen}
                title="Bulk Unlock Media"
                message={`Are you sure you want to unlock ${selectedItems.length} media items? This will allow them to be deleted.`}
                onConfirm={handleBulkUnlockConfirm}
                onCancel={() => setBulkUnlockDialogOpen(false)}
                confirmText="Unlock All"
                confirmVariant="default"
            />
        </div>
    )
}
