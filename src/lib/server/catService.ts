"use server"

import type { CatProfile } from "@/lib/types/cat"
import { getDb, getTimestamp, safeGetDoc, safeGetDocs } from "@/lib/firebase/server-only"
import { deleteFileFromStorage } from "@/lib/server/storageService"
import { logActivity } from "@/lib/server/activityService"

// Update the getAllCats function to calculate and include age
export async function getAllCats(includeDeleted = false): Promise<CatProfile[]> {
  try {
    // Create the query
    let queryOptions: any = {}

    if (!includeDeleted) {
      // Only get non-deleted cats
      queryOptions = {
        where: [{ field: "isDeleted", operator: "!=", value: true }],
      }
    }

    // Get the cats
    const cats = await safeGetDocs("cats", queryOptions)
    const currentYear = new Date().getFullYear()

    // Process the cats
    return cats.map((data: any) => {
      // Calculate age based on yearOfBirth if available
      let age: number | undefined = undefined
      if (data.yearOfBirth) {
        age = currentYear - data.yearOfBirth
      }

      return {
        ...data,
        age, // Add calculated age
      } as CatProfile
    })
  } catch (error: any) {
    console.error("Error getting all cats:", error)
    throw error
  }
}

export async function getCatById(id: string): Promise<CatProfile | null> {
  try {
    const catData = await safeGetDoc("cats", id)
    if (!catData) return null

    // Explicitly type as CatProfile & Record<string, any> to avoid TypeScript errors
    const typedCat = catData as CatProfile & Record<string, any>

    // Calculate age
    const currentYear = new Date().getFullYear()
    let age: number | undefined = undefined

    // Use optional chaining to safely access yearOfBirth
    if (typedCat?.yearOfBirth) {
      age = currentYear - typedCat.yearOfBirth
    }

    return {
      ...typedCat,
      age,
    } as CatProfile
  } catch (error: any) {
    console.error(`Error getting cat with ID ${id}:`, error)
    throw error
  }
}

/**
 * Increments the view count for a cat
 */
export async function incrementCatViews(id: string): Promise<void> {
  try {
    const db = await getDb()
    const Timestamp = await getTimestamp()

    const docRef = db.collection("cats").doc(id)
    const catSnap = await docRef.get()

    if (catSnap.exists) {
      const catData = catSnap.data() || {}
      const currentViews = catData.views || 0

      await docRef.update({
        views: currentViews + 1,
        lastViewed: Timestamp.now(),
      })

      // Log the view activity
      await logActivity("view", "cat", id, {
        name: catData.name,
        views: currentViews + 1,
      })
    }
  } catch (error) {
    console.error(`Error incrementing views for cat ${id}:`, error)
    throw error // Re-throw to allow API route to handle it
  }
}

// Updated addCat function using addDoc
export async function addCat(
  catData: Omit<CatProfile, "id" | "createdAt" | "updatedAt" | "isDeleted">,
): Promise<string> {
  try {
    console.log("Adding cat to Firestore:", catData)
    const db = await getDb()
    const Timestamp = await getTimestamp()

    // Clean the cat object to remove undefined values
    const cleanCat = Object.fromEntries(Object.entries(catData).filter(([_, v]) => v !== undefined))

    const payload = {
      ...cleanCat,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isDeleted: false,
      views: 0, // Initialize views counter
    }

    const docRef = await db.collection("cats").add(payload)
    console.log("Cat added successfully with ID:", docRef.id)

    // Log the activity with cleaned details
    await logActivity("add", "cat", docRef.id, {
      name: catData.name,
      breed: catData.breed,
      gender: catData.gender,
      yearOfBirth: catData.yearOfBirth,
      actionType: "cat-add", // Add explicit actionType
    })

    return docRef.id // Returns Firestore-generated unique ID
  } catch (error: any) {
    console.error("Error adding cat to Firestore:", error)
    throw error
  }
}

export async function updateCat(id: string, catData: Partial<Omit<CatProfile, "id" | "createdAt">>): Promise<void> {
  try {
    const db = await getDb()
    const Timestamp = await getTimestamp()

    const docRef = db.collection("cats").doc(id)
    const catSnap = await docRef.get()

    if (catSnap.exists) {
      const currentCat = catSnap.data() || {}

      // Clean the cat object to remove undefined values
      const cleanCat = Object.fromEntries(Object.entries(catData).filter(([_, v]) => v !== undefined))

      const payload = {
        ...cleanCat,
        updatedAt: Timestamp.now(),
      }

      await docRef.update(payload)

      // Log the activity with cleaned details and field changes
      await logActivity("update", "cat", id, {
        name: currentCat?.name || "Unknown cat",
        changedFields: Object.keys(cleanCat),
        actionType: "cat-update", // Add explicit actionType
      })
    }
  } catch (error: any) {
    console.error(`Error updating cat with ID ${id}:`, error)
    throw error
  }
}

// Update the deleteCat function to implement soft delete
export async function deleteCat(id: string, permanent = false): Promise<void> {
  try {
    // First get the cat to find its associated media files and name
    const cat = await getCatById(id)

    if (!cat) {
      throw new Error(`Cat with ID ${id} not found`)
    }

    const db = await getDb()
    const Timestamp = await getTimestamp()

    // Safely get auth instance and current user
    const authService = await getServerAuth()
    // We don't have currentUser in Admin SDK, so handle differently
    const userInfo: { uid?: string } | null = await getUserInfo()
    const userId = userInfo?.uid || null

    if (permanent) {
      // Permanent deletion - delete media files and the document
      if (cat.mainImage) {
        await deleteFileFromStorage(cat.mainImage)
      }

      // Delete additional images
      if (cat.images && Array.isArray(cat.images)) {
        for (const imageUrl of cat.images) {
          await deleteFileFromStorage(imageUrl)
        }
      }

      // Delete videos
      if (cat.videos && Array.isArray(cat.videos)) {
        for (const videoUrl of cat.videos) {
          await deleteFileFromStorage(videoUrl)
        }
      }

      // Delete the Firestore document
      const docRef = db.collection("cats").doc(id)
      await docRef.delete()

      // Log the activity with minimal details to avoid undefined values
      await logActivity("delete", "cat", id, {
        deleted: true,
        permanent: true,
        name: cat.name,
        breed: cat.breed,
        gender: cat.gender,
        yearOfBirth: cat.yearOfBirth,
        actionType: "cat-delete-permanent", // Add explicit actionType
      })

      console.log(`Cat with ID ${id} and all associated media permanently deleted`)
    } else {
      // Soft deletion - just mark as deleted
      const docRef = db.collection("cats").doc(id)
      await docRef.update({
        isDeleted: true,
        deletedAt: Timestamp.now(),
        deletedBy: userId,
      })

      // Log the activity with more cat details
      await logActivity("delete", "cat", id, {
        deleted: true,
        permanent: false,
        name: cat.name,
        breed: cat.breed,
        gender: cat.gender,
        yearOfBirth: cat.yearOfBirth,
        actionType: "cat-delete-soft", // Add explicit actionType
      })

      console.log(`Cat with ID ${id} moved to trash`)
    }
  } catch (error: any) {
    console.error(`Error deleting cat with ID ${id}:`, error)
    throw error
  }
}

// Add a function to restore a soft-deleted cat
export async function restoreCat(id: string): Promise<void> {
  try {
    const db = await getDb()

    const docRef = db.collection("cats").doc(id)
    const catSnap = await docRef.get()

    if (!catSnap.exists) {
      throw new Error(`Cat with ID ${id} not found`)
    }

    // Use type assertion to avoid TypeScript errors
    const catData = (catSnap.data() || {}) as any

    // Update the document to mark as not deleted
    await docRef.update({
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    })

    // Log the activity
    await logActivity("restore", "cat", id, {
      restored: true,
      name: catData.name,
      breed: catData.breed,
      gender: catData.gender,
      yearOfBirth: catData.yearOfBirth,
      actionType: "cat-restore", // Add explicit actionType
    })

    console.log(`Cat with ID ${id} restored from trash`)
  } catch (error: any) {
    console.error(`Error restoring cat with ID ${id}:`, error)
    throw error
  }
}

// Add a function to get deleted cats
export async function getDeletedCats(): Promise<CatProfile[]> {
  try {
    const query = {
      where: [{ field: "isDeleted", operator: "==", value: true }],
    }

    const cats = await safeGetDocs("cats", query)
    const currentYear = new Date().getFullYear()

    // Process the cats
    return cats.map((data: any) => {
      // Calculate age based on yearOfBirth if available
      let age: number | undefined = undefined
      if (data.yearOfBirth) {
        age = currentYear - data.yearOfBirth
      }

      return {
        ...data,
        age, // Add calculated age
      } as CatProfile
    })
  } catch (error: any) {
    console.error("Error getting deleted cats:", error)
    throw error
  }
}

export async function archiveCat(id: string): Promise<void> {
  try {
    const cat = await getCatById(id)
    if (cat) {
      await updateCat(id, { isDeleted: true })
      await logActivity("archive", "cat", id, {
        archived: true,
        name: cat.name,
        breed: cat.breed,
        gender: cat.gender,
        yearOfBirth: cat.yearOfBirth,
        actionType: "cat-archive", // Add explicit actionType
      })
    }
  } catch (error: any) {
    console.error(`Error archiving cat with ID ${id}:`, error)
    throw error
  }
}

// Add this function to fetch a cat by name
export async function getCatByName(name: string): Promise<CatProfile | null> {
  try {
    const query = {
      where: [
        { field: "name", operator: "==", value: name },
        { field: "isDeleted", operator: "==", value: false },
      ],
      limit: 1,
    }

    const cats = await safeGetDocs("cats", query)

    if (cats.length === 0) {
      return null
    }

    const catData = cats[0] as any

    // Calculate age
    const currentYear = new Date().getFullYear()
    let age: number | undefined = undefined
    if (catData.yearOfBirth) {
      age = currentYear - catData.yearOfBirth
    }

    return {
      ...catData,
      age,
    } as CatProfile
  } catch (error: any) {
    console.error("Error fetching cat by name:", error)
    throw error
  }
}

// Helper function to get server auth
async function getServerAuth() {
  const { getServerAuth } = await import("@/lib/firebase/server-only")
  return getServerAuth()
}

// Helper function to get user info from the session
async function getUserInfo(): Promise<{ uid?: string } | null> {
  // In a real implementation, you would get this from the session
  // For now, return null
  return null
}

// Import missing dependencies for media operations
import "../server/storageService"
import "../server/activityService"
