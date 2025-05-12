"use client"

import React from "react"
import type { MediaItem } from "@/lib/firebase/storageService"

// Define the response type
export interface MediaApiResponse {
  media: MediaItem[]
  imageCount: number
  videoCount: number
  totalCount: number
}

// Create a cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_EXPIRY = 60000 // 1 minute cache expiry

/**
 * Fetches active media from the API
 * @param includeLocked Whether to include locked media items (default: false)
 */
export async function fetchActiveMedia(includeLocked = false): Promise<MediaApiResponse> {
  // Check cache first
  const cacheKey = `active-media-${includeLocked}`
  const cachedData = apiCache.get(cacheKey)
  const now = Date.now()

  if (cachedData && now - cachedData.timestamp < CACHE_EXPIRY) {
    console.log("Using cached media data")
    return cachedData.data
  }

  try {
    const url = `/api/media/active${includeLocked ? "?includeLocked=true" : ""}`
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

  try {
    const response = await fetch("/api/media/locked", {
      method: "GET",
      credentials: "include", // Important: This ensures cookies are sent with the request
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
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

  try {
    const response = await fetch("/api/media/trash", {
      method: "GET",
      credentials: "include", // Important: This sends cookies with the request
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
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
    console.error("Error fetching trash media:", error)
    throw error
  }
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

// Add this function after the lockMediaItem function

/**
 * Moves a media item to trash via the API
 * @param mediaId The ID of the media to move to trash
 * @returns The result of the operation
 */
export async function moveMediaToTrash(
  mediaId: string,
): Promise<{ success: boolean; media?: MediaItem; error?: string }> {
  try {
    console.log(`Moving media item with ID: ${mediaId} to trash`)

    if (!mediaId) {
      console.error("Media ID is missing")
      return {
        success: false,
        error: "Media ID is required",
      }
    }

    const response = await fetch("/api/media/trash/move", {
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
      console.error("Error response from move to trash API:", data)
      return {
        success: false,
        error: data.error || "Failed to move media to trash",
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
      media: data.media as MediaItem,
    }
  } catch (error) {
    console.error("Error in moveMediaToTrash:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
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

  // Use a ref to track if we've already fetched data
  const hasFetched = React.useRef(false)

  React.useEffect(() => {
    // Reset fetch status when type changes
    if (hasFetched.current && type) {
      hasFetched.current = false
    }

    // Only fetch once per type
    if (hasFetched.current) return

    async function loadMedia() {
      try {
        setLoading(true)
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
        hasFetched.current = true
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"))
      } finally {
        setLoading(false)
      }
    }

    loadMedia()
  }, [type])

  return { media, imageCount, videoCount, loading, error }
}
