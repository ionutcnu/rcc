"use server"

import { admin } from "@/lib/firebase/admin"
import { Timestamp } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"
import type { MediaItem } from "@/lib/types/media"
import { serverLogger } from "@/lib/utils/server-logger"

import path from "path"

// Get storage instance
const storage = getStorage()
const bucket = storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "")
const db = admin.db

/**
 * Server-side media service for managing media files
 */

// Helper function to convert Date/string to timestamp
function getTimestamp(date: string | Date | undefined): number {
  if (!date) return 0
  if (typeof date === 'string') {
    return new Date(date).getTime()
  }
  return date.getTime()
}

// Type for filtering media items
export type MediaFilterOptions = {
  includeDeleted?: boolean
  includeLocked?: boolean
  type?: "image" | "video" | "all"
  searchQuery?: string
  sortBy?: "dateAsc" | "dateDesc" | "nameAsc" | "nameDesc" | "sizeAsc" | "sizeDesc"
}

// Type for upload options
export type MediaUploadOptions = {
  folder?: string
  metadata?: Record<string, string>
  generateUniqueName?: boolean
  allowedTypes?: string[]
  maxSizeInMB?: number
}

/**
 * Retrieves all media items with optional filtering
 */
export async function getAllMedia(options: MediaFilterOptions = {}): Promise<{
  media: MediaItem[]
  totalCount: number
  imageCount: number
  videoCount: number
}> {
  try {
    // Get reference to media collection
    const mediaRef = db.collection("media")

    // Fetch all media items
    const mediaSnapshot = await mediaRef.get()

    if (mediaSnapshot.empty) {
      return { media: [], totalCount: 0, imageCount: 0, videoCount: 0 }
    }

    let mediaItems: MediaItem[] = []

    // Process each document
    mediaSnapshot.forEach((doc) => {
      const data = doc.data()

      // Basic media item mapping
      const mediaItem: MediaItem = {
        id: doc.id,
        name: data.name || "Unnamed file",
        url: data.url || "",
        type: data.type === "video" ? "video" : "image", // Ensure type is "image" or "video"
        path: data.path || "",
        size: data.size || 0,
        width: data.width,
        height: data.height,
        createdAt: data.createdAt?.toDate(),
        createdBy: data.createdBy,
        updatedAt: data.updatedAt?.toDate(),
        updatedBy: data.updatedBy,
        deleted: data.deleted || false,
        deletedAt: data.deletedAt?.toDate(),
        deletedBy: data.deletedBy,
        locked: data.locked || false,
        lockedReason: data.lockedReason,
        lockedAt: data.lockedAt?.toDate(),
        lockedBy: data.lockedBy,
        folder: data.folder,
        contentType: data.contentType,
      }

      mediaItems.push(mediaItem)
    })

    // Apply filters
    if (options) {
      // Filter by deleted status
      if (options.includeDeleted === false) {
        mediaItems = mediaItems.filter((item) => !item.deleted)
      }

      // Filter by locked status
      if (options.includeLocked === false) {
        mediaItems = mediaItems.filter((item) => !item.locked)
      }

      // Filter by type
      if (options.type && options.type !== "all") {
        mediaItems = mediaItems.filter((item) => item.type === options.type)
      }

      // Filter by search query
      if (options.searchQuery) {
        const lowercaseQuery = options.searchQuery.toLowerCase()
        mediaItems = mediaItems.filter(
          (item) =>
            item.name.toLowerCase().includes(lowercaseQuery) ||
            (item.lockedReason && item.lockedReason.toLowerCase().includes(lowercaseQuery)),
        )
      }

      // Apply sorting
      if (options.sortBy) {
        switch (options.sortBy) {
          case "dateAsc":
            mediaItems.sort((a, b) => getTimestamp(a.createdAt) - getTimestamp(b.createdAt))
            break
          case "dateDesc":
            mediaItems.sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt))
            break
          case "nameAsc":
            mediaItems.sort((a, b) => a.name.localeCompare(b.name))
            break
          case "nameDesc":
            mediaItems.sort((a, b) => b.name.localeCompare(a.name))
            break
          case "sizeAsc":
            mediaItems.sort((a, b) => Number(a.size || 0) - Number(b.size || 0))
            break
          case "sizeDesc":
            mediaItems.sort((a, b) => Number(b.size || 0) - Number(a.size || 0))
            break
        }
      } else {
        // Default sorting: newest first
        mediaItems.sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt))
      }
    }

    // Count stats
    const imageCount = mediaItems.filter((item) => item.type === "image").length
    const videoCount = mediaItems.filter((item) => item.type === "video").length

    return {
      media: mediaItems,
      totalCount: mediaItems.length,
      imageCount,
      videoCount,
    }
  } catch (error) {
    console.error("Error in getAllMedia:", error)
    serverLogger.error("Failed to fetch media items", { error })
    throw new Error("Failed to fetch media items")
  }
}

/**
 * Get only active (non-deleted, non-locked) media
 */
export async function getActiveMedia(options: MediaFilterOptions = {}) {
  return getAllMedia({
    ...options,
    includeDeleted: false,
  })
}

/**
 * Get only locked media
 */
export async function getLockedMedia(options: MediaFilterOptions = {}) {
  const result = await getAllMedia({
    ...options,
    includeDeleted: false,
  })

  return {
    ...result,
    media: result.media.filter((item) => item.locked),
    totalCount: result.media.filter((item) => item.locked).length,
    imageCount: result.media.filter((item) => item.locked && item.type === "image").length,
    videoCount: result.media.filter((item) => item.locked && item.type === "video").length,
  }
}

/**
 * Get only trashed media
 */
export async function getTrashedMedia(options: MediaFilterOptions = {}) {
  const result = await getAllMedia({
    ...options,
    includeDeleted: true,
  })

  return {
    ...result,
    media: result.media.filter((item) => item.deleted),
    totalCount: result.media.filter((item) => item.deleted).length,
    imageCount: result.media.filter((item) => item.deleted && item.type === "image").length,
    videoCount: result.media.filter((item) => item.deleted && item.type === "video").length,
  }
}

/**
 * Get a media item by ID
 */
export async function getMediaById(id: string): Promise<MediaItem | null> {
  try {
    const mediaDoc = await db.collection("media").doc(id).get()

    if (!mediaDoc.exists) {
      return null
    }

    const data = mediaDoc.data()

    return {
      id: mediaDoc.id,
      name: data?.name || "Unnamed file",
      url: data?.url || "",
      type: data?.type === "video" ? "video" : "image", // Ensure type is "image" or "video"
      path: data?.path || "",
      size: data?.size || 0,
      width: data?.width,
      height: data?.height,
      createdAt: data?.createdAt?.toDate(),
      createdBy: data?.createdBy,
      updatedAt: data?.updatedAt?.toDate(),
      updatedBy: data?.updatedBy,
      deleted: data?.deleted || false,
      deletedAt: data?.deletedAt?.toDate(),
      deletedBy: data?.deletedBy,
      locked: data?.locked || false,
      lockedReason: data?.lockedReason,
      lockedAt: data?.lockedAt?.toDate(),
      lockedBy: data?.lockedBy,
      folder: data?.folder,
      contentType: data?.contentType,
    }
  } catch (error) {
    console.error("Error in getMediaById:", error)
    serverLogger.error("Failed to fetch media by ID", { id, error })
    return null
  }
}

/**
 * Upload a file and create a media item
 */
export async function uploadMedia(
  file: Buffer,
  fileName: string,
  contentType: string,
  userId: string,
  options: MediaUploadOptions = {},
): Promise<MediaItem> {
  try {
    // Default options
    const {
      folder = "general",
      metadata = {},
      generateUniqueName = true,
      allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"],
      maxSizeInMB = 50,
    } = options

    // Validate file type
    if (!allowedTypes.includes(contentType)) {
      throw new Error(`File type ${contentType} is not allowed`)
    }

    // Validate file size
    const sizeInMB = file.length / (1024 * 1024)
    if (sizeInMB > maxSizeInMB) {
      throw new Error(`File size exceeds the maximum allowed size of ${maxSizeInMB}MB`)
    }

    // Generate a unique filename if needed
    let finalFileName = fileName
    if (generateUniqueName) {
      const timestamp = Date.now()
      const extension = path.extname(fileName)
      const baseName = path.basename(fileName, extension).replace(/\s+/g, "-")
      finalFileName = `${timestamp}-${baseName}${extension}`
    }

    // Define the storage path
    const storagePath = `media/${folder}/${finalFileName}`

    // Create a reference to the file location
    const fileRef = bucket.file(storagePath)

    // File metadata
    const fileMetadata = {
      contentType,
      metadata: {
        ...metadata,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      },
    }

    // Upload the file
    await fileRef.save(file, {
      metadata: fileMetadata,
    })

    // Make the file publicly accessible
    await fileRef.makePublic()

    // Generate a download URL
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ""
    const encodedPath = encodeURIComponent(storagePath)
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`

    // Determine file type
    const fileType = contentType.startsWith("image/") ? "image" : "video"

    // Create media document in Firestore
    const mediaData = {
      name: fileName,
      type: fileType,
      url: downloadUrl,
      path: storagePath,
      folder,
      size: file.length,
      contentType,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId,
      updatedBy: userId,
      deleted: false,
      locked: false,
    }

    // Add to Firestore
    const mediaRef = await db.collection("media").add(mediaData)

    // Log the upload
    serverLogger.info(
      `Uploaded media: ${fileName}`,
      {
        mediaId: mediaRef.id,
        type: fileType,
        size: file.length,
        path: storagePath,
      },
      userId,
    )

    // Return the created media item
    return {
      id: mediaRef.id,
      name: fileName,
      type: fileType as "image" | "video", // Type assertion to ensure proper typing
      url: downloadUrl,
      path: storagePath,
      folder,
      size: file.length,
      contentType,
      createdAt: mediaData.createdAt.toDate(),
      updatedAt: mediaData.updatedAt.toDate(),
      createdBy: userId,
      updatedBy: userId,
      deleted: false,
      locked: false,
    }
  } catch (error) {
    console.error("Error in uploadMedia:", error)
    serverLogger.error("Failed to upload media", { fileName, error }, userId)
    throw new Error("Failed to upload media")
  }
}

/**
 * Lock a media item to prevent deletion
 */
export async function lockMedia(
  mediaId: string,
  reason: string,
  userId: string,
): Promise<{
  success: boolean
  message: string
  media?: MediaItem
  error?: string
}> {
  try {
    // Get the media item
    const mediaDoc = await db.collection("media").doc(mediaId).get()

    if (!mediaDoc.exists) {
      return {
        success: false,
        message: "Media not found",
        error: "Media item does not exist",
      }
    }

    const mediaData = mediaDoc.data()

    // If already locked, return success without changing
    if (mediaData?.locked) {
      const media: MediaItem = {
        id: mediaDoc.id,
        name: mediaData.name || "Unnamed file",
        url: mediaData.url || "",
        type: mediaData.type === "video" ? "video" : "image", // Ensure it's "image" or "video"
        path: mediaData.path || "",
        size: mediaData.size || 0,
        width: mediaData.width,
        height: mediaData.height,
        createdAt: mediaData.createdAt?.toDate(),
        createdBy: mediaData.createdBy,
        updatedAt: mediaData.updatedAt?.toDate(),
        updatedBy: mediaData.updatedBy,
        deleted: mediaData.deleted || false,
        deletedAt: mediaData.deletedAt?.toDate(),
        deletedBy: mediaData.deletedBy,
        locked: true,
        lockedReason: mediaData.lockedReason,
        lockedAt: mediaData.lockedAt?.toDate(),
        lockedBy: mediaData.lockedBy,
        folder: mediaData.folder,
        contentType: mediaData.contentType,
      }

      return {
        success: true,
        message: "Media already locked",
        media,
      }
    }

    // Update the media document
    await db.collection("media").doc(mediaId).update({
      locked: true,
      lockedReason: reason,
      lockedAt: Timestamp.now(),
      lockedBy: userId,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    })

    // Log the action
    serverLogger.info(
      `Locked media: ${mediaData?.name}`,
      {
        id: mediaId,
        reason,
      },
      userId,
    )

    // Get the updated media item
    const updatedMediaDoc = await db.collection("media").doc(mediaId).get()
    const updatedData = updatedMediaDoc.data()

    if (!updatedData) {
      throw new Error("Failed to retrieve updated media data")
    }

    const media: MediaItem = {
      id: mediaId,
      name: updatedData.name || "Unnamed file",
      url: updatedData.url || "",
      type: updatedData.type === "video" ? "video" : "image", // Ensure it's "image" or "video"
      path: updatedData.path || "",
      size: updatedData.size || 0,
      width: updatedData.width,
      height: updatedData.height,
      createdAt: updatedData.createdAt?.toDate(),
      createdBy: updatedData.createdBy,
      updatedAt: updatedData.updatedAt?.toDate(),
      updatedBy: updatedData.updatedBy,
      deleted: updatedData.deleted || false,
      deletedAt: updatedData.deletedAt?.toDate(),
      deletedBy: updatedData.deletedBy,
      locked: true,
      lockedReason: reason,
      lockedAt: updatedData.lockedAt?.toDate(),
      lockedBy: userId,
      folder: updatedData.folder,
      contentType: updatedData.contentType,
    }

    return {
      success: true,
      message: "Media locked successfully",
      media,
    }
  } catch (error) {
    console.error("Error in lockMedia:", error)
    serverLogger.error("Failed to lock media", { mediaId, error })
    return {
      success: false,
      message: "Failed to lock media",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Unlock a media item
 */
export async function unlockMedia(
  mediaId: string,
  userId: string,
): Promise<{
  success: boolean
  message: string
  media?: MediaItem
  error?: string
}> {
  try {
    // Get the media item
    const mediaDoc = await db.collection("media").doc(mediaId).get()

    if (!mediaDoc.exists) {
      return {
        success: false,
        message: "Media not found",
        error: "Media item does not exist",
      }
    }

    const mediaData = mediaDoc.data()

    if (!mediaData) {
      throw new Error("Media data is undefined")
    }

    // If not locked, return success without changing
    if (!mediaData.locked) {
      const media: MediaItem = {
        id: mediaDoc.id,
        name: mediaData.name || "Unnamed file",
        url: mediaData.url || "",
        type: mediaData.type === "video" ? "video" : "image", // Ensure it's "image" or "video"
        path: mediaData.path || "",
        size: mediaData.size || 0,
        width: mediaData.width,
        height: mediaData.height,
        createdAt: mediaData.createdAt?.toDate(),
        createdBy: mediaData.createdBy,
        updatedAt: mediaData.updatedAt?.toDate(),
        updatedBy: mediaData.updatedBy,
        deleted: mediaData.deleted || false,
        deletedAt: mediaData.deletedAt?.toDate(),
        deletedBy: mediaData.deletedBy,
        locked: false,
        lockedReason: mediaData.lockedReason,
        lockedAt: mediaData.lockedAt?.toDate(),
        lockedBy: mediaData.lockedBy,
        folder: mediaData.folder,
        contentType: mediaData.contentType,
      }

      return {
        success: true,
        message: "Media is not locked",
        media,
      }
    }

    // Update the media document
    await db.collection("media").doc(mediaId).update({
      locked: false,
      lockedReason: null,
      lockedAt: null,
      lockedBy: null,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    })

    // Log the action
    serverLogger.info(
      `Unlocked media: ${mediaData.name}`,
      {
        id: mediaId,
      },
      userId,
    )

    // Get the updated media item
    const updatedMediaDoc = await db.collection("media").doc(mediaId).get()
    const updatedData = updatedMediaDoc.data()

    if (!updatedData) {
      throw new Error("Failed to retrieve updated media data")
    }

    const media: MediaItem = {
      id: mediaId,
      name: updatedData.name || "Unnamed file",
      url: updatedData.url || "",
      type: updatedData.type === "video" ? "video" : "image", // Ensure it's "image" or "video"
      path: updatedData.path || "",
      size: updatedData.size || 0,
      width: updatedData.width,
      height: updatedData.height,
      createdAt: updatedData.createdAt?.toDate(),
      createdBy: updatedData.createdBy,
      updatedAt: updatedData.updatedAt?.toDate(),
      updatedBy: updatedData.updatedBy,
      deleted: updatedData.deleted || false,
      deletedAt: updatedData.deletedAt?.toDate(),
      deletedBy: updatedData.deletedBy,
      locked: false,
      folder: updatedData.folder,
      contentType: updatedData.contentType,
    }

    return {
      success: true,
      message: "Media unlocked successfully",
      media,
    }
  } catch (error) {
    console.error("Error in unlockMedia:", error)
    serverLogger.error("Failed to unlock media", { mediaId, error })
    return {
      success: false,
      message: "Failed to unlock media",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Move a media item to trash
 */
export async function moveMediaToTrash(
  mediaId: string,
  userId: string,
): Promise<{
  success: boolean
  message: string
  media?: MediaItem
  error?: string
  locked?: boolean
  lockedReason?: string
}> {
  try {
    // Get the media item
    const mediaDoc = await db.collection("media").doc(mediaId).get()

    if (!mediaDoc.exists) {
      return {
        success: false,
        message: "Media not found",
        error: "Media item does not exist",
      }
    }

    const mediaData = mediaDoc.data()

    if (!mediaData) {
      throw new Error("Media data is undefined")
    }

    // Check if already deleted
    if (mediaData.deleted) {
      const media: MediaItem = {
        id: mediaDoc.id,
        name: mediaData.name || "Unnamed file",
        url: mediaData.url || "",
        type: mediaData.type === "video" ? "video" : "image", // Ensure it's "image" or "video"
        path: mediaData.path || "",
        size: mediaData.size || 0,
        width: mediaData.width,
        height: mediaData.height,
        createdAt: mediaData.createdAt?.toDate(),
        createdBy: mediaData.createdBy,
        updatedAt: mediaData.updatedAt?.toDate(),
        updatedBy: mediaData.updatedBy,
        deleted: true,
        deletedAt: mediaData.deletedAt?.toDate(),
        deletedBy: mediaData.deletedBy,
        locked: mediaData.locked || false,
        lockedReason: mediaData.lockedReason,
        lockedAt: mediaData.lockedAt?.toDate(),
        lockedBy: mediaData.lockedBy,
        folder: mediaData.folder,
        contentType: mediaData.contentType,
      }

      return {
        success: true,
        message: "Media already in trash",
        media,
      }
    }

    // Check if media is locked
    if (mediaData.locked) {
      return {
        success: false,
        message: "Cannot move locked media to trash",
        locked: true,
        lockedReason: mediaData.lockedReason || "Unknown reason",
      }
    }

    // Update the media document
    await db.collection("media").doc(mediaId).update({
      deleted: true,
      deletedAt: Timestamp.now(),
      deletedBy: userId,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    })

    // Log the action
    serverLogger.info(
      `Moved media to trash: ${mediaData.name}`,
      {
        id: mediaId,
      },
      userId,
    )

    // Get the updated media item
    const updatedMediaDoc = await db.collection("media").doc(mediaId).get()
    const updatedData = updatedMediaDoc.data()

    if (!updatedData) {
      throw new Error("Failed to retrieve updated media data")
    }

    const media: MediaItem = {
      id: mediaId,
      name: updatedData.name || "Unnamed file",
      url: updatedData.url || "",
      type: updatedData.type === "video" ? "video" : "image", // Ensure it's "image" or "video"
      path: updatedData.path || "",
      size: updatedData.size || 0,
      width: updatedData.width,
      height: updatedData.height,
      createdAt: updatedData.createdAt?.toDate(),
      createdBy: updatedData.createdBy,
      updatedAt: updatedData.updatedAt?.toDate(),
      updatedBy: updatedData.updatedBy,
      deleted: true,
      deletedAt: updatedData.deletedAt?.toDate(),
      deletedBy: userId,
      locked: updatedData.locked || false,
      lockedReason: updatedData.lockedReason,
      lockedAt: updatedData.lockedAt?.toDate(),
      lockedBy: updatedData.lockedBy,
      folder: updatedData.folder,
      contentType: updatedData.contentType,
    }

    return {
      success: true,
      message: "Media moved to trash successfully",
      media,
    }
  } catch (error) {
    console.error("Error in moveMediaToTrash:", error)
    serverLogger.error("Failed to move media to trash", { mediaId, error }, userId)
    return {
      success: false,
      message: "Failed to move media to trash",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Restore a media item from trash
 */
export async function restoreMediaFromTrash(
  mediaId: string,
  userId: string,
): Promise<{
  success: boolean
  message: string
  media?: MediaItem
  error?: string
}> {
  try {
    // Get the media item
    const mediaDoc = await db.collection("media").doc(mediaId).get()

    if (!mediaDoc.exists) {
      return {
        success: false,
        message: "Media not found",
        error: "Media item does not exist",
      }
    }

    const mediaData = mediaDoc.data()

    if (!mediaData) {
      throw new Error("Media data is undefined")
    }

    // Check if not in trash
    if (!mediaData.deleted) {
      const media: MediaItem = {
        id: mediaDoc.id,
        name: mediaData.name || "Unnamed file",
        url: mediaData.url || "",
        type: mediaData.type === "video" ? "video" : "image", // Ensure it's "image" or "video"
        path: mediaData.path || "",
        size: mediaData.size || 0,
        width: mediaData.width,
        height: mediaData.height,
        createdAt: mediaData.createdAt?.toDate(),
        createdBy: mediaData.createdBy,
        updatedAt: mediaData.updatedAt?.toDate(),
        updatedBy: mediaData.updatedBy,
        deleted: false,
        locked: mediaData.locked || false,
        lockedReason: mediaData.lockedReason,
        lockedAt: mediaData.lockedAt?.toDate(),
        lockedBy: mediaData.lockedBy,
        folder: mediaData.folder,
        contentType: mediaData.contentType,
      }

      return {
        success: true,
        message: "Media is not in trash",
        media,
      }
    }

    // Update the media document
    await db.collection("media").doc(mediaId).update({
      deleted: false,
      deletedAt: null,
      deletedBy: null,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    })

    // Log the action
    serverLogger.info(
      `Restored media from trash: ${mediaData.name}`,
      {
        id: mediaId,
      },
      userId,
    )

    // Get the updated media item
    const updatedMediaDoc = await db.collection("media").doc(mediaId).get()
    const updatedData = updatedMediaDoc.data()

    if (!updatedData) {
      throw new Error("Failed to retrieve updated media data")
    }

    const media: MediaItem = {
      id: mediaId,
      name: updatedData.name || "Unnamed file",
      url: updatedData.url || "",
      type: updatedData.type === "video" ? "video" : "image", // Ensure it's "image" or "video"
      path: updatedData.path || "",
      size: updatedData.size || 0,
      width: updatedData.width,
      height: updatedData.height,
      createdAt: updatedData.createdAt?.toDate(),
      createdBy: updatedData.createdBy,
      updatedAt: updatedData.updatedAt?.toDate(),
      updatedBy: updatedData.updatedBy,
      deleted: false,
      locked: updatedData.locked || false,
      lockedReason: updatedData.lockedReason,
      lockedAt: updatedData.lockedAt?.toDate(),
      lockedBy: updatedData.lockedBy,
      folder: updatedData.folder,
      contentType: updatedData.contentType,
    }

    return {
      success: true,
      message: "Media restored successfully",
      media,
    }
  } catch (error) {
    console.error("Error in restoreMediaFromTrash:", error)
    serverLogger.error("Failed to restore media from trash", { mediaId, error })
    return {
      success: false,
      message: "Failed to restore media from trash",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Permanently delete a media item
 */
export async function deleteMediaPermanently(
  mediaId: string,
  userId: string,
): Promise<{
  success: boolean
  message: string
  error?: string
  locked?: boolean
  lockedReason?: string
}> {
  try {
    // Get the media item
    const mediaDoc = await db.collection("media").doc(mediaId).get()

    if (!mediaDoc.exists) {
      return {
        success: false,
        message: "Media not found",
        error: "Media item does not exist",
      }
    }

    const mediaData = mediaDoc.data()

    if (!mediaData) {
      throw new Error("Media data is undefined")
    }

    // Check if media is locked
    if (mediaData.locked) {
      return {
        success: false,
        message: "Cannot delete locked media",
        locked: true,
        lockedReason: mediaData.lockedReason || "Unknown reason",
      }
    }

    // Check if media is not in trash
    if (!mediaData.deleted) {
      return {
        success: false,
        message: "Media must be in trash before permanent deletion",
        error: "Media is not in trash",
      }
    }

    // Delete the file from Storage if path exists
    let storageDeleteSuccess = false
    if (mediaData.path) {
      try {
        const fileRef = bucket.file(mediaData.path)
        await fileRef.delete()
        storageDeleteSuccess = true

        // Log successful deletion from storage
        serverLogger.info(
          `Deleted media from Firestore: ${mediaData.name}`,
          {
            id: mediaId,
          },
          userId,
        )
      } catch (storageError: any) {
        // If file doesn't exist, consider it a success
        if (storageError.code === 404 || storageError.message.includes("No such object")) {
          storageDeleteSuccess = true
          serverLogger.info(
            `File already deleted from storage: ${mediaData.path}`,
            {
              id: mediaId,
            },
            userId,
          )
        } else {
          console.error(`Error deleting file from storage: ${mediaData.path}`, storageError)
          serverLogger.error(
            `Error deleting file from storage: ${mediaData.path}`,
            {
              error: storageError,
            },
            userId,
          )
          // Continue with Firestore deletion despite storage error
        }
      }
    }

    // Delete the document from Firestore
    await db.collection("media").doc(mediaId).delete()

    // Log the action
    serverLogger.info(
      `Permanently deleted media: ${mediaData.name}`,
      {
        id: mediaId,
        path: mediaData.storagePath,
      },
      userId,
    )

    return {
      success: true,
      message: "Media permanently deleted",
    }
  } catch (error) {
    console.error("Error in deleteMediaPermanently:", error)
    serverLogger.error("Failed to permanently delete media", { mediaId, error }, userId)
    return {
      success: false,
      message: "Failed to permanently delete media",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get media statistics
 */
export async function getMediaStats(): Promise<{
  totalCount: number
  activeCount: number
  trashedCount: number
  lockedCount: number
  imageCount: number
  videoCount: number
  totalSizeBytes: number
  humanReadableSize: string
}> {
  try {
    // Get all media
    const mediaRef = db.collection("media")
    const mediaSnapshot = await mediaRef.get()

    let totalCount = 0
    let activeCount = 0
    let trashedCount = 0
    let lockedCount = 0
    let imageCount = 0
    let videoCount = 0
    let totalSizeBytes = 0

    mediaSnapshot.forEach((doc) => {
      const data = doc.data()
      totalCount++

      if (data.deleted) {
        trashedCount++
      } else {
        activeCount++
      }

      if (data.locked) {
        lockedCount++
      }

      if (data.type === "image") {
        imageCount++
      } else if (data.type === "video") {
        videoCount++
      }

      // Add to total size if size is available
      if (data.size && typeof data.size === "number") {
        totalSizeBytes += data.size
      }
    })

    // Format total size
    const humanReadableSize = formatBytes(totalSizeBytes)

    return {
      totalCount,
      activeCount,
      trashedCount,
      lockedCount,
      imageCount,
      videoCount,
      totalSizeBytes,
      humanReadableSize,
    }
  } catch (error) {
    console.error("Error in getMediaStats:", error)
    serverLogger.error("Failed to get media stats", { error })
    throw new Error("Failed to get media stats")
  }
}

/**
 * Validate media URLs to identify broken links
 */
export async function validateMediaUrls(): Promise<{
  valid: string[]
  broken: string[]
  missing: string[]
  total: number
}> {
  try {
    // Get all media
    const { media } = await getAllMedia({ includeDeleted: true })

    const validUrls: string[] = []
    const brokenUrls: string[] = []
    const missingUrls: string[] = []

    // Check URLs in batches to avoid overwhelming the server
    for (const item of media) {
      if (!item.url) {
        missingUrls.push(item.id)
        continue
      }

      try {
        // For Firebase Storage URLs, verify the file exists
        if (item.url.includes("firebasestorage.googleapis.com") && item.path) {
          try {
            const fileRef = bucket.file(item.path)
            const [exists] = await fileRef.exists()

            if (exists) {
              validUrls.push(item.id)
            } else {
              brokenUrls.push(item.id)
            }
          } catch (error) {
            brokenUrls.push(item.id)
          }
        } else {
          // For other URLs, assume they're valid - could implement an HTTP HEAD check here
          validUrls.push(item.id)
        }
      } catch (error) {
        brokenUrls.push(item.id)
      }
    }

    return {
      valid: validUrls,
      broken: brokenUrls,
      missing: missingUrls,
      total: media.length,
    }
  } catch (error) {
    console.error("Error in validateMediaUrls:", error)
    serverLogger.error("Failed to validate media URLs", { error })
    throw new Error("Failed to validate media URLs")
  }
}

/**
 * Format bytes to a human-readable format
 */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}
