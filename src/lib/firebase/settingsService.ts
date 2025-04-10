import { db } from "@/lib/firebase/firebaseConfig"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"

// Define settings types
export interface GeneralSettings {
    siteName: string
    siteDescription: string
    contactEmail: string
    enableComments: boolean
    enableLikes: boolean
    itemsPerPage: number
}

export interface SeoSettings {
    metaTitle: string
    metaDescription: string
    ogImage: string
    googleAnalyticsId: string
}

export interface FirebaseSettings {
    imageQuality: "low" | "medium" | "high"
    maxImageSize: number
    maxVideoSize: number
    enableImageCompression: boolean
    // Removed enableVideoCompression
}

export interface AllSettings {
    general: GeneralSettings
    seo: SeoSettings
    firebase: FirebaseSettings
    updatedAt?: Date
}

// Default settings in case none exist in the database
export const defaultSettings: AllSettings = {
    general: {
        siteName: "Cat Showcase",
        siteDescription: "A showcase of beautiful cats available for adoption.",
        contactEmail: "contact@catshowcase.com",
        enableComments: true,
        enableLikes: true,
        itemsPerPage: 12,
    },
    seo: {
        metaTitle: "Cat Showcase - Beautiful Cats for Adoption",
        metaDescription:
            "Discover beautiful cats available for adoption. Browse our showcase of cats with detailed profiles and high-quality images.",
        ogImage: "https://example.com/images/og-image.jpg",
        googleAnalyticsId: "",
    },
    firebase: {
        imageQuality: "high",
        maxImageSize: 5,
        maxVideoSize: 20,
        enableImageCompression: true,
        // Removed enableVideoCompression: true
    },
}

// Document ID for settings
const SETTINGS_DOC_ID = "app_settings"

/**
 * Get all application settings
 */
export async function getSettings(): Promise<AllSettings> {
    try {
        const settingsRef = doc(db, "settings", SETTINGS_DOC_ID)
        const settingsSnap = await getDoc(settingsRef)

        if (settingsSnap.exists()) {
            const data = settingsSnap.data()

            // Handle migration from old schema to new schema
            if (data.firebase && "maxFileSize" in data.firebase && !("maxImageSize" in data.firebase)) {
                // Migrate old maxFileSize to new maxImageSize and maxVideoSize
                const oldMaxFileSize = data.firebase.maxFileSize
                data.firebase.maxImageSize = oldMaxFileSize
                data.firebase.maxVideoSize = oldMaxFileSize * 2 // Double for videos
                delete data.firebase.maxFileSize
            }

            return {
                general: data.general as GeneralSettings,
                seo: data.seo as SeoSettings,
                firebase: data.firebase as FirebaseSettings,
                updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
            }
        }

        // If no settings exist, initialize with defaults and return
        await initializeSettings()
        return { ...defaultSettings }
    } catch (error) {
        console.error("Error fetching settings:", error)
        return { ...defaultSettings }
    }
}

/**
 * Initialize settings with default values
 */
async function initializeSettings(): Promise<void> {
    try {
        const settingsRef = doc(db, "settings", SETTINGS_DOC_ID)
        await setDoc(settingsRef, {
            ...defaultSettings,
            updatedAt: serverTimestamp(),
        })
    } catch (error) {
        console.error("Error initializing settings:", error)
    }
}

/**
 * Update general settings
 */
export async function updateGeneralSettings(settings: GeneralSettings): Promise<boolean> {
    try {
        const settingsRef = doc(db, "settings", SETTINGS_DOC_ID)
        await setDoc(
            settingsRef,
            {
                general: settings,
                updatedAt: serverTimestamp(),
            },
            { merge: true },
        )
        return true
    } catch (error) {
        console.error("Error updating general settings:", error)
        return false
    }
}

/**
 * Update SEO settings
 */
export async function updateSeoSettings(settings: SeoSettings): Promise<boolean> {
    try {
        const settingsRef = doc(db, "settings", SETTINGS_DOC_ID)
        await setDoc(
            settingsRef,
            {
                seo: settings,
                updatedAt: serverTimestamp(),
            },
            { merge: true },
        )
        return true
    } catch (error) {
        console.error("Error updating SEO settings:", error)
        return false
    }
}

/**
 * Update Firebase settings
 */
export async function updateFirebaseSettings(settings: FirebaseSettings): Promise<boolean> {
    try {
        const settingsRef = doc(db, "settings", SETTINGS_DOC_ID)
        await setDoc(
            settingsRef,
            {
                firebase: settings,
                updatedAt: serverTimestamp(),
            },
            { merge: true },
        )
        return true
    } catch (error) {
        console.error("Error updating Firebase settings:", error)
        return false
    }
}
