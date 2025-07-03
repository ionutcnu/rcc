/**
 * Utility functions for working with cat API responses
 */

import type { CatProfile } from "@/lib/types/cat"

/**
 * Transforms the API response to ensure it matches the expected CatProfile format
 * This helps handle any inconsistencies between the API response and the expected format
 */
export function transformCatApiResponse(apiCat: any): CatProfile {
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

/**
 * Transforms an array of API cats to ensure they match the expected CatProfile format
 */
export function transformCatApiResponseArray(apiCats: any[]): CatProfile[] {
  if (!Array.isArray(apiCats)) {
    console.error("transformCatApiResponseArray: Input is not an array", apiCats)
    return []
  }

  return apiCats.map((cat) => transformCatApiResponse(cat))
}
