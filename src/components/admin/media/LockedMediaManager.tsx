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

export default function LockedMediaManager() {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const { showPopup } = useCatPopup()

    // Dialog state
    const [unlockDialogOpen, setUnlockDialogOpen] = useState(false)
    const [mediaToUnlock, setMediaToUnlock] = useState<MediaItem | null>(null)

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

    // Filter media by search query
    const filteredMedia = searchQuery
        ? mediaItems.filter(
            (item) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.lockedReason && item.lockedReason.toLowerCase().includes(searchQuery.toLowerCase())),
        )
        : mediaItems

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
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search locked media..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredMedia.map((item) => (
                                <Card key={item.id} className="overflow-hidden border-amber-200 border">
                                    <div className="aspect-video relative bg-muted">
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
                                        <div className="absolute top-2 right-2">
                                            <Badge className="bg-amber-500 text-white">Locked</Badge>
                                        </div>
                                    </div>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="truncate">
                                                <p className="font-medium truncate">{item.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {item.type}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">{item.lockedReason}</span>
                                                </div>
                                            </div>
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
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
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
        </div>
    )
}
