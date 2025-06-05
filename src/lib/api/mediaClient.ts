"use client"

import React from "react"
import type { MediaItem } from "@/lib/types/media"

// Define the response type
export interface MediaApiResponse {
  media: MediaItem[]
  imageCount: number
  videoCount: number
  totalCount: number
}

// Create a cache for API responses
import { deduplicateRequest } from "./requestDeduplicator"

const apiCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_EXPIRY = 60000 // 1 minute cache expiry

/**
 * Fetches active media from the API
 * @param includeLocked Whether to include locked media items (default: false)
 * @param includeDeleted Whether to include deleted media items (default: false)
 */
export async function fetchActiveMedia(includeLocked = false, includeDeleted = false): Promise<MediaApiResponse> {
  // Check cache first
  const cacheKey = `active-media-${includeLocked}-${includeDeleted}`
  const cachedData = apiCache.get(cacheKey)
  const now = Date.now()

  if (cachedData && now - cachedData.timestamp < CACHE_EXPIRY) {
    console.log("Using cached media data")
    return cachedData.data
  }

  // Use the deduplicator to prevent duplicate requests
  return deduplicateRequest(`fetchActiveMedia-${includeLocked}-${includeDeleted}`, async () => {
    try {
      const params = new URLSearchParams()
      if (includeLocked) params.append("includeLocked", "true")
      if (includeDeleted) params.append("includeDeleted", "true")
      const url = `/api/media/active${params.toString() ? "?" + params.toString() : ""}`
      const response = await fetch(url, {
        method: "GET",
        credentials: "include", // Important: This ensures cookies are sent with the request
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in.")
        } else if (response.status === 403) {
          throw new Error("You do not have permission to access this resource.")
        } else {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
      }

      const data = await response.json()

      // Cache the response
      apiCache.set(cacheKey, {
        data,
        timestamp: now,
      })

      return data
    } catch (error) {
      console.error("Error fetching media:", error)
      throw error
    }
  })
}

/**
 * Fetches locked media from the API
 */
export async function fetchLockedMedia(): Promise<MediaApiResponse> {
  // Check cache first
  const cacheKey = "locked-media"
  const cachedData = apiCache.get(cacheKey)
  const now = Date.now()

  if (cachedData && now - cachedData.timestamp < CACHE_EXPIRY) {
    console.log("Using cached locked media data")
    return cachedData.data
  }

  // Use the deduplicator to prevent duplicate requests
  return deduplicateRequest("fetchLockedMedia", async () => {
    try {
      console.log("Actually fetching locked media from API")
      const response = await fetch("/api/media/locked", {
        method: "GET",
        credentials: "include", // Important: This ensures cookies are sent with the request
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in.")
        } else if (response.status === 403) {
          throw new Error("Access denied. You don't have permission to view this media.")
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Cache the response
      apiCache.set(cacheKey, { data, timestamp: Date.now() })

      return data
    } catch (error) {
      console.error("Error fetching locked media:", error)
      throw error
    }
  })
}

/**
 * Fetches trash media from the API
 */
export async function fetchTrashMedia(): Promise<MediaApiResponse> {
  // Check cache first
  const cacheKey = "trash-media"
  const cachedData = apiCache.get(cacheKey)
  const now = Date.now()

  if (cachedData && now - cachedData.timestamp < CACHE_EXPIRY) {
    console.log("Using cached trash media data")
    return cachedData.data
  }

  // Use the deduplicator to prevent duplicate requests
  return deduplicateRequest("fetchTrashMedia", async () => {
    try {
      console.log("Actually fetching trash media from API")
      const response = await fetch("/api/media/trash", {
        method: "GET",
        credentials: "include", // Important: This sends cookies with the request
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in.")
        } else if (response.status === 403) {
          throw new Error("Access denied. You don't have permission to view this media.")
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Cache the response
      apiCache.set(cacheKey, {
        data,
        timestamp: now,
      })

      return data
    } catch (error) {
      console.error("Error fetching locked media:", error)
      throw error
    }
  })
}



/**
 * Moves a media item to trash via the API
 * @param mediaId The ID of the media to move to trash
 * @returns Promise with the result
 */
export async function moveMediaToTrash(mediaId: string) {
  return deduplicateRequest(`moveToTrash-${mediaId}`, async () => {
    try {
      console.log(`Moving media item with ID: ${mediaId} to trash`)
      const response = await fetch("/api/media/trash/move", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mediaId }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Error moving media to trash:", data)
        return {
          success: false,
          error: data.error || `Failed to move media to trash (${response.status})`,
          code: data.code || "unknown",
          locked: data.locked || false,
          lockedReason: data.lockedReason,
        }
      }

      // Clear any cached data
      const cacheKeys = ["active-media-false", "active-media-true", "locked-media", "trash-media"]
      cacheKeys.forEach((key) => {
        if (apiCache.has(key)) {
          apiCache.delete(key)
        }
      })

      return {
        success: true,
        media: data.media,
        message: data.message,
      }
    } catch (error) {
      console.error("Error in moveMediaToTrash:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  })
}

/**
 * Restores a media item from trash
 * @param mediaId The ID of the media to restore
 * @returns Promise with the result of the operation
 */
export async function restoreMediaFromTrash(
  mediaId: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  return deduplicateRequest(`restoreMedia-${mediaId}`, async () => {
    try {
      console.log(`Restoring media item with ID: ${mediaId} from trash`)

      const response = await fetch(`/api/media/trash/restore`, {
        method: "POST",
        credentials: "include", // Important: This ensures cookies are sent with the request
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mediaId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Error response from restore media API:", data)
        return {
          success: false,
          error: data.error || "Failed to restore media",
        }
      }

      // Clear cache for media lists
      apiCache.delete("active-media")
      apiCache.delete("trash-media")

      return {
        success: true,
        message: data.message || "Media restored successfully",
      }
    } catch (error) {
      console.error("Error in restoreMediaFromTrash:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  })
}

/**
 * Permanently deletes a media item from trash
 * @param mediaId The ID of the media to delete permanently
 * @returns Promise with the result of the operation
 */
export async function deleteMediaPermanently(
  mediaId: string,
): Promise<{ success: boolean; message?: string; error?: string; locked?: boolean; lockedReason?: string }> {
  return deduplicateRequest(`deleteMediaPermanently-${mediaId}`, async () => {
    try {
      console.log(`Permanently deleting media item with ID: ${mediaId}`)

      const response = await fetch(`/api/media/trash/delete`, {
        method: "POST",
        credentials: "include", // Important: This ensures cookies are sent with the request
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mediaId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Error response from delete media API:", data)
        return {
          success: false,
          error: data.error || "Failed to delete media",
          locked: data.locked,
          lockedReason: data.lockedReason,
        }
      }

      // Clear cache for media lists
      const cacheKeys = ["active-media-false", "active-media-true", "locked-media", "trash-media"]
      cacheKeys.forEach((key) => {
        if (apiCache.has(key)) {
          apiCache.delete(key)
        }
      })

      return {
        success: true,
        message: data.message || "Media permanently deleted",
      }
    } catch (error) {
      console.error("Error in deleteMediaPermanently:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  })
}

/**
 * Downloads a media file through the API
 * @param mediaId The ID of the media to download
 * @param fileName Optional filename for the downloaded file
 */
export async function downloadMedia(mediaId: string, fileName?: string): Promise<void> {
  try {
    console.log(`Downloading media with ID: ${mediaId}`)

    // Make an actual fetch request to the API
    const response = await fetch(`/api/media/download?id=${encodeURIComponent(mediaId)}`, {
      method: "GET",
      credentials: "include", // Important: This ensures cookies are sent with the request
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
    }

    // Get the blob from the response
    const blob = await response.blob()

    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob)

    // Create a temporary anchor element
    const a = document.createElement("a")
    a.href = url
    a.download = fileName || "download"

    // Append to the document, click, and remove
    document.body.appendChild(a)
    a.click()

    // Clean up
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    console.log(`Download complete for media: ${mediaId}`)
  } catch (error) {
    console.error("Error downloading media:", error)
    throw new Error("Failed to download media. Please try again.")
  }
}

/**
 * Locks a media item via the API
 * @param mediaId The ID of the media to lock
 * @param reason The reason for locking
 * @returns The updated media item
 */
export async function lockMediaItem(
  mediaId: string,
  reason: string,
): Promise<{ success: boolean; media?: MediaItem; error?: string }> {
  try {
    console.log(`Locking media item with ID: ${mediaId}, reason: ${reason}`)

    if (!mediaId) {
      console.error("Media ID is missing")
      return {
        success: false,
        error: "Media ID is required",
      }
    }

    // Make sure reason is not empty
    if (!reason) {
      console.error("Lock reason is missing")
      return {
        success: false,
        error: "Lock reason is required",
      }
    }

    const response = await fetch("/api/media/lock", {
      method: "POST",
      credentials: "include", // Important: This ensures cookies are sent with the request
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mediaId,
        reason,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Error response from lock API:", data)
      return {
        success: false,
        error: data.error || "Failed to lock media",
      }
    }

    // Clear any cached data
    const cacheKeys = ["active-media-false", "active-media-true", "locked-media"]
    cacheKeys.forEach((key) => {
      if (apiCache.has(key)) {
        apiCache.delete(key)
      }
    })

    return {
      success: true,
      media: data.media as MediaItem,
    }
  } catch (error) {
    console.error("Error in lockMediaItem:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Unlocks a media item via the API
 * @param mediaId The ID of the media to unlock
 * @returns Promise with the result
 */
export async function unlockMediaItem(mediaId: string) {
  try {
    const response = await fetch("/api/media/unlock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mediaId }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error unlocking media:", errorData)
      return {
        success: false,
        error: errorData.error || `Failed to unlock media (${response.status})`,
        code: errorData.code || "unknown",
      }
    }

    // Clear any cached data after successful unlock
    const cacheKeys = ["active-media-false", "active-media-true", "locked-media"]
    cacheKeys.forEach((key) => {
      if (apiCache.has(key)) {
        apiCache.delete(key)
      }
    })

    return await response.json()
  } catch (error) {
    console.error("Error in unlockMediaItem:", error)
    return {
      success: false,
      error: "Network error when unlocking media",
    }
  }
}

// Global state to track if a media type has been loaded
const mediaLoaded = {
  active: false,
  locked: false,
  trash: false,
}

/**
 * Custom hook for fetching media with built-in caching and deduplication
 * @param type The type of media to fetch: 'active', 'locked', or 'trash'
 */
export function useMedia(type: "active" | "locked" | "trash" = "active") {
  const [media, setMedia] = React.useState<MediaItem[]>([])
  const [imageCount, setImageCount] = React.useState(0)
  const [videoCount, setVideoCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    // Skip if this media type has already been loaded AND we have media in state
    if (mediaLoaded[type] && media.length > 0) {
      console.log(`Media type ${type} already loaded, skipping fetch`)
      setLoading(false)
      return
    }

    async function loadMedia() {
      try {
        setLoading(true)
        console.log(`Loading media type: ${type}`)
        let result: MediaApiResponse

        switch (type) {
          case "locked":
            result = await fetchLockedMedia()
            break
          case "trash":
            result = await fetchTrashMedia()
            break
          case "active":
          default:
            result = await fetchActiveMedia(false) // Don't include locked items
            break
        }

        setMedia(result.media)
        setImageCount(result.imageCount)
        setVideoCount(result.videoCount)

        // Mark this media type as loaded
        mediaLoaded[type] = true
        console.log(`Media type ${type} loaded successfully`)
      } catch (err) {
        console.error(`Error loading media type ${type}:`, err)
        setError(err instanceof Error ? err : new Error("Unknown error"))
      } finally {
        setLoading(false)
      }
    }

    loadMedia()

    return () => {
      mediaLoaded[type] = false
    }
  }, [type])

  return { media, imageCount, videoCount, loading, error }
}
