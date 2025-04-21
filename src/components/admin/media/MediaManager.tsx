"use client"

import { useState, useEffect } from "react"
import { Loader2, AlertCircle, Upload, LockIcon, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCatPopup } from "@/components/CatPopupProvider"
import { SimpleConfirmDialog } from "@/components/simple-confirm-dialog"
import {
    getAllMedia,
    getDeletedMedia,
    type MediaItem,
    deleteMedia,
    uploadFileAndGetURL,
    softDeleteMedia,
    restoreMedia,
    lockMedia,
    unlockMedia,
} from "@/lib/firebase/storageService"
import { mediaLogger } from "@/lib/utils/media-logger"
import { auth } from "@/lib/firebase/firebaseConfig"
import { getCurrentUserInfo } from "@/lib/utils/user-info"
import { Progress } from "@/components/ui/progress"

// Import our components
import ActiveMediaTab from "./tabs/ActiveMediaTab"
import TrashTab from "./tabs/TrashTab"
import IssuesPanel from "./tabs/IssuesPanel"
// Import the new LockedMediaManager component
import LockedMediaManager from "./LockedMediaManager"

// Define a type for upload progress tracking
interface UploadProgress {
    totalFiles: number
    completedFiles: number
    currentFileProgress: number
    currentFileName: string
    overallProgress: number
    errors: string[]
}

export default function MediaManager() {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
    const [deletedMediaItems, setDeletedMediaItems] = useState<MediaItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { showPopup } = useCatPopup()
    const [activeTab, setActiveTab] = useState<"active" | "trash" | "locked">("active")
    const [isUploading, setIsUploading] = useState<boolean>(false)

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

    // Fetch media on component mount
    const fetchMedia = async () => {
        try {
            setLoading(true)

            // Fetch active media (not deleted)
            const media = await getAllMedia(false)
            setMediaItems(media)

            // Fetch deleted media separately
            const deletedMedia = await getDeletedMedia()
            setDeletedMediaItems(deletedMedia)

            // Check for potential issues
            const validMedia = media.filter((item) => item.url && item.url.trim() !== "")
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

            // If issues found, show a notification
            if (potentialIssues.length > 0) {
                console.log(`Found ${potentialIssues.length} potential issues that need manual review`)
                showPopup(`Found ${potentialIssues.length} items that may need review. No action taken.`)
            }
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

    // Function to handle locking media
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

    // Function to handle unlocking media
    const handleUnlockMedia = async (item: MediaItem) => {
        try {
            // Confirm before unlocking
            const confirmed = window.confirm(
                `Are you sure you want to unlock "${item.name}"? This will allow it to be deleted.`,
            )
            if (!confirmed) return

            const success = await unlockMedia(item)
            if (success) {
                // Update the state
                setMediaItems(
                    mediaItems.map((media) =>
                        media.id === item.id ? { ...media, locked: false, lockedReason: undefined } : media,
                    ),
                )
                showPopup(`Media "${item.name}" unlocked. It can now be deleted.`)
            } else {
                showPopup("Failed to unlock media")
            }
        } catch (err) {
            console.error("Error unlocking media:", err)
            showPopup("Error unlocking media")
        }
    }

    // Function to handle actual deletion after confirmation
    const handleDeleteConfirm = async () => {
        if (!mediaToDelete) return

        try {
            // Get user info for logging
            const { userId, userEmail } = getCurrentUserInfo()

            if (deleteMode === "soft") {
                // Perform soft delete
                mediaLogger.mediaDelete(mediaToDelete.id, mediaToDelete.path || mediaToDelete.url, userId, true)

                const success = await softDeleteMedia(mediaToDelete)
                if (success) {
                    // Move the item from active to deleted
                    setMediaItems((prev) => prev.filter((media) => media.id !== mediaToDelete.id))
                    setDeletedMediaItems((prev) => [{ ...mediaToDelete, deleted: true, deletedAt: new Date() }, ...prev])
                    showPopup("Media moved to trash")
                } else {
                    showPopup("Failed to move media to trash")
                }
            } else {
                // Perform permanent delete
                mediaLogger.mediaDelete(mediaToDelete.id, mediaToDelete.path || mediaToDelete.url, userId, false)

                const success = await deleteMedia(mediaToDelete)
                if (success) {
                    // Remove the deleted item from both states
                    setMediaItems((prev) => prev.filter((media) => media.id !== mediaToDelete.id))
                    setDeletedMediaItems((prev) => prev.filter((media) => media.id !== mediaToDelete.id))
                    showPopup("Media permanently deleted")
                } else {
                    showPopup("Failed to delete media")
                }
            }
        } catch (err) {
            console.error("Error deleting media:", err)
            showPopup("Error deleting media")
        } finally {
            setDeleteDialogOpen(false)
            setMediaToDelete(null)
        }
    }

    // Function to handle actual restoration after confirmation
    const handleRestoreConfirm = async () => {
        if (!mediaToRestore) return

        try {
            // Get user info for logging
            const { userId, userEmail } = getCurrentUserInfo()

            // Log the restoration attempt
            mediaLogger.info(
                `Restoring media: ${mediaToRestore.name}`,
                {
                    id: mediaToRestore.id,
                    path: mediaToRestore.path || mediaToRestore.url,
                    userEmail,
                },
                userId,
            )

            const success = await restoreMedia(mediaToRestore)
            if (success) {
                // Move the item from deleted to active
                setDeletedMediaItems((prev) => prev.filter((media) => media.id !== mediaToRestore.id))
                setMediaItems((prev) => [
                    { ...mediaToRestore, deleted: false, deletedAt: undefined, deletedBy: undefined },
                    ...prev,
                ])
                showPopup("Media restored successfully")
            } else {
                showPopup("Failed to restore media")
            }
        } catch (err) {
            console.error("Error restoring media:", err)
            showPopup("Error restoring media")
        } finally {
            setRestoreDialogOpen(false)
            setMediaToRestore(null)
        }
    }

    // Function to confirm bulk operations
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
            } else if (type === "softDelete") {
                // Soft delete each item
                for (const item of items) {
                    await softDeleteMedia(item)
                }

                // Update the UI
                setMediaItems(mediaItems.filter((item) => !items.includes(item)))
                setDeletedMediaItems([
                    ...items.map((item) => ({ ...item, deleted: true, deletedAt: new Date() })),
                    ...deletedMediaItems,
                ])
                showPopup(`Successfully moved ${items.length} items to trash`)
            } else if (type === "restore") {
                // Restore each item
                for (const item of items) {
                    await restoreMedia(item)
                }

                // Update the UI
                setDeletedMediaItems(deletedMediaItems.filter((item) => !items.includes(item)))
                setMediaItems([
                    ...items.map((item) => ({ ...item, deleted: false, deletedAt: undefined, deletedBy: undefined })),
                    ...mediaItems,
                ])
                showPopup(`Successfully restored ${items.length} items`)
            }
        } catch (error) {
            console.error(`Error performing bulk ${type}:`, error)
            mediaLogger.error(`Bulk ${type} operation failed`, error, userId)
            showPopup(`Error performing bulk ${type}`)
        } finally {
            setBulkActionDialogOpen(false)
            setBulkAction(null)
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

                    // Determine folder based on file type
                    const folder = file.type.startsWith("image/") ? "images" : "videos"

                    try {
                        // Create a custom upload function that reports progress
                        await uploadFileWithProgress(file, folder, (progress) => {
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
                        })

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

                // Refresh media list
                await fetchMedia()

                // Keep progress visible for a moment so user can see completion
                setTimeout(() => {
                    setShowUploadProgress(false)
                    setUploadProgress(null)
                }, 3000)
            } catch (err) {
                console.error("Error in upload process:", err)
                showPopup("Error uploading files")
                setShowUploadProgress(false)
            } finally {
                setIsUploading(false)
            }
        }

        // Trigger file selection
        input.click()
    }

    // Custom upload function that reports progress
    const uploadFileWithProgress = (
        file: File,
        folder: string,
        onProgress: (progress: number) => void,
    ): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            try {
                // Create a unique file name using the existing pattern from storageService.ts
                const uniqueName = `${crypto.randomUUID()}-${file.name}`

                // Get Firebase storage reference and other utilities from the existing code
                // This is a simplified version - in production you'd use the actual Firebase functions

                // Simulate upload with progress
                let progress = 0
                const interval = setInterval(() => {
                    progress += Math.random() * 10
                    if (progress > 100) progress = 100
                    onProgress(progress / 100)

                    if (progress >= 100) {
                        clearInterval(interval)

                        // Call the actual upload function from your service
                        uploadFileAndGetURL(file, folder)
                            .then((url) => resolve(url))
                            .catch((err) => reject(err))
                    }
                }, 200)
            } catch (error) {
                reject(error)
            }
        })
    }

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

    const handleEmptyTrash = () => {
        if (deletedMediaItems.length === 0) {
            showPopup("Trash is already empty")
            return
        }

        // Set up bulk action for confirmation
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
                <div className="flex gap-2">
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
                    <TabsTrigger value="active" className="flex items-center">
                        Active Media ({mediaItems.length})
                    </TabsTrigger>
                    <TabsTrigger value="locked" className="flex items-center">
                        <LockIcon className="h-4 w-4 mr-1" />
                        Locked
                    </TabsTrigger>
                    <TabsTrigger value="trash" className="flex items-center">
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
                        handleDownload={(item) => {
                            const link = document.createElement("a")
                            link.href = item.url
                            link.download = item.name
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                            showPopup(`Downloading ${item.name}`)
                        }}
                        handleUpload={handleUpload}
                        isUploading={isUploading}
                        imageCount={imageCount}
                        videoCount={videoCount}
                        handleLockMedia={handleLockMedia}
                        handleUnlockMedia={handleUnlockMedia}
                        showPopup={showPopup}
                    />
                </TabsContent>

                <TabsContent value="locked">
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

            {/* Bulk Action Confirmation Dialog */}
            <SimpleConfirmDialog
                isOpen={bulkActionDialogOpen}
                title={`Confirm ${bulkAction?.type}`}
                message={
                    bulkAction?.type === "delete"
                        ? `Are you sure you want to permanently delete ${bulkAction?.items.length} items? This action cannot be undone.`
                        : bulkAction?.type === "softDelete"
                            ? `Are you sure you want to move ${bulkAction?.items.length} items to trash?`
                            : `Are you sure you want to restore ${bulkAction?.items.length} items?`
                }
                onConfirm={confirmBulkAction}
                onCancel={() => {
                    setBulkActionDialogOpen(false)
                    setBulkAction(null)
                }}
                confirmVariant={bulkAction?.type === "delete" ? "destructive" : "default"}
            />
        </div>
    )
}
