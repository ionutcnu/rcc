// Import the transformation utilities
import { transformCatApiResponseArray } from "./catApiUtils"
import type { CatProfile } from "@/lib/types/cat"

/**
 * Fetches all cats from the API
 * @param includeDeleted Whether to include deleted cats
 * @returns Array of cat profiles
 */
export async function fetchAllCats(includeDeleted = false): Promise<CatProfile[]> {
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

    console.error("Could not find cats array in API response:", data)
    return []
  } catch (error) {
    console.error("Error in fetchAllCats:", error)
    // Return empty array instead of throwing to prevent component crashes
    return []
  }
}

/**
 * Fetches deleted cats from the API
 * @returns Array of deleted cat profiles
 */
export async function fetchTrashCats(): Promise<CatProfile[]> {
  try {
    console.log("[catClient] Fetching deleted cats from API")
    const response = await fetch("/api/cats/trash", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    console.log("[catClient] Trash API response status:", response.status)

    if (!response.ok) {
      throw new Error(`Error fetching deleted cats: ${response.status}`)
    }

    const data = await response.json()
    console.log("[catClient] Trash API response data:", data)

    // Check the structure of the response
    if (data && typeof data === "object") {
      // If the response has a cats property that is an array
      if (data.cats && Array.isArray(data.cats)) {
        console.log(`[catClient] Found ${data.cats.length} deleted cats in data.cats`)
        return transformCatApiResponseArray(data.cats)
      }

      // If the response itself is an array
      if (Array.isArray(data)) {
        console.log(`[catClient] Found ${data.length} deleted cats in data array`)
        return transformCatApiResponseArray(data)
      }

      // If the response has a different structure but contains cat objects
      const possibleCatsArray = Object.values(data).find((val) => Array.isArray(val))
      if (possibleCatsArray) {
        console.log(`[catClient] Found ${possibleCatsArray.length} deleted cats in a nested property`)
        return transformCatApiResponseArray(possibleCatsArray)
      }
    }

    console.error("[catClient] Could not find cats array in API response:", data)
    return []
  } catch (error) {
    console.error("[catClient] Error in fetchTrashCats:", error)
    // Return empty array instead of throwing to prevent component crashes
    return []
  }
}

/**
 * Fetches a cat by name from the API
 * @param name The name of the cat to fetch
 * @returns The cat profile or null if not found
 */
export async function fetchCatByName(name: string): Promise<CatProfile | null> {
  try {
    const response = await fetch(`/api/cats/by-name?name=${encodeURIComponent(name)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Error fetching cat by name: ${response.status}`)
    }

    const data = await response.json()
    console.log("Cat by name API response:", data)

    if (data && data.cat) {
      return transformCatApiResponse(data.cat)
    }

    if (data && typeof data === "object" && !Array.isArray(data) && Object.keys(data).length > 0) {
      // If the cat data is directly in the response
      return transformCatApiResponse(data)
    }

    console.error("Could not find cat in API response:", data)
    return null
  } catch (error) {
    console.error("Error in fetchCatByName:", error)
    return null
  }
}

/**
 * Fetches a cat by ID from the API
 * @param id The ID of the cat to fetch
 * @returns The cat profile or null if not found
 */
export async function fetchCatById(id: string): Promise<CatProfile | null> {
  try {
    const response = await fetch(`/api/cats?id=${encodeURIComponent(id)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Error fetching cat by ID: ${response.status}`)
    }

    const data = await response.json()
    console.log("Cat by ID API response:", data)

    if (data && data.cat) {
      return transformCatApiResponse(data.cat)
    }

    if (data && typeof data === "object" && !Array.isArray(data) && Object.keys(data).length > 0) {
      // If the cat data is directly in the response
      return transformCatApiResponse(data)
    }

    console.error("Could not find cat in API response:", data)
    return null
  } catch (error) {
    console.error("Error in fetchCatById:", error)
    return null
  }
}

/**
 * Increments the view count for a cat
 * @param id The ID of the cat to increment views for
 * @returns Success status
 */
export async function incrementCatViewCount(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/cats/increment-views`, {
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
    console.error("Error in incrementCatViewCount:", error)
    return false
  }
}

// Add the missing transformCatApiResponse function if not imported
function transformCatApiResponse(apiCat: any): CatProfile {
  // Create a base cat object with default values for required fields
  const transformedCat: CatProfile = {
    id: apiCat.id || "",
    name: apiCat.name || "",
    description: apiCat.description || "",
    mainImage: apiCat.mainImage || "",
    images: Array.isArray(apiCat.images) ? apiCat.images : [],
    videos: Array.isArray(apiCat.videos) ? apiCat.videos : [],
    color: apiCat.color || "",
    gender: apiCat.gender || "",
    yearOfBirth: apiCat.yearOfBirth || null,
    age: apiCat.age || null,
    isVaccinated: apiCat.isVaccinated || false,
    isMicrochipped: apiCat.isMicrochipped || false,
    isCastrated: apiCat.isCastrated || false,
    breed: apiCat.breed || "",
    category: apiCat.category || "",
    availability: apiCat.availability || "Not Available",
    createdAt: apiCat.createdAt || null,
    updatedAt: apiCat.updatedAt || null,
    isDeleted: apiCat.isDeleted || false,
    views: apiCat.views || 0,
  }

  // Handle optional fields
  if (apiCat.motherId) transformedCat.motherId = apiCat.motherId
  if (apiCat.fatherId) transformedCat.fatherId = apiCat.fatherId
  if (apiCat.deletedAt) transformedCat.deletedAt = apiCat.deletedAt
  if (apiCat.deletedBy) transformedCat.deletedBy = apiCat.deletedBy
  if (apiCat.lastViewed) transformedCat.lastViewed = apiCat.lastViewed

  return transformedCat
}
