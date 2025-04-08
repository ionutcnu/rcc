import { db } from "@/lib/firebase/firebaseConfig"
import type { CatProfile } from "@/lib/types/cat"
import { collection, doc, getDocs, getDoc, addDoc, setDoc, deleteDoc, Timestamp, updateDoc } from "firebase/firestore"
import { deleteFileFromStorage, uploadCatImage as uploadCatImageStorage } from "./storageService"
import { logActivity } from "./activityService"

// Reference the correct root-level cats collection
const catsRef = collection(db, "cats")

export async function getAllCats(): Promise<CatProfile[]> {
    try {
        const snapshot = await getDocs(catsRef)
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

        const payload = {
            ...cat,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            isDeleted: false,
            views: 0, // Initialize views counter
        }

        const docRef = await addDoc(catsRef, payload)
        console.log("Cat added successfully with ID:", docRef.id)

        // Log the activity
        await logActivity("add", cat.name, docRef.id)

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
            const payload = {
                ...cat,
                updatedAt: Timestamp.now(),
            }
            await setDoc(docRef, payload, { merge: true })

            // Log the activity
            await logActivity("update", currentCat.name || "Unknown cat", id)
        }
    } catch (error: any) {
        console.error(`Error updating cat with ID ${id}:`, error)
        throw error
    }
}

export async function deleteCat(id: string): Promise<void> {
    try {
        // First get the cat to find its associated media files and name
        const cat = await getCatById(id)

        if (cat) {
            // Delete main image if it exists
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

            // Log the activity
            await logActivity("delete", cat.name, id)
        }

        // Delete the Firestore document
        const docRef = doc(db, "cats", id)
        await deleteDoc(docRef)
        console.log(`Cat with ID ${id} and all associated media deleted successfully`)
    } catch (error: any) {
        console.error(`Error deleting cat with ID ${id}:`, error)
        throw error
    }
}

export async function archiveCat(id: string): Promise<void> {
    try {
        await updateCat(id, { isDeleted: true })
    } catch (error: any) {
        console.error(`Error archiving cat with ID ${id}:`, error)
        throw error
    }
}

export const uploadCatImage = uploadCatImageStorage
