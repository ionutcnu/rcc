import { db } from "@/lib/firebase/firebaseConfig"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { lockMedia, getAllMedia } from "./storageService"

// Define interfaces
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
}

export interface AllSettings {
    seo: SeoSettings
    firebase: FirebaseSettings
    updatedAt?: Date
}

// Default SEO settings
export const defaultSeoSettings: SeoSettings = {
    metaTitle: "Red Cat Cuasar - Premium British Shorthair Cats & Kittens",
    metaDescription:
      "Discover premium British Shorthair cats and kittens from Red Cat Cuasar. Health-tested breeding program with champion bloodlines. Professional cattery specializing in British Shorthair temperament, colors, and quality.",
    ogImage: "",
    googleAnalyticsId: "",
}

// Default settings
export const defaultSettings: AllSettings = {
    seo: defaultSeoSettings,
    firebase: {
        imageQuality: "high",
        maxImageSize: 5,
        maxVideoSize: 20,
        enableImageCompression: true,
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

            // Ensure SEO settings exist and have all required fields
            const seoSettings = data.seo || defaultSettings.seo

            return {
                seo: {
                    ...defaultSettings.seo, // Ensure all default fields exist
                    ...seoSettings, // Override with any existing values
                },
                firebase: {
                    ...defaultSettings.firebase, // Ensure all default fields exist
                    ...(data.firebase as FirebaseSettings), // Override with any existing values
                },
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
 * Initialize settings with defaults
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
 * Get SEO settings
 */
export async function getSeoSettings(): Promise<SeoSettings> {
    try {
        // Get all settings and return just the SEO portion
        const allSettings = await getSettings()
        return allSettings.seo
    } catch (error) {
        console.error("Error fetching SEO settings:", error)
        return { ...defaultSeoSettings }
    }
}

/**
 * Update SEO settings
 */
export async function updateSeoSettings(settings: SeoSettings): Promise<boolean> {
    try {
        // Get current settings to check if OG image changed
        const currentSettings = await getSeoSettings()
        const ogImageChanged = currentSettings.ogImage !== settings.ogImage && settings.ogImage

        // Update the settings in app_settings document
        const settingsRef = doc(db, "settings", SETTINGS_DOC_ID)
        await setDoc(
          settingsRef,
          {
              seo: settings,
              updatedAt: serverTimestamp(),
          },
          { merge: true },
        )

        // If the OG image has changed, lock the new image
        if (ogImageChanged) {
            try {
                // Find the media item for this URL
                const allMedia = await getAllMedia(true)
                const mediaItem = allMedia.find((item) => item.url === settings.ogImage)

                if (mediaItem) {
                    // Lock the media item
                    await lockMedia(mediaItem, "OpenGraph image used in SEO settings")
                    console.log("Locked OpenGraph image:", settings.ogImage)
                }
            } catch (lockError) {
                console.error("Error locking OpenGraph image:", lockError)
                // Continue even if locking fails - the settings were updated successfully
            }
        }

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

/**
 * Validate SEO settings
 */
export function validateSeoSettings(settings: SeoSettings): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}

    // Validate meta title
    if (!settings.metaTitle.trim()) {
        errors.metaTitle = "Meta title is required"
    } else if (settings.metaTitle.length > 60) {
        errors.metaTitle = "Meta title should be 60 characters or less"
    }

    // Validate meta description
    if (!settings.metaDescription.trim()) {
        errors.metaDescription = "Meta description is required"
    } else if (settings.metaDescription.length > 160) {
        errors.metaDescription = "Meta description should be 160 characters or less"
    }

    // Validate OG image URL (if provided)
    if (settings.ogImage && !isValidUrl(settings.ogImage)) {
        errors.ogImage = "Invalid URL format"
    }

    // Validate Google Analytics ID (if provided)
    if (settings.googleAnalyticsId && !isValidGAID(settings.googleAnalyticsId)) {
        errors.googleAnalyticsId = "Invalid Google Analytics ID format (should be G-XXXXXXXXXX)"
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    }
}

/**
 * Validate Firebase settings
 */
export function validateFirebaseSettings(settings: FirebaseSettings): {
    valid: boolean
    errors: Record<string, string>
} {
    const errors: Record<string, string> = {}

    // Validate image quality
    if (!["low", "medium", "high"].includes(settings.imageQuality)) {
        errors.imageQuality = "Image quality must be low, medium, or high"
    }

    // Validate max image size
    if (typeof settings.maxImageSize !== "number" || settings.maxImageSize <= 0 || settings.maxImageSize > 50) {
        errors.maxImageSize = "Max image size must be between 1 and 50 MB"
    }

    // Validate max video size
    if (typeof settings.maxVideoSize !== "number" || settings.maxVideoSize <= 0 || settings.maxVideoSize > 200) {
        errors.maxVideoSize = "Max video size must be between 1 and 200 MB"
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    }
}

// Helper function to validate URL format
function isValidUrl(url: string): boolean {
    try {
        new URL(url)
        return true
    } catch (e) {
        return false
    }
}

// Helper function to validate Google Analytics ID format
function isValidGAID(gaId: string): boolean {
    // Accept G-XXXXXXXX format
    return /^G-[A-Z0-9]+$/.test(gaId)
}
