import { db } from "@/lib/firebase/firebaseConfig"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"

// Import the necessary functions at the top of the file if they don't already exist
import { lockMedia, getAllMedia } from "./storageService"

// Define SEO settings interface
export interface SeoSettings {
    metaTitle: string
    metaDescription: string
    ogImage: string
    googleAnalyticsId: string
}

// Default SEO settings
export const defaultSeoSettings: SeoSettings = {
    metaTitle: "Cat Showcase - Beautiful Cats for Adoption",
    metaDescription:
        "Discover beautiful cats available for adoption. Browse our showcase of cats with detailed profiles and high-quality images.",
    ogImage: "",
    googleAnalyticsId: "",
}

// Document ID for SEO settings
const SEO_SETTINGS_DOC_ID = "seo_settings"

/**
 * Get SEO settings
 */
export async function getSeoSettings(): Promise<SeoSettings> {
    try {
        const settingsRef = doc(db, "settings", SEO_SETTINGS_DOC_ID)
        const settingsSnap = await getDoc(settingsRef)

        if (settingsSnap.exists()) {
            return settingsSnap.data() as SeoSettings
        }

        // If no settings exist, initialize with defaults and return
        await initializeSeoSettings()
        return { ...defaultSeoSettings }
    } catch (error) {
        console.error("Error fetching SEO settings:", error)
        return { ...defaultSeoSettings }
    }
}

/**
 * Initialize SEO settings with defaults
 */
async function initializeSeoSettings(): Promise<void> {
    try {
        const settingsRef = doc(db, "settings", SEO_SETTINGS_DOC_ID)
        await setDoc(settingsRef, {
            ...defaultSeoSettings,
            updatedAt: serverTimestamp(),
        })
    } catch (error) {
        console.error("Error initializing SEO settings:", error)
    }
}

// Update the updateSeoSettings function to lock the OG image
export async function updateSeoSettings(settings: SeoSettings): Promise<boolean> {
    try {
        const settingsRef = doc(db, "settings", SEO_SETTINGS_DOC_ID)

        // Check if the OG image has changed
        const currentSettings = await getSeoSettings()
        const ogImageChanged = currentSettings.ogImage !== settings.ogImage && settings.ogImage

        // Update the settings
        await setDoc(
            settingsRef,
            {
                ...settings,
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
