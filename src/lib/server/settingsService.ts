// lib/server/settingsService.ts
import { adminDb } from "@/lib/firebase/admin"
import { FieldValue, Timestamp } from "firebase-admin/firestore"
import type { SeoSettings, FirebaseSettings, AllSettings } from "@/lib/firebase/settingsService"
import { serverLogger } from "@/lib/utils/server-logger"
import { lockMedia, getAllMedia } from "@/lib/server/mediaService"

// Document ID for settings
const SETTINGS_DOC_ID = "app_settings"

/**
 * Get all application settings
 */
export async function getSettings(): Promise<AllSettings> {
  try {
    const settingsRef = adminDb.collection("settings").doc(SETTINGS_DOC_ID)
    const settingsSnap = await settingsRef.get()

    if (settingsSnap.exists) {
      const data = settingsSnap.data() as any // Use any for initial data to handle potential schema issues

      // Handle migration from old schema to new schema
      if (
        data.firebase &&
        typeof data.firebase === "object" &&
        "maxFileSize" in data.firebase &&
        !("maxImageSize" in data.firebase)
      ) {
        // Create a properly typed firebase settings object with the old data
        const firebaseSettings = data.firebase as Record<string, any>

        // Migrate old maxFileSize to new maxImageSize and maxVideoSize
        const oldMaxFileSize = Number(firebaseSettings.maxFileSize)

        // Create a new firebase settings object with the migrated values
        const updatedFirebaseSettings: FirebaseSettings = {
          imageQuality: firebaseSettings.imageQuality || "high",
          maxImageSize: oldMaxFileSize,
          maxVideoSize: oldMaxFileSize * 2, // Double for videos
          enableImageCompression: firebaseSettings.enableImageCompression ?? true,
        }

        // Update the data object with the new firebase settings
        data.firebase = updatedFirebaseSettings
      }

      // Ensure SEO settings exist and have all required fields
      const defaultSeoSettings: SeoSettings = {
        metaTitle: "Red Cat Cuasar - Premium British Shorthair Cats & Kittens",
        metaDescription:
          "Discover premium British Shorthair cats and kittens from Red Cat Cuasar.Health-tested breeding program with champion bloodlines. Professional cattery specializing in British Shorthair temperament, colors, and quality.",
        ogImage: "",
        googleAnalyticsId: "",
      }

      const defaultFirebaseSettings: FirebaseSettings = {
        imageQuality: "high",
        maxImageSize: 5,
        maxVideoSize: 20,
        enableImageCompression: true,
      }

      // Handle Firestore timestamp conversion
      let updatedAt = new Date()
      if (data.updatedAt) {
        if (data.updatedAt instanceof Timestamp) {
          updatedAt = data.updatedAt.toDate()
        } else if (data.updatedAt._seconds !== undefined) {
          updatedAt = new Date(data.updatedAt._seconds * 1000)
        }
      }

      // Return with defaults for any missing fields
      return {
        seo: {
          ...defaultSeoSettings,
          ...(data.seo || {}),
        },
        firebase: {
          ...defaultFirebaseSettings,
          ...(data.firebase || {}),
        },
        updatedAt,
      }
    }

    // If no settings exist, initialize with defaults and return
    await initializeSettings()

    const defaultSettings: AllSettings = {
      seo: {
        metaTitle: "Red Cat Cuasar - Premium British Shorthair Cats & Kittens",
        metaDescription:
          "Discover premium British Shorthair cats and kittens from Red Cat Cuasar. GCCF-registered, health-tested breeding program with champion bloodlines. Professional cattery specializing in British Shorthair temperament, colors, and quality.",
        ogImage: "",
        googleAnalyticsId: "",
      },
      firebase: {
        imageQuality: "high",
        maxImageSize: 5,
        maxVideoSize: 20,
        enableImageCompression: true,
      },
      updatedAt: new Date(),
    }

    return defaultSettings
  } catch (error) {
    serverLogger.error("Error fetching settings:", error)
    throw error
  }
}

/**
 * Initialize settings with defaults
 */
async function initializeSettings(): Promise<void> {
  try {
    const defaultSettings = {
      seo: {
        metaTitle: "Red Cat Cuasar - Premium British Shorthair Cats & Kittens",
        metaDescription:
          "Discover premium British Shorthair cats and kittens from Red Cat Cuasar. GCCF-registered, health-tested breeding program with champion bloodlines. Professional cattery specializing in British Shorthair temperament, colors, and quality.",
        ogImage: "",
        googleAnalyticsId: "",
        updatedAt: FieldValue.serverTimestamp(),
      },
      firebase: {
        imageQuality: "high",
        maxImageSize: 5,
        maxVideoSize: 20,
        enableImageCompression: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    }

    const settingsRef = adminDb.collection("settings").doc(SETTINGS_DOC_ID)
    await settingsRef.set(defaultSettings)
    serverLogger.info("Settings initialized with defaults")
  } catch (error) {
    serverLogger.error("Error initializing settings:", error)
    throw error
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
    serverLogger.error("Error fetching SEO settings:", error)
    throw error
  }
}

/**
 * Update SEO settings
 */
export async function updateSeoSettings(settings: SeoSettings): Promise<boolean> {
  try {
    serverLogger.info("Updating SEO settings")

    // Get current settings to check if OG image changed
    const currentSettings = await getSeoSettings()
    const ogImageChanged = currentSettings.ogImage !== settings.ogImage && settings.ogImage

    // Validate settings
    const { valid, errors } = validateSeoSettings(settings)
    if (!valid) {
      const errorMessage = Object.values(errors).join(", ")
      serverLogger.error(`Invalid SEO settings: ${errorMessage}`)
      throw new Error(`Invalid SEO settings: ${errorMessage}`)
    }

    // Update the settings in app_settings document
    const settingsRef = adminDb.collection("settings").doc(SETTINGS_DOC_ID)
    await settingsRef.set(
      {
        seo: settings,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    // If the OG image has changed, lock the new image
    if (ogImageChanged) {
      try {
        // Fix: Pass an object instead of a boolean to getAllMedia
        const mediaResult = await getAllMedia({ includeDeleted: false })

        // Fix: Access the media property from the result
        const mediaItem = mediaResult.media.find((item) => item.url === settings.ogImage)

        if (mediaItem) {
          // Fix: Add the required userId parameter to lockMedia
          const userId = "system" // Use a system identifier for automated operations
          await lockMedia(mediaItem.id, "OpenGraph image used in SEO settings", userId)
          serverLogger.info("Locked OpenGraph image:", settings.ogImage)
        }
      } catch (lockError) {
        serverLogger.error("Error locking OpenGraph image:", lockError)
        // Continue even if locking fails - the settings were updated successfully
      }
    }

    serverLogger.info("SEO settings updated successfully")
    return true
  } catch (error) {
    serverLogger.error("Error updating SEO settings:", error)
    throw error
  }
}

/**
 * Update Firebase settings
 */
export async function updateFirebaseSettings(settings: FirebaseSettings): Promise<boolean> {
  try {
    serverLogger.info("Updating Firebase settings")

    // Validate settings
    const { valid, errors } = validateFirebaseSettings(settings)
    if (!valid) {
      const errorMessage = Object.values(errors).join(", ")
      serverLogger.error(`Invalid Firebase settings: ${errorMessage}`)
      throw new Error(`Invalid Firebase settings: ${errorMessage}`)
    }

    const settingsRef = adminDb.collection("settings").doc(SETTINGS_DOC_ID)
    await settingsRef.set(
      {
        firebase: settings,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    serverLogger.info("Firebase settings updated successfully")
    return true
  } catch (error) {
    serverLogger.error("Error updating Firebase settings:", error)
    throw error
  }
}

/**
 * Validate SEO settings
 */
export function validateSeoSettings(settings: SeoSettings): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  // Validate meta title
  if (!settings.metaTitle?.trim()) {
    errors.metaTitle = "Meta title is required"
  } else if (settings.metaTitle.length > 60) {
    errors.metaTitle = "Meta title should be 60 characters or less"
  }

  // Validate meta description
  if (!settings.metaDescription?.trim()) {
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

/**
 * Get translation settings
 */
export interface TranslationSettings {
  enabled: boolean
  availableLanguages: string[]
  defaultLanguage: string
  cacheEnabled: boolean
  cacheTTL: number // in hours
}

export async function getTranslationSettings(): Promise<TranslationSettings> {
  try {
    const settingsRef = adminDb.collection("settings").doc("translation_settings")
    const settingsSnap = await settingsRef.get()

    if (settingsSnap.exists) {
      const data = settingsSnap.data() as TranslationSettings
      return {
        enabled: data.enabled ?? true,
        availableLanguages: data.availableLanguages ?? ["en", "es", "fr", "de", "it", "ro"],
        defaultLanguage: data.defaultLanguage ?? "en",
        cacheEnabled: data.cacheEnabled ?? true,
        cacheTTL: data.cacheTTL ?? 24, // Default 24 hours
      }
    }

    // If no settings exist, initialize with defaults and return
    const defaultSettings: TranslationSettings = {
      enabled: true,
      availableLanguages: ["en", "es", "fr", "de", "it", "ro"],
      defaultLanguage: "en",
      cacheEnabled: true,
      cacheTTL: 24,
    }

    await settingsRef.set(defaultSettings)
    serverLogger.info("Translation settings initialized with defaults")

    return defaultSettings
  } catch (error) {
    serverLogger.error("Error fetching translation settings:", error)
    // Return defaults if there's an error
    return {
      enabled: true,
      availableLanguages: ["en", "es", "fr", "de", "it", "ro"],
      defaultLanguage: "en",
      cacheEnabled: true,
      cacheTTL: 24,
    }
  }
}

/**
 * Update translation settings
 */
export async function updateTranslationSettings(settings: TranslationSettings): Promise<boolean> {
  try {
    serverLogger.info("Updating translation settings")

    const settingsRef = adminDb.collection("settings").doc("translation_settings")
    await settingsRef.set(settings, { merge: true })

    serverLogger.info("Translation settings updated successfully")
    return true
  } catch (error) {
    serverLogger.error("Error updating translation settings:", error)
    throw error
  }
}
