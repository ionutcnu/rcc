"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Loader2, Upload, LockIcon, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { SimpleConfirmDialog } from "@/components/ui/simple-confirm-dialog"
import type { MediaItem } from "@/lib/types/media"
import { mediaLogger } from "@/lib/utils/media-logger"
import { useAuth } from "@/lib/auth/auth-context"
import { getCurrentUserInfo } from "@/lib/utils/user-info"
import { Progress } from "@/components/ui/progress"

// Import our components
import ActiveMediaTab from "./tabs/ActiveMediaTab"
import TrashTab from "./tabs/TrashTab"
import IssuesPanel from "./tabs/IssuesPanel"
// Import the new LockedMediaManager component
import LockedMediaManager from "./LockedMediaManager"
import { LockMediaDialog } from "./LockMediaDialog"

// Define a type for upload progress tracking
interface UploadProgress {
    totalFiles: number
    completedFiles: number
    currentFileProgress: number
    currentFileName: string
    overallProgress: number
    errors: string[]
}

// Add a memory cache with expiration to avoid constant rechecking of invalid URLs
const urlValidationCache = new Map<string, { valid: boolean; timestamp: number }>()
const URL_CACHE_EXPIRY = 1000 * 60 * 60 // 1 hour in milliseconds

// Import the new API client at the top of the file
import {
    fetchActiveMedia,
    fetchLockedMedia,
    fetchTrashMedia,
    lockMediaItem,
    moveMediaToTrash,
    restoreMediaFromTrash,
    deleteMediaPermanently,
    unlockMediaItem,
} from "@/lib/api/mediaClient"

export default function MediaManager() {
    const { user } = useAuth()
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
    const [lockedMediaItems, setLockedMediaItems] = useState<MediaItem[]>([])
    const [deletedMediaItems, setDeletedMediaItems] = useState<MediaItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()
    const [activeTab, setActiveTab] = useState<"active" | "trash" | "locked">("active")
    const [isUploading, setIsUploading] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(false)

    // New state for upload progress
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
    const [showUploadProgress, setShowUploadProgress] = useState(false)

    // Filter and search state
    const [activeFilter, setActiveFilter] = useState<"all" | "image" | "video">("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [sortOption, setSortOption] = useState<string>("dateDesc")
    const [sizeFilter, setSizeFilter] = useState<string>("all")
    const [showFilters, setShowFilters] = useState(false)

    // Delete/restore dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null)
    const [deleteMode, setDeleteMode] = useState<"soft" | "permanent">("soft")
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
    const [mediaToRestore, setMediaToRestore] = useState<MediaItem | null>(null)

    // Bulk action state
    const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false)
    const [bulkAction, setBulkAction] = useState<{ type: string; items: MediaItem[] } | null>(null)

    // Issues panel state
    const [showIssuesPanel, setShowIssuesPanel] = useState(false)
    const [potentialIssues, setPotentialIssues] = useState<MediaItem[]>([])

    // Add state for selected items
    const [selectedItems, setSelectedItems] = useState<MediaItem[]>([])

    // State for bulk operations
    const [isBulkProcessing, setIsBulkProcessing] = useState(false)

    // Declare imageCount and videoCount
    const [imageCount, setImageCount] = useState(0)
    const [videoCount, setVideoCount] = useState(0)

    // State for download in progress
    const [isDownloading, setIsDownloading] = useState(false)



    // Load active media only
    const loadActiveMedia = async () => {
        setIsLoading(true)
        try {
            const activeMediaResponse = await fetchActiveMedia()
            setMediaItems(activeMediaResponse.media)
            setImageCount(activeMediaResponse.imageCount)
            setVideoCount(activeMediaResponse.videoCount)
        } catch (error) {
            console.error("Error loading active media:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Load all counts for header display
    const loadAllCounts = async () => {
        setIsLoading(true)
        console.log("Loading all media counts for headers...")
        
        // Load active media
        try {
            const activeMediaResponse = await fetchActiveMedia()
            setMediaItems(activeMediaResponse.media || [])
            setImageCount(activeMediaResponse.imageCount || 0)
            setVideoCount(activeMediaResponse.videoCount || 0)
            console.log("Active media loaded:", activeMediaResponse.media?.length || 0)
        } catch (error) {
            console.error("Error loading active media:", error)
            setMediaItems([])
            setImageCount(0)
            setVideoCount(0)
        }
        
        // Load locked media
        try {
            const lockedMediaResponse = await fetchLockedMedia()
            setLockedMediaItems(lockedMediaResponse.media || [])
        } catch (error) {
            console.error("Error loading locked media:", error)
        }
        
        // Load trash media
        try {
            const trashMediaResponse = await fetchTrashMedia()
            setDeletedMediaItems(trashMediaResponse.media || [])
        } catch (error) {
            console.error("Error loading trash media:", error)
        }
        
        setIsLoading(false)
    }

    // Load locked media only
    const loadLockedMedia = async () => {
        setIsLoading(true)
        try {
            const lockedMediaResponse = await fetchLockedMedia()
            setLockedMediaItems(lockedMediaResponse.media || [])
        } catch (error) {
            console.error("Error loading locked media:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Load trash media only
    const loadTrashMedia = async () => {
        setIsLoading(true)
        try {
            const trashMediaResponse = await fetchTrashMedia()
            setDeletedMediaItems(trashMediaResponse.media || [])
        } catch (error) {
            console.error("Error loading trash media:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Force refresh functions (reload regardless of existing data)
    const forceRefreshActiveMedia = async () => {
        setIsLoading(true)
        try {
            const activeMediaResponse = await fetchActiveMedia()
            setMediaItems(activeMediaResponse.media || [])
            setImageCount(activeMediaResponse.imageCount || 0)
            setVideoCount(activeMediaResponse.videoCount || 0)
        } catch (error) {
            console.error("Error refreshing active media:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const forceRefreshLockedMedia = async () => {
        setIsLoading(true)
        try {
            const lockedMediaResponse = await fetchLockedMedia()
            setLockedMediaItems(lockedMediaResponse.media || [])
        } catch (error) {
            console.error("Error refreshing locked media:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const forceRefreshTrashMedia = async () => {
        setIsLoading(true)
        try {
            const trashMediaResponse = await fetchTrashMedia()
            setDeletedMediaItems(trashMediaResponse.media || [])
        } catch (error) {
            console.error("Error refreshing trash media:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Refresh all media data (for upload completion)
    const refreshMediaData = async () => {
        setIsLoading(true)
        try {
            const [activeMediaResponse, lockedMediaResponse, trashMediaResponse] = await Promise.all([
                fetchActiveMedia(),
                fetchLockedMedia(),
                fetchTrashMedia()
            ])
            
            setMediaItems(activeMediaResponse.media || [])
            setLockedMediaItems(lockedMediaResponse.media || [])
            setDeletedMediaItems(trashMediaResponse.media || [])
            
            // Update counts from API responses
            setImageCount(activeMediaResponse.imageCount || 0)
            setVideoCount(activeMediaResponse.videoCount || 0)
        } catch (error) {
            console.error("Error refreshing media data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Force refresh current tab data
    const forceRefreshCurrentTab = async () => {
        switch (activeTab) {
            case "active":
                await forceRefreshActiveMedia()
                break
            case "locked":
                await forceRefreshLockedMedia()
                break
            case "trash":
                await forceRefreshTrashMedia()
                break
        }
    }

    // Real-time updates when page becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                loadActiveMedia()
            }
        }
        
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [])

    // Load data when tab changes
    useEffect(() => {
        if (activeTab === "locked") {
            loadLockedMedia()
        } else if (activeTab === "trash") {
            loadTrashMedia()
        }
    }, [activeTab])



    // State for lock dialog
    const [lockDialogOpen, setLockDialogOpen] = useState(false)
    const [mediaToLock, setMediaToLock] = useState<MediaItem | null>(null)

    // Fix: Use a ref to track if the component is mounted to prevent duplicate API calls
    const isMounted = React.useRef(false)
    const hasLoadedMedia = React.useRef({
        active: false,
        locked: false,
        trash: false,
    })

    // Inside your MediaManager component, find the useEffect that loads media
    // and replace it with this:
    useEffect(() => {
        // Fix: Only load media once when the component mounts
        if (isMounted.current) return
        isMounted.current = true

        const loadMedia = async () => {
            setIsLoading(true)
            try {
                // Use the new API client instead of direct Firebase access
                const result = await fetchActiveMedia()

                setMediaItems(result.media)
                setImageCount(result.imageCount)
                setVideoCount(result.videoCount)
                hasLoadedMedia.current.active = true
            } catch (error) {
                console.error("Error loading media:", error)
                toast({ 
                    variant: "destructive",
                    description: "Error loading media. Please try again." 
                })
            } finally {
                setIsLoading(false)
                setLoading(false)
            }
        }

        loadMedia()
    }, [toast])

    // The rest of the component remains the same

    // Add the beforeunload event listener in a useEffect hook after the existing useEffect hooks

    // Add this useEffect after the existing useEffect hooks (around line 85, after the fetchMedia useEffect)
    useEffect(() => {
        // Function to handle beforeunload event
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isUploading) {
                // Standard way to show a confirmation dialog when leaving the page
                const message =
                  "You have an upload in progress. If you leave now, your upload will be canceled. Are you sure you want to leave?"
                e.preventDefault()
                e.returnValue = message // For older browsers
                return message // For modern browsers
            }
        }

        // Add event listener when component mounts or isUploading changes
        window.addEventListener("beforeunload", handleBeforeUnload)

        // Clean up event listener when component unmounts or isUploading changes
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload)
        }
    }, [isUploading]) // Only re-run effect when isUploading changes

    // Clear selected items when tab changes
    useEffect(() => {
        // Clear selected items when changing tabs
        setSelectedItems([])
    }, [activeTab])

    // Function to handle delete button click
    const handleDeleteClick = (item: MediaItem, mode: "soft" | "permanent" = "soft") => {
        setMediaToDelete(item)
        setDeleteMode(mode)
        setDeleteDialogOpen(true)
    }

    // Function to handle restore button click
    const handleRestoreClick = (item: MediaItem) => {
        setMediaToRestore(item)
        setRestoreDialogOpen(true)
    }

    // Function to handle bulk operations
    const handleBulkAction = (type: string, items: MediaItem[]) => {
        setBulkAction({ type, items })
        setBulkActionDialogOpen(true)
    }

    // Function to handle bulk lock operation
    const handleBulkLock = async (items: MediaItem[], reason: string) => {
        if (items.length === 0) return

        const userId = user?.uid || "unknown"

        try {
            setIsBulkProcessing(true)
            toast({ description: `Locking ${items.length} items...` })

            // Log the bulk lock operation
            mediaLogger.mediaBulkOperation(
              "lock",
              items.length,
              {
                  itemIds: items.map((item) => item.id),
                  itemTypes: items.map((item) => item.type),
                  reason: reason,
              },
              userId,
            )

            let successCount = 0
            let failCount = 0
            const errors: string[] = []

            // Process each item
            for (const item of items) {
                try {
                    // Use the new API client function
                    const result = await lockMediaItem(item.id, reason)

                    if (result.success) {
                        successCount++
                    } else {
                        failCount++
                        errors.push(`Failed to lock ${item.name || item.id}: ${result.error}`)
                    }
                } catch (err: any) {
                    console.error(`Error locking media item ${item.id}:`, err)
                    failCount++
                    errors.push(`Error locking ${item.name || item.id}: ${err.message || "Unknown error"}`)
                }
            }

            // Update the UI - remove locked items from the active view
            if (successCount > 0) {
                const lockedItemIds = items.map((item) => item.id)
                setMediaItems((prevItems) => prevItems.filter((item) => !lockedItemIds.includes(item.id)))
                setLockedMediaItems((prevItems) => [
                    ...prevItems,
                    ...items.map((item) => ({ ...item, locked: true, lockedReason: reason })),
                ])
            }

            // Show result message
            if (failCount === 0) {
                toast({ description: `Successfully locked ${successCount} items` })
            } else {
                toast({ 
                    variant: "destructive",
                    description: `Locked ${successCount} items, failed to lock ${failCount} items` 
                })
                console.error("Lock errors:", errors)
            }

            // Clear selected items
            setSelectedItems([])
        } catch (error: any) {
            console.error("Error performing bulk lock:", error)
            mediaLogger.error("Bulk lock operation failed", error, userId)
            toast({ 
                variant: "destructive",
                description: `Error performing bulk lock: ${error.message || "Unknown error"}` 
            })
        } finally {
            setBulkActionDialogOpen(false)
            setBulkAction(null)
            setIsBulkProcessing(false)
        }
    }

    // Function to handle locking media
    const handleLockMedia = (item: MediaItem) => {
        // Set the state for our custom dialog
        setMediaToLock(item)
        setLockDialogOpen(true)
    }

    // Function to handle lock confirmation
    const handleLockConfirm = async (reason: string) => {
        if (!mediaToLock) return

        try {
            // Show loading state
            toast({ description: "Locking media..." })

            console.log(`Attempting to lock media: ${mediaToLock.id} with reason: ${reason}`)

            // Use the API client function
            const result = await lockMediaItem(mediaToLock.id, reason)

            if (result.success && result.media) {
                console.log("Lock successful, updated media:", result.media)

                // Update the state
                setMediaItems((prev) => prev.filter((media) => media.id !== mediaToLock.id))
                setLockedMediaItems((prev) => [...prev, { ...mediaToLock, locked: true, lockedReason: reason }])

                toast({ description: `Media "${mediaToLock.name}" locked. It's now protected from deletion.` })
            } else {
                console.error("Failed to lock media:", result.error)
                toast({ 
                    variant: "destructive",
                    description: `Failed to lock media: ${result.error || "Unknown error"}` 
                })
            }
        } catch (err) {
            console.error("Error locking media:", err)
            toast({ 
                variant: "destructive",
                description: "Error locking media" 
            })
        } finally {
            // Close the dialog
            setLockDialogOpen(false)
            setMediaToLock(null)
        }
    }

    // Function to handle unlocking media
    const handleUnlockMedia = async (item: MediaItem) => {
        try {
            // Confirm before unlocking
            const confirmed = window.confirm(
              `Are you sure you want to unlock "${item.name}"? This will allow it to be deleted.`,
            )
            if (!confirmed) return

            // Replace with API client function
            const result = await unlockMediaItem(item.id)

            if (result.success) {
                // Update the state
                setLockedMediaItems(lockedMediaItems.filter((media) => media.id !== item.id))
                setMediaItems([...mediaItems, { ...item, locked: false, lockedReason: undefined }])
                toast({ description: `Media "${item.name}" unlocked. It can now be deleted.` })
            } else {
                toast({ 
                    variant: "destructive",
                    description: `Failed to unlock media: ${result.error || "Unknown error"}` 
                })
            }
        } catch (err) {
            console.error("Error unlocking media:", err)
            toast({ 
                variant: "destructive",
                description: "Error unlocking media" 
            })
        }
    }

    // Function to handle actual deletion after confirmation
    const handleDeleteConfirm = async () => {
        if (!mediaToDelete) return

        try {
            // Show loading state
            toast({ description: deleteMode === "soft" ? "Moving media to trash..." : "Permanently deleting media..." })

            if (deleteMode === "soft") {
                // Use the existing API client function
                console.log("Using API to move media to trash:", mediaToDelete.id)
                const result = await moveMediaToTrash(mediaToDelete.id)

                if (result.success) {
                    // Move the item from active to deleted
                    setMediaItems((prev) => prev.filter((media) => media.id !== mediaToDelete.id))
                    setDeletedMediaItems((prev) => [{ ...mediaToDelete, deleted: true, deletedAt: new Date() }, ...prev])
                    toast({ description: "Media moved to trash" })
                } else {
                    // Check if the media is locked
                    if (result.locked) {
                        toast({ 
                            variant: "destructive",
                            description: `Cannot move locked media to trash: ${result.lockedReason || "Unknown reason"}` 
                        })
                    } else {
                        toast({ 
                            variant: "destructive",
                            description: `Failed to move media to trash: ${result.error || "Unknown error"}` 
                        })
                    }
                }
            } else {
                // Use the new API client function for permanent deletion
                console.log("Using API to permanently delete media:", mediaToDelete.id)
                const result = await deleteMediaPermanently(mediaToDelete.id)

                if (result.success) {
                    // Remove the deleted item from both states
                    setMediaItems((prev) => prev.filter((media) => media.id !== mediaToDelete.id))
                    setDeletedMediaItems((prev) => prev.filter((media) => media.id !== mediaToDelete.id))
                    toast({ description: "Media permanently deleted" })
                } else {
                    // Check if the media is locked
                    if (result.locked) {
                        toast({ 
                            variant: "destructive",
                            description: `Cannot delete locked media: ${result.lockedReason || "Unknown reason"}` 
                        })
                    } else {
                        toast({ 
                            variant: "destructive",
                            description: `Failed to delete media: ${result.error || "Unknown error"}` 
                        })
                    }
                }
            }
        } catch (err) {
            console.error("Error deleting media:", err)
            toast({ 
                variant: "destructive",
                description: "Error deleting media" 
            })
        } finally {
            setDeleteDialogOpen(false)
            setMediaToDelete(null)
        }
    }

    // Function to handle actual restoration after confirmation
    const handleRestoreConfirm = async () => {
        if (!mediaToRestore) return

        try {
            // Show loading state
            toast({ description: "Restoring media..." })

            console.log(`Attempting to restore media: ${mediaToRestore.id}`)

            // Use the API client function
            const result = await restoreMediaFromTrash(mediaToRestore.id)

            if (result.success) {
                // Move the item from deleted to active
                setDeletedMediaItems((prev) => prev.filter((media) => media.id !== mediaToRestore.id))
                setMediaItems((prev) => [
                    { ...mediaToRestore, deleted: false, deletedAt: undefined, deletedBy: undefined },
                    ...prev,
                ])
                toast({ description: "Media restored successfully" })
            } else {
                console.error("Failed to restore media:", result.error)
                toast({ 
                    variant: "destructive",
                    description: `Failed to restore media: ${result.error || "Unknown error"}` 
                })
            }
        } catch (err) {
            console.error("Error restoring media:", err)
            toast({ 
                variant: "destructive",
                description: "Error restoring media" 
            })
        } finally {
            setRestoreDialogOpen(false)
            setMediaToRestore(null)
        }
    }

    // Function to confirm bulk operations
    const confirmBulkAction = async () => {
        if (!bulkAction) return

        const { type, items } = bulkAction
        const userId = user?.uid || "unknown"

        try {
            setIsBulkProcessing(true)

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
                // Delete each item using the API
                let successCount = 0
                let failCount = 0
                const errors: string[] = []

                for (const item of items) {
                    try {
                        const result = await deleteMediaPermanently(item.id)
                        if (result.success) {
                            successCount++
                        } else {
                            failCount++
                            errors.push(`Failed to delete ${item.name || item.id}: ${result.error || "Unknown error"}`)
                        }
                    } catch (err) {
                        failCount++
                        errors.push(
                          `Error deleting ${item.name || item.id}: ${err instanceof Error ? err.message : "Unknown error"}`,
                        )
                    }
                }

                // Update the UI
                setDeletedMediaItems((prev) => prev.filter((item) => !items.some((i) => i.id === item.id)))

                // Show result message
                if (failCount === 0) {
                    toast({ description: `Successfully deleted ${successCount} items` })
                } else {
                    toast({ 
                        variant: "destructive",
                        description: `Deleted ${successCount} items, failed to delete ${failCount} items` 
                    })
                    console.error("Delete errors:", errors)
                }
            } else if (type === "softDelete") {
                // Soft delete each item
                for (const item of items) {
                    await moveMediaToTrash(item.id)
                }

                // Update the UI
                setMediaItems(mediaItems.filter((item) => !items.includes(item)))
                setDeletedMediaItems([
                    ...items.map((item) => ({ ...item, deleted: true, deletedAt: new Date() })),
                    ...deletedMediaItems,
                ])
                toast({ description: `Successfully moved ${items.length} items to trash` })
            } else if (type === "restore") {
                // Restore each item
                for (const item of items) {
                    await restoreMediaFromTrash(item.id)
                }

                // Update the UI
                setDeletedMediaItems(deletedMediaItems.filter((item) => !items.includes(item)))
                setMediaItems([
                    ...items.map((item) => ({ ...item, deleted: false, deletedAt: undefined, deletedBy: undefined })),
                    ...mediaItems,
                ])
                toast({ description: `Successfully restored ${items.length} items` })
            }

            // Clear selected items after operation
            setSelectedItems([])
        } catch (error) {
            console.error(`Error performing bulk ${type}:`, error)
            mediaLogger.error(`Bulk ${type} operation failed`, error, userId)
            toast({ 
                variant: "destructive",
                description: `Error performing bulk ${type}` 
            })
        } finally {
            setBulkActionDialogOpen(false)
            setBulkAction(null)
            setIsBulkProcessing(false)
        }
    }

    // Enhanced upload function with progress tracking
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

                // Initialize progress tracking
                setUploadProgress({
                    totalFiles: files.length,
                    completedFiles: 0,
                    currentFileProgress: 0,
                    currentFileName: files[0].name,
                    overallProgress: 0,
                    errors: [],
                })
                setShowUploadProgress(true)

                // Upload each file
                for (let i = 0; i < files.length; i++) {
                    const file = files[i]

                    // Update current file info
                    setUploadProgress((prev) =>
                      prev
                        ? {
                            ...prev,
                            currentFileName: file.name,
                            currentFileProgress: 0,
                        }
                        : null,
                    )

                    try {
                        // Determine folder based on file type
                        const folder = file.type.startsWith("image/") ? "images" : "videos"

                        // Create form data for the upload
                        const formData = new FormData()
                        formData.append("file", file)
                        formData.append("folder", folder)

                        // Use XMLHttpRequest instead of fetch to track upload progress
                        const xhr = new XMLHttpRequest()

                        // Set up progress tracking
                        xhr.upload.addEventListener("progress", (event) => {
                            if (event.lengthComputable) {
                                const progress = event.loaded / event.total
                                setUploadProgress((prev) => {
                                    if (!prev) return null

                                    const fileWeight = 1 / prev.totalFiles
                                    const currentFileContribution = progress * fileWeight
                                    const completedFilesContribution = prev.completedFiles * fileWeight

                                    return {
                                        ...prev,
                                        currentFileProgress: progress,
                                        overallProgress: Math.round((completedFilesContribution + currentFileContribution) * 100),
                                    }
                                })
                            }
                        })

                        // Create a promise to handle the XHR response
                        const uploadPromise = new Promise<void>((resolve, reject) => {
                            xhr.onload = () => {
                                if (xhr.status >= 200 && xhr.status < 300) {
                                    resolve()
                                } else {
                                    reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`))
                                }
                            }

                            xhr.onerror = () => {
                                reject(new Error("Network error occurred during upload"))
                            }
                        })

                        // Open and send the request
                        xhr.open("POST", "/api/media/upload", true)
                        xhr.send(formData)

                        // Wait for the upload to complete
                        await uploadPromise

                        // Update completed files count
                        setUploadProgress((prev) => {
                            if (!prev) return null
                            const newCompletedFiles = prev.completedFiles + 1
                            return {
                                ...prev,
                                completedFiles: newCompletedFiles,
                                overallProgress: Math.round((newCompletedFiles / prev.totalFiles) * 100),
                            }
                        })
                    } catch (err) {
                        console.error(`Error uploading file ${file.name}:`, err)

                        // Add to errors list
                        setUploadProgress((prev) => {
                            if (!prev) return null
                            return {
                                ...prev,
                                errors: [
                                    ...prev.errors,
                                    `Failed to upload ${file.name}: ${err instanceof Error ? err.message : "Unknown error"}`,
                                ],
                            }
                        })
                    }
                }

                // Refresh media data immediately
                await refreshMediaData()

                // Keep progress visible for a moment so user can see completion
                setTimeout(() => {
                    setShowUploadProgress(false)
                    setUploadProgress(null)
                }, 3000)
            } catch (err) {
                console.error("Error in upload process:", err)
                toast({ 
                    variant: "destructive",
                    description: "Error uploading files" 
                })
                setShowUploadProgress(false)
            } finally {
                setIsUploading(false)
            }
        }

        // Trigger file selection
        input.click()
    }

    // Function to handle direct file download
    const handleDirectDownload = async (item: MediaItem) => {
        if (isDownloading) return

        try {
            setIsDownloading(true)
            toast({ description: `Downloading ${item.name}...` })

            // Fetch the file directly from Firebase
            const response = await fetch(item.url)

            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
            }

            // Get the file as a blob
            const blob = await response.blob()

            // Create a URL for the blob
            const blobUrl = URL.createObjectURL(blob)

            // Create a temporary anchor element
            const a = document.createElement("a")
            a.href = blobUrl
            a.download = item.name // Set the filename
            a.style.display = "none"

            // Add to document, click it, and remove it
            document.body.appendChild(a)
            a.click()

            // Clean up
            setTimeout(() => {
                document.body.removeChild(a)
                URL.revokeObjectURL(blobUrl)
                toast({ description: `Downloaded ${item.name}` })
            }, 100)
        } catch (error) {
            console.error("Download error:", error)
            toast({ 
                variant: "destructive",
                description: `Error downloading ${item.name}` 
            })

            // Fallback to direct URL if fetch fails
            try {
                const a = document.createElement("a")
                a.href = item.url
                a.download = item.name
                a.target = "_blank"
                a.click()
            } catch (fallbackError) {
                console.error("Fallback download error:", fallbackError)
            }
        } finally {
            setIsDownloading(false)
        }
    }

    // Function to handle bulk download
    const handleBulkDownload = async (items: MediaItem[]) => {
        if (isDownloading || items.length === 0) return

        try {
            setIsDownloading(true)
            toast({ description: `Starting download of ${items.length} items...` })

            // Log the bulk download operation
            const { userId } = getCurrentUserInfo()
            mediaLogger.info(
              `Bulk download initiated for ${items.length} items`,
              {
                  itemIds: items.map((item) => item.id),
                  itemCount: items.length,
              },
              userId,
            )

            // Create a counter for completed downloads
            let completedCount = 0
            let failedCount = 0

            // Function to download a single item
            const downloadItem = async (item: MediaItem) => {
                try {
                    // Fetch the file directly from Firebase
                    const response = await fetch(item.url)

                    if (!response.ok) {
                        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
                    }

                    // Get the file as a blob
                    const blob = await response.blob()

                    // Create a URL for the blob
                    const blobUrl = URL.createObjectURL(blob)

                    // Create a temporary anchor element
                    const a = document.createElement("a")
                    a.href = blobUrl
                    a.download = item.name // Set the filename
                    a.style.display = "none"

                    // Add to document, click it, and remove it
                    document.body.appendChild(a)
                    a.click()

                    // Clean up
                    setTimeout(() => {
                        document.body.removeChild(a)
                        URL.revokeObjectURL(blobUrl)
                    }, 100)

                    completedCount++

                    // Update progress every 5 items or when all are complete
                    if (completedCount % 5 === 0 || completedCount === items.length) {
                        toast({ description: `Downloaded ${completedCount} of ${items.length} items...` })
                    }

                    return true
                } catch (error) {
                    console.error(`Error downloading ${item.name}:`, error)
                    failedCount++
                    return false
                }
            }

            // Process items in batches of 3 to avoid overwhelming the browser
            const batchSize = 3
            for (let i = 0; i < items.length; i += batchSize) {
                const batch = items.slice(i, i + batchSize)
                await Promise.all(batch.map((item) => downloadItem(item)))

                // Small delay between batches to give the browser time to process
                if (i + batchSize < items.length) {
                    await new Promise((resolve) => setTimeout(resolve, 500))
                }
            }

            // Final status message
            if (failedCount === 0) {
                toast({ description: `Successfully downloaded all ${items.length} items` })
            } else {
                toast({ 
                    variant: "destructive",
                    description: `Downloaded ${completedCount} items, failed to download ${failedCount} items` 
                })
            }

            // Log completion
            mediaLogger.info(
              `Bulk download completed: ${completedCount} successful, ${failedCount} failed`,
              {
                  successCount: completedCount,
                  failCount: failedCount,
                  totalCount: items.length,
              },
              userId,
            )
        } catch (error) {
            console.error("Bulk download error:", error)
            toast({ 
                variant: "destructive",
                description: "Error downloading files" 
            })

            // Log error
            mediaLogger.error(
              "Bulk download operation failed",
              { error: error instanceof Error ? error.message : "Unknown error" },
              user?.uid || "unknown",
            )
        } finally {
            setIsDownloading(false)
        }
    }

    const handleManualValidation = async () => {
        try {
            setLoading(true)
            toast({ description: "Starting media validation check..." })

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
                toast({ description: `Found ${issues.length} items that may need review.` })
                setShowIssuesPanel(true)
            } else {
                toast({ description: "No media issues found." })
            }
        } catch (error) {
            console.error("Error during manual validation:", error)
            toast({ 
                variant: "destructive",
                description: "Error during media validation." 
            })
        } finally {
            setLoading(false)
        }
    }

    const handleEmptyTrashError = () => {
        if (deletedMediaItems.length === 0) {
            toast({ description: "Trash is already empty" })
        }
    }

    const handleEmptyTrash = () => {
        if (deletedMediaItems.length === 0) {
            toast({ description: "Trash is already empty" })
            return
        }

        //t up bulk action for confirmation
        setBulkAction({
            type: "delete",
            items: deletedMediaItems,
        })
        setBulkActionDialogOpen(true)
    }

    const resetFilters = () => {
        setSearchQuery("")
        setActiveFilter("all")
        setSortOption("dateDesc")
        setSizeFilter("all")
    }

    // Initial load - only active media for now
    const fetchMedia = async () => {
        setIsLoading(true)
        try {
            await loadActiveMedia()
        } catch (error) {
            console.error("Error loading media:", error)
            toast({ 
                variant: "destructive",
                description: "Error loading media. Please try again." 
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
      <div className="space-y-6">
          <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Media Manager</h1>
              <div className="flex gap-2">
                  <Button onClick={handleUpload} disabled={isUploading || isBulkProcessing}>
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

          {/* Processing Indicator */}
          {isBulkProcessing && (
            <Alert className="mb-6" variant="default">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500 mr-2" />
                <AlertTitle>Processing</AlertTitle>
                <AlertDescription>Processing bulk operation. Please wait...</AlertDescription>
            </Alert>
          )}

          {/* Upload Progress Overlay */}
          {showUploadProgress && uploadProgress && (
            <div className="fixed inset-x-0 bottom-0 p-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-4 max-w-md mx-auto">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Uploading Files</h3>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowUploadProgress(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Overall Progress</span>
                                <span>
                    {uploadProgress.completedFiles} of {uploadProgress.totalFiles} files (
                                    {uploadProgress.overallProgress}%)
                  </span>
                            </div>
                            <Progress value={uploadProgress.overallProgress} className="h-2" />
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-1">
                  <span className="truncate max-w-[200px]" title={uploadProgress.currentFileName}>
                    {uploadProgress.currentFileName}
                  </span>
                                <span>{Math.round(uploadProgress.currentFileProgress * 100)}%</span>
                            </div>
                            <Progress value={Math.round(uploadProgress.currentFileProgress * 100)} className="h-2" />
                        </div>

                        {uploadProgress.errors.length > 0 && (
                          <div className="mt-2 text-sm text-red-500">
                              <p className="font-medium">Errors ({uploadProgress.errors.length}):</p>
                              <ul className="list-disc pl-5 mt-1 max-h-20 overflow-y-auto">
                                  {uploadProgress.errors.map((error, index) => (
                                    <li key={index} className="truncate">
                                        {error}
                                    </li>
                                  ))}
                              </ul>
                          </div>
                        )}
                    </div>
                </div>
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "active" | "trash" | "locked")}
            className="w-full"
          >
              <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="active" className="flex items-center gap-2">
                      Active Media ({mediaItems.length})
                  </TabsTrigger>
                  <TabsTrigger value="locked" className="flex items-center gap-2">
                      <LockIcon className="h-4 w-4" />
                      Locked ({lockedMediaItems.length})
                  </TabsTrigger>
                  <TabsTrigger value="trash" className="flex items-center gap-2">
                      Trash ({deletedMediaItems.length})
                  </TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                  <ActiveMediaTab
                    mediaItems={mediaItems}
                    activeFilter={activeFilter}
                    setActiveFilter={setActiveFilter}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    sortOption={sortOption}
                    setSortOption={setSortOption}
                    sizeFilter={sizeFilter}
                    setSizeFilter={setSizeFilter}
                    resetFilters={resetFilters}
                    handleDeleteClick={handleDeleteClick}
                    handleDownload={handleDirectDownload}
                    handleBulkDownload={handleBulkDownload}
                    handleUpload={handleUpload}
                    isUploading={isUploading}
                    imageCount={imageCount}
                    videoCount={videoCount}
                    handleLockMedia={handleLockMedia}
                    handleUnlockMedia={handleUnlockMedia}
                    showPopup={(message: string) => toast({ description: message })}
                    selectedItems={selectedItems}
                    setSelectedItems={setSelectedItems}
                    handleBulkAction={handleBulkAction}
                    handleBulkLock={handleBulkLock}
                  />
              </TabsContent>

              <TabsContent value="locked">
                  {/* Use the useMedia hook in the LockedMediaManager component instead of fetching here */}
                  <LockedMediaManager />
              </TabsContent>

              <TabsContent value="trash">
                  <TrashTab
                    deletedMediaItems={deletedMediaItems}
                    handleRestoreClick={handleRestoreClick}
                    handleDeleteClick={handleDeleteClick}
                    handleEmptyTrash={handleEmptyTrash}
                    activeFilter={activeFilter}
                    searchQuery={searchQuery}
                    sortOption={sortOption}
                    sizeFilter={sizeFilter}
                  />
              </TabsContent>
          </Tabs>

          {/* Issues Panel */}
          {showIssuesPanel && potentialIssues.length > 0 && (
            <IssuesPanel
              issues={potentialIssues}
              onClose={() => {
                  setShowIssuesPanel(false)
                  setPotentialIssues([])
              }}
              onMoveToTrash={(item) => {
                  setMediaToDelete(item)
                  setDeleteMode("soft")
                  setDeleteDialogOpen(true)
              }}
            />
          )}

          {/* Delete Confirmation Dialog */}
          <SimpleConfirmDialog
            isOpen={deleteDialogOpen}
            title={deleteMode === "soft" ? "Move to Trash" : "Delete Permanently"}
            message={
                deleteMode === "soft"
                  ? `Are you sure you want to move ${mediaToDelete?.name || "this media"} to trash? You can restore it later.`
                  : `Are you sure you want to permanently delete ${mediaToDelete?.name || "this media"}? This action cannot be undone.`
            }
            onConfirm={handleDeleteConfirm}
            onCancel={() => {
                setDeleteDialogOpen(false)
                setMediaToDelete(null)
            }}
            confirmText={deleteMode === "soft" ? "Move to Trash" : "Delete Permanently"}
            confirmVariant={deleteMode === "soft" ? "default" : "destructive"}
          />

          {/* Restore Confirmation Dialog */}
          <SimpleConfirmDialog
            isOpen={restoreDialogOpen}
            title="Restore Media"
            message={`Are you sure you want to restore ${mediaToRestore?.name || "this media"}?`}
            onConfirm={handleRestoreConfirm}
            onCancel={() => {
                setRestoreDialogOpen(false)
                setMediaToRestore(null)
            }}
            confirmText="Restore"
          />

          {/* Lock Media Dialog */}
          <LockMediaDialog
            isOpen={lockDialogOpen}
            onClose={() => {
                setLockDialogOpen(false)
                setMediaToLock(null)
            }}
            onConfirm={handleLockConfirm}
            mediaName={mediaToLock?.name || ""}
          />

          {/* Bulk Action Confirmation Dialog */}
          <SimpleConfirmDialog
            isOpen={bulkActionDialogOpen}
            title={`Confirm ${
              bulkAction?.type === "delete"
                ? "Permanent Delete"
                : bulkAction?.type === "softDelete"
                  ? "Move to Trash"
                  : "Restore"
            }`}
            message={
                bulkAction?.type === "delete"
                  ? `Are you sure you want to permanently delete ${bulkAction?.items.length} items? This action cannot be undone.`
                  : bulkAction?.type === "softDelete"
                    ? `Are you sure you want to move ${bulkAction?.items.length} items to trash? You can restore them later.`
                    : `Are you sure you want to restore ${bulkAction?.items.length} items?`
            }
            onConfirm={confirmBulkAction}
            onCancel={() => {
                setBulkActionDialogOpen(false)
                setBulkAction(null)
            }}
            confirmVariant={bulkAction?.type === "delete" ? "destructive" : "default"}
            confirmText={
                bulkAction?.type === "delete"
                  ? "Delete Permanently"
                  : bulkAction?.type === "softDelete"
                    ? "Move to Trash"
                    : "Restore"
            }
          />
      </div>
    )
}
