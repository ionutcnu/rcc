import { db } from "@/lib/firebase/firebaseConfig"
import type { CatProfile } from "@/lib/types/cat"
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    deleteDoc,
    Timestamp,
    updateDoc,
    query,
    where,
} from "firebase/firestore"
import { deleteFileFromStorage, uploadFileAndGetURL } from "./storageService"
import { logActivity } from "./activityService"
import { auth } from "./firebaseConfig"

// Reference the correct root-level cats collection
const catsRef = collection(db, "cats")

export async function getAllCats(includeDeleted = false): Promise<CatProfile[]> {
    try {
        let q
        if (!includeDeleted) {
            // Only get non-deleted cats
            q = query(collection(db, "cats"), where("isDeleted", "!=", true))
        } else {
            // Get all cats including deleted ones
            q = collection(db, "cats")
        }

        const snapshot = await getDocs(q)
        return snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as CatProfile
            // Avoid duplicate id property by destructuring data first
            const { id: _, ...restData } = data
            return { id: docSnap.id, ...restData }
        })
    } catch (error: any) {
        console.error("Error getting all cats:", error)
        throw error
    }
}

export async function getCatById(id: string): Promise<CatProfile | null> {
    try {
        const docRef = doc(db, "cats", id)
        const snapshot = await getDoc(docRef)
        if (!snapshot.exists()) return null
        const data = snapshot.data() as CatProfile
        // Avoid duplicate id property by destructuring data first
        const { id: _, ...restData } = data
        return { id: snapshot.id, ...restData }
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
        const docRef = doc(db, "cats", id)
        const catSnap = await getDoc(docRef)

        if (catSnap.exists()) {
            const currentViews = catSnap.data().views || 0
            await updateDoc(docRef, {
                views: currentViews + 1,
                lastViewed: Timestamp.now(),
            })
        }
    } catch (error) {
        console.error(`Error incrementing views for cat ${id}:`, error)
    }
}

// Corrected addCat function using addDoc
export async function addCat(cat: Omit<CatProfile, "id" | "createdAt" | "updatedAt" | "isDeleted">): Promise<string> {
    try {
        console.log("Adding cat to Firestore:", cat)

        // Clean the cat object to remove undefined values
        const cleanCat = Object.fromEntries(Object.entries(cat).filter(([_, v]) => v !== undefined))

        const payload = {
            ...cleanCat,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            isDeleted: false,
            views: 0, // Initialize views counter
        }

        const docRef = await addDoc(catsRef, payload)
        console.log("Cat added successfully with ID:", docRef.id)

        // Log the activity with cleaned details
        await logActivity("add", cat.name, docRef.id, cleanCat)

        return docRef.id // Returns Firestore-generated unique ID
    } catch (error: any) {
        console.error("Error adding cat to Firestore:", error)
        if (error && typeof error === "object" && "code" in error && error.code === "permission-denied") {
            console.error("PERMISSION ERROR: Make sure your Firestore rules allow write access")
            console.error("Go to Firebase Console > Firestore Database > Rules and set: allow read, write;")
        }
        throw error
    }
}

export async function updateCat(id: string, cat: Partial<Omit<CatProfile, "id" | "createdAt">>): Promise<void> {
    try {
        const docRef = doc(db, "cats", id)
        const catSnap = await getDoc(docRef)

        if (catSnap.exists()) {
            const currentCat = catSnap.data()

            // Clean the cat object to remove undefined values
            const cleanCat = Object.fromEntries(Object.entries(cat).filter(([_, v]) => v !== undefined))

            const payload = {
                ...cleanCat,
                updatedAt: Timestamp.now(),
            }
            await setDoc(docRef, payload, { merge: true })

            // Log the activity with cleaned details
            await logActivity("update", currentCat.name || "Unknown cat", id, cleanCat)
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
            const docRef = doc(db, "cats", id)
            await deleteDoc(docRef)

            // Log the activity with minimal details to avoid undefined values
            await logActivity("delete", cat.name, id, { deleted: true, permanent: true })

            console.log(`Cat with ID ${id} and all associated media permanently deleted`)
        } else {
            // Soft deletion - just mark as deleted
            const docRef = doc(db, "cats", id)
            await updateDoc(docRef, {
                isDeleted: true,
                deletedAt: Timestamp.now(),
                deletedBy: auth.currentUser?.uid || null,
            })

            // Log the activity
            await logActivity("delete", cat.name, id, { deleted: true, permanent: false })

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
        const docRef = doc(db, "cats", id)
        const catSnap = await getDoc(docRef)

        if (!catSnap.exists()) {
            throw new Error(`Cat with ID ${id} not found`)
        }

        const cat = catSnap.data() as CatProfile

        // Update the document to mark as not deleted
        await updateDoc(docRef, {
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
        })

        // Log the activity
        await logActivity("update", cat.name, id, { restored: true })

        console.log(`Cat with ID ${id} restored from trash`)
    } catch (error: any) {
        console.error(`Error restoring cat with ID ${id}:`, error)
        throw error
    }
}

// Add a function to get deleted cats
export async function getDeletedCats(): Promise<CatProfile[]> {
    try {
        const catsRef = collection(db, "cats")
        const q = query(catsRef, where("isDeleted", "==", true))
        const snapshot = await getDocs(q)

        return snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as CatProfile
            // Avoid duplicate id property by destructuring data first
            const { id: _, ...restData } = data
            return { id: docSnap.id, ...restData }
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
            await logActivity("archive", cat.name, id, { archived: true })
        }
    } catch (error: any) {
        console.error(`Error archiving cat with ID ${id}:`, error)
        throw error
    }
}

/**
 * Uploads a cat image to Firebase Storage with progress tracking
 * @param file The file to upload
 * @param catId The ID of the cat
 * @param type Optional type identifier (main, additional_1, etc.)
 * @returns Promise with the download URL
 */
export async function uploadCatImage(file: File, catId: string, type = "image"): Promise<string> {
    try {
        // Use the existing upload function with the cats folder
        return await uploadFileAndGetURL(file, `cats/${catId}/images`)
    } catch (error) {
        console.error("Error uploading cat image:", error)
        throw error
    }
}

/**
 * Uploads a cat video to Firebase Storage with progress tracking
 * @param file The file to upload
 * @param catId The ID of the cat
 * @param type Optional type identifier
 * @returns Promise with the download URL
 */
export async function uploadCatVideo(file: File, catId: string, type = "video"): Promise<string> {
    try {
        // Use the existing upload function with the cats folder
        return await uploadFileAndGetURL(file, `cats/${catId}/videos`)
    } catch (error) {
        console.error("Error uploading cat video:", error)
        throw error
    }
}
