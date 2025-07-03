// Import the transformation utilities
import { transformCatApiResponseArray } from "./catUtils"
import { deduplicateRequest } from "./requestDeduplicator"
import type { CatProfile } from "@/lib/types/cat"

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface CreateCatData {
  name: string
  breed?: string
  color?: string
  description?: string
  birthDate?: string
  motherIds?: string[]
  fatherIds?: string[]
  images?: string[]
  videos?: string[]
  isActive?: boolean
}

interface UpdateCatData extends Partial<CreateCatData> {
  id: string
}

/**
 * Fetches all cats from the API
 * @param includeDeleted Whether to include deleted cats
 * @returns Array of cat profiles
 */
export async function fetchAllCats(includeDeleted = false): Promise<CatProfile[]> {
  const cacheKey = `fetchAllCats_${includeDeleted}`
  
  return deduplicateRequest(cacheKey, async () => {
    try {
      // Explicitly pass the includeDeleted parameter in the query string
      const response = await fetch(`/api/cats?includeDeleted=${includeDeleted}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add cache: 'no-store' to prevent caching of results
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Error fetching cats: ${response.status}`)
      }

      const data = await response.json()

      // Add more detailed logging to debug the response
      console.log("API Response:", data)

      // Check the structure of the response
      if (data && typeof data === "object") {
        // If the response has a cats property that is an array
        if (data.cats && Array.isArray(data.cats)) {
          console.log(`Found ${data.cats.length} cats in data.cats`)
          return transformCatApiResponseArray(data.cats)
        }

        // If the response itself is an array
        if (Array.isArray(data)) {
          console.log(`Found ${data.length} cats in data array`)
          return transformCatApiResponseArray(data)
        }

        // If the response has a different structure but contains cat objects
        const possibleCatsArray = Object.values(data).find((val) => Array.isArray(val))
        if (possibleCatsArray) {
          console.log(`Found ${possibleCatsArray.length} cats in a nested property`)
          return transformCatApiResponseArray(possibleCatsArray)
        }
      }

      // If all else fails, return empty array
      console.warn("Could not parse cats from API response, returning empty array")
      return []
    } catch (error) {
      console.error("Error fetching cats:", error)
      throw error
    }
  })
}

/**
 * Fetches a single cat by ID
 * @param id Cat ID
 * @returns Cat profile or null if not found
 */
export async function fetchCatById(id: string): Promise<CatProfile | null> {
  const cacheKey = `fetchCatById_${id}`
  
  return deduplicateRequest(cacheKey, async () => {
    try {
      const response = await fetch(`/api/cats?id=${encodeURIComponent(id)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Error fetching cat: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`Error fetching cat ${id}:`, error)
      throw error
    }
  })
}

/**
 * Fetches a single cat by name
 * @param name Cat name
 * @returns Cat profile or null if not found
 */
export async function fetchCatByName(name: string): Promise<CatProfile | null> {
  const cacheKey = `fetchCatByName_${name}`
  
  return deduplicateRequest(cacheKey, async () => {
    try {
      const response = await fetch(`/api/cats/by-name?name=${encodeURIComponent(name)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Error fetching cat by name: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`Error fetching cat by name ${name}:`, error)
      throw error
    }
  })
}

/**
 * Creates a new cat
 * @param catData Cat data to create
 * @returns Created cat profile
 */
export async function createCat(catData: CreateCatData): Promise<CatProfile> {
  try {
    const response = await fetch("/api/cats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(catData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Error creating cat: ${response.status}`)
    }

    const result = await response.json()
    return result.data || result
  } catch (error) {
    console.error("Error creating cat:", error)
    throw error
  }
}

/**
 * Updates an existing cat
 * @param catData Cat data to update (must include id)
 * @returns Updated cat profile
 */
export async function updateCat(catData: UpdateCatData): Promise<CatProfile> {
  try {
    const response = await fetch(`/api/cats/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(catData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Error updating cat: ${response.status}`)
    }

    const result = await response.json()
    return result.data || result
  } catch (error) {
    console.error(`Error updating cat ${catData.id}:`, error)
    throw error
  }
}

/**
 * Soft deletes a cat (moves to trash)
 * @param id Cat ID to delete
 * @returns Success status
 */
export async function deleteCat(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/cats/delete?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Error deleting cat: ${response.status}`)
    }

    return true
  } catch (error) {
    console.error(`Error deleting cat ${id}:`, error)
    throw error
  }
}

/**
 * Permanently deletes a cat
 * @param id Cat ID to permanently delete
 * @returns Success status
 */
export async function permanentlyDeleteCat(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/cats/delete?id=${encodeURIComponent(id)}&permanent=true`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Error permanently deleting cat: ${response.status}`)
    }

    return true
  } catch (error) {
    console.error(`Error permanently deleting cat ${id}:`, error)
    throw error
  }
}

/**
 * Restores a deleted cat from trash
 * @param id Cat ID to restore
 * @returns Restored cat profile
 */
export async function restoreCat(id: string): Promise<CatProfile> {
  try {
    const response = await fetch(`/api/cats/restore`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Error restoring cat: ${response.status}`)
    }

    const result = await response.json()
    return result.data || result
  } catch (error) {
    console.error(`Error restoring cat ${id}:`, error)
    throw error
  }
}

/**
 * Uploads an image for a cat
 * @param catId Cat ID
 * @param file Image file
 * @returns Upload result
 */
export async function uploadCatImage(catId: string, file: File): Promise<ApiResponse> {
  try {
    const formData = new FormData()
    formData.append("image", file)
    formData.append("catId", catId)

    const response = await fetch("/api/cats/upload/image", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Error uploading image: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error uploading image for cat ${catId}:`, error)
    throw error
  }
}

/**
 * Uploads a video for a cat
 * @param catId Cat ID
 * @param file Video file
 * @returns Upload result
 */
export async function uploadCatVideo(catId: string, file: File): Promise<ApiResponse> {
  try {
    const formData = new FormData()
    formData.append("video", file)
    formData.append("catId", catId)

    const response = await fetch("/api/cats/upload/video", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Error uploading video: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error uploading video for cat ${catId}:`, error)
    throw error
  }
}

/**
 * Bulk delete multiple cats
 * @param ids Array of cat IDs to delete
 * @returns Array of results
 */
export async function bulkDeleteCats(ids: string[]): Promise<ApiResponse[]> {
  const results = await Promise.allSettled(
    ids.map(id => deleteCat(id))
  )

  return results.map((result, index) => ({
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason.message : undefined
  }))
}

/**
 * Bulk restore multiple cats
 * @param ids Array of cat IDs to restore
 * @returns Array of results
 */
export async function bulkRestoreCats(ids: string[]): Promise<ApiResponse[]> {
  const results = await Promise.allSettled(
    ids.map(id => restoreCat(id))
  )

  return results.map((result, index) => ({
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason.message : undefined
  }))
}

/**
 * Fetches deleted cats from the API
 * @returns Array of deleted cat profiles
 */
export async function fetchTrashCats(): Promise<CatProfile[]> {
  const cacheKey = "fetchTrashCats"
  
  return deduplicateRequest(cacheKey, async () => {
    try {
      const response = await fetch("/api/cats/trash", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Error fetching deleted cats: ${response.status}`)
      }

      const data = await response.json()

      // Check the structure of the response
      if (data && typeof data === "object") {
        // If the response has a cats property that is an array
        if (data.cats && Array.isArray(data.cats)) {
          return transformCatApiResponseArray(data.cats)
        }

        // If the response itself is an array
        if (Array.isArray(data)) {
          return transformCatApiResponseArray(data)
        }

        // If the response has a different structure but contains cat objects
        const possibleCatsArray = Object.values(data).find((val) => Array.isArray(val))
        if (possibleCatsArray) {
          return transformCatApiResponseArray(possibleCatsArray)
        }
      }

      // If all else fails, return empty array
      console.warn("Could not parse deleted cats from API response, returning empty array")
      return []
    } catch (error) {
      console.error("Error fetching deleted cats:", error)
      throw error
    }
  })
}

/**
 * Increments the view count for a cat
 * @param id Cat ID to increment views for
 * @returns Success status
 */
export async function incrementCatViewCount(id: string): Promise<boolean> {
  try {
    const response = await fetch("/api/cats/increment-views", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    })

    if (!response.ok) {
      throw new Error(`Error incrementing cat views: ${response.status}`)
    }

    return true
  } catch (error) {
    console.error(`Error incrementing view count for cat ${id}:`, error)
    return false
  }
}