import { db } from "@/lib/firebase/firebaseConfig"
import { collection, doc, getDoc, setDoc, deleteDoc, getDocs } from "firebase/firestore"
import type { Language } from "./types"

// Collection name for translation cache
const CACHE_COLLECTION = "translation_cache"

// Interface for cached translation
interface CachedTranslation {
    sourceText: string
    targetLanguage: Language
    sourceLanguage: Language
    translatedText: string
    timestamp: Date
    expiresAt: Date
}

/**
 * Get a cached translation
 */
export async function getCachedTranslation(
    sourceText: string,
    targetLanguage: Language,
    sourceLanguage: Language,
): Promise<string | null> {
    try {
        // Create a hash of the source text to use as document ID
        const cacheKey = createCacheKey(sourceText, targetLanguage, sourceLanguage)

        // Get the document from Firestore
        const docRef = doc(db, CACHE_COLLECTION, cacheKey)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
            const data = docSnap.data() as CachedTranslation

            // Check if the cache has expired
            if (new Date() > new Date(data.expiresAt)) {
                // Cache has expired, delete it
                await deleteDoc(docRef)
                return null
            }

            return data.translatedText
        }

        return null
    } catch (error) {
        console.error("Error getting cached translation:", error)
        return null
    }
}

/**
 * Cache a translation
 */
export async function cacheTranslation(
    sourceText: string,
    targetLanguage: Language,
    sourceLanguage: Language,
    translatedText: string,
    ttlHours = 24,
): Promise<boolean> {
    try {
        // Create a hash of the source text to use as document ID
        const cacheKey = createCacheKey(sourceText, targetLanguage, sourceLanguage)

        // Calculate expiration time
        const now = new Date()
        const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000)

        // Save to Firestore
        const docRef = doc(db, CACHE_COLLECTION, cacheKey)
        await setDoc(docRef, {
            sourceText,
            targetLanguage,
            sourceLanguage,
            translatedText,
            timestamp: now,
            expiresAt,
        })

        return true
    } catch (error) {
        console.error("Error caching translation:", error)
        return false
    }
}

/**
 * Clear all translation cache
 */
export async function clearTranslationCache(): Promise<boolean> {
    try {
        const cacheRef = collection(db, CACHE_COLLECTION)
        const snapshot = await getDocs(cacheRef)

        // Delete all documents in the collection
        const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref))
        await Promise.all(deletePromises)

        return true
    } catch (error) {
        console.error("Error clearing translation cache:", error)
        return false
    }
}

/**
 * Create a cache key for a translation
 */
function createCacheKey(sourceText: string, targetLanguage: Language, sourceLanguage: Language): string {
    // Simple hash function for the source text
    let hash = 0
    for (let i = 0; i < sourceText.length; i++) {
        const char = sourceText.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash // Convert to 32bit integer
    }

    return `${hash}_${sourceLanguage}_${targetLanguage}`
}
