import { admin } from "@/lib/firebase/admin"
import type { Language } from "@/lib/i18n/types"
import { FieldValue } from "firebase-admin/firestore"
import { format } from "date-fns"

// Collection names
const SETTINGS_DOC_PATH = "settings/translation_settings"
const CACHE_COLLECTION = "translation_cache"
const USAGE_HISTORY_COLLECTION = "translation_usage_history"

// DeepL API base URL
const DEEPL_API_URL = "https://api-free.deepl.com/v2"

// Get DeepL API key from environment variables
const DEEPL_API_KEY = process.env.DEEPL_API_KEY

// Translation settings interface
export interface TranslationSettings {
  enabled: boolean
  customLimit: number
  warningThreshold: number
  criticalThreshold: number
  defaultLanguage: Language
  availableLanguages: Language[]
  cacheEnabled: boolean
  cacheTTL: number // hours
}

// Default settings
export const defaultTranslationSettings: TranslationSettings = {
  enabled: true,
  customLimit: 400000, // 80% of free tier (500,000)
  warningThreshold: 80,
  criticalThreshold: 95,
  defaultLanguage: "en",
  availableLanguages: ["en", "fr", "de", "it", "ro"],
  cacheEnabled: true,
  cacheTTL: 24, // 1 day
}

// DeepL usage interface
export interface DeepLUsage {
  characterCount: number
  characterLimit: number
  percentUsed: number
  limitReached: boolean
  lastChecked: Date
}

/**
 * Get translation settings
 */
export async function getTranslationSettings(): Promise<TranslationSettings> {
  try {
    const settingsRef = admin.db.doc(SETTINGS_DOC_PATH)
    const settingsSnap = await settingsRef.get()

    if (settingsSnap.exists) {
      return settingsSnap.data() as TranslationSettings
    }

    // If no settings exist, initialize with defaults and return
    await initializeTranslationSettings()
    return { ...defaultTranslationSettings }
  } catch (error) {
    console.error("Error fetching translation settings:", error)
    // Return default settings if there's an error
    return { ...defaultTranslationSettings }
  }
}

/**
 * Initialize translation settings with defaults
 */
async function initializeTranslationSettings(): Promise<void> {
  try {
    const settingsRef = admin.db.doc(SETTINGS_DOC_PATH)
    await settingsRef.set({
      ...defaultTranslationSettings,
      updatedAt: FieldValue.serverTimestamp(),
    })
    console.log("Translation settings initialized successfully")
  } catch (error) {
    console.error("Error initializing translation settings:", error)
    // Don't throw, just log the error
  }
}

/**
 * Update translation settings
 */
export async function updateTranslationSettings(settings: Partial<TranslationSettings>): Promise<boolean> {
  try {
    const settingsRef = admin.db.doc(SETTINGS_DOC_PATH)
    await settingsRef.set(
      {
        ...settings,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
    console.log("Translation settings updated successfully")
    return true
  } catch (error) {
    console.error("Error updating translation settings:", error)
    throw error // Re-throw to allow API to handle the error
  }
}

/**
 * Get current usage statistics from DeepL API
 */
export async function getDeepLUsage(): Promise<DeepLUsage> {
  if (!DEEPL_API_KEY) {
    throw new Error("DeepL API key is not set")
  }

  try {
    const response = await fetch(`${DEEPL_API_URL}/usage`, {
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status}`)
    }

    const data = await response.json()

    // Calculate percentage used
    const characterCount = data.character_count
    const characterLimit = data.character_limit
    const percentUsed = (characterCount / characterLimit) * 100
    const limitReached = percentUsed >= 100

    return {
      characterCount,
      characterLimit,
      percentUsed,
      limitReached,
      lastChecked: new Date(),
    }
  } catch (error) {
    console.error("Error fetching DeepL usage:", error)

    // Return default values if API call fails
    return {
      characterCount: 0,
      characterLimit: 500000, // Default DeepL free tier limit
      percentUsed: 0,
      limitReached: false,
      lastChecked: new Date(),
    }
  }
}

/**
 * Translate text using DeepL API
 */
export async function translateText(text: string, targetLang: Language, sourceLang?: Language): Promise<string> {
  if (!DEEPL_API_KEY) {
    throw new Error("DeepL API key is not set")
  }

  // Get translation settings
  const settings = await getTranslationSettings()
  if (!settings.enabled) {
    console.log("Translation is disabled in settings")
    return text
  }

  // Check if we're over the limit
  const usage = await getDeepLUsage()
  if (usage.limitReached || (settings.customLimit && usage.characterCount >= settings.customLimit)) {
    console.log("Translation limit reached")
    return text
  }

  // Skip empty texts
  if (!text || text.trim().length === 0) {
    return text
  }

  // Check cache if enabled
  if (settings.cacheEnabled) {
    const cached = await getCachedTranslation(text, targetLang, sourceLang)
    if (cached) {
      return cached
    }
  }

  try {
    const formData = new URLSearchParams()
    formData.append("text", text)
    formData.append("target_lang", targetLang.toUpperCase())

    if (sourceLang) {
      formData.append("source_lang", sourceLang.toUpperCase())
    }

    const response = await fetch(`${DEEPL_API_URL}/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status}`)
    }

    const data = await response.json()
    const translatedText = data.translations[0].text

    // Cache the translation if enabled
    if (settings.cacheEnabled && translatedText !== text) {
      await cacheTranslation(text, targetLang, sourceLang, translatedText, settings.cacheTTL)
    }

    return translatedText
  } catch (error) {
    console.error("Error translating with DeepL:", error)
    return text // Return original text on error
  }
}

/**
 * Translate multiple texts at once
 */
export async function translateTexts(texts: string[], targetLang: Language, sourceLang?: Language): Promise<string[]> {
  // Process each text
  const translatedTexts = []
  for (const text of texts) {
    const translatedText = await translateText(text, targetLang, sourceLang)
    translatedTexts.push(translatedText)
  }
  return translatedTexts
}

/**
 * Get a cached translation
 */
export async function getCachedTranslation(
  sourceText: string,
  targetLanguage: Language,
  sourceLanguage?: Language,
): Promise<string | null> {
  try {
    // Create a hash of the source text to use as document ID
    const cacheKey = createCacheKey(sourceText, targetLanguage, sourceLanguage || "auto")

    // Get the document from Firestore
    const docRef = admin.db.collection(CACHE_COLLECTION).doc(cacheKey)
    const docSnap = await docRef.get()

    if (docSnap.exists) {
      const data = docSnap.data() as {
        sourceText: string
        targetLanguage: Language
        sourceLanguage: string
        translatedText: string
        timestamp: any
        expiresAt: any
      }

      // Check if the cache has expired
      if (new Date() > data.expiresAt.toDate()) {
        // Cache has expired, delete it
        await docRef.delete()
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
  sourceLanguage: Language | undefined,
  translatedText: string,
  ttlHours = 24,
): Promise<boolean> {
  try {
    // Create a hash of the source text to use as document ID
    const cacheKey = createCacheKey(sourceText, targetLanguage, sourceLanguage || "auto")

    // Calculate expiration time
    const now = new Date()
    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000)

    // Save to Firestore
    const docRef = admin.db.collection(CACHE_COLLECTION).doc(cacheKey)
    await docRef.set({
      sourceText,
      targetLanguage,
      sourceLanguage: sourceLanguage || "auto",
      translatedText,
      timestamp: admin.firestore.Timestamp.fromDate(now),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
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
    const cacheRef = admin.db.collection(CACHE_COLLECTION)
    const snapshot = await cacheRef.limit(500).get()

    // Delete documents in batches
    const batchSize = snapshot.size
    if (batchSize === 0) {
      return true
    }

    // Delete in batches of 500
    const batch = admin.db.batch()
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    await batch.commit()

    // If we hit the limit, recursively delete more
    if (batchSize >= 500) {
      return clearTranslationCache()
    }

    return true
  } catch (error) {
    console.error("Error clearing translation cache:", error)
    return false
  }
}

/**
 * Get translation usage history
 */
export async function getTranslationUsageHistory(limit = 30): Promise<any[]> {
  try {
    const historyRef = admin.db.collection(USAGE_HISTORY_COLLECTION)
    const snapshot = await historyRef.orderBy("date", "desc").limit(limit).get()

    const history = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        date: data.date,
        count: data.characterCount || 0,
      }
    })

    return history
  } catch (error) {
    console.error("Error fetching translation usage history:", error)
    return []
  }
}

/**
 * Record translation usage
 */
export async function recordTranslationUsage(characterCount: number): Promise<boolean> {
  try {
    if (typeof characterCount !== "number" || characterCount < 0) {
      throw new Error("Invalid character count")
    }

    // Get today's date in YYYY-MM-DD format
    const today = format(new Date(), "yyyy-MM-dd")

    // Check if we already have an entry for today
    const docRef = admin.db.collection(USAGE_HISTORY_COLLECTION).doc(today)
    const docSnap = await docRef.get()

    if (docSnap.exists) {
      // Update the existing entry
      await docRef.update({
        characterCount,
        updatedAt: FieldValue.serverTimestamp(),
      })
    } else {
      // Create a new entry for today
      await docRef.set({
        date: today,
        characterCount,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    return true
  } catch (error) {
    console.error("Error recording translation usage:", error)
    return false
  }
}

/**
 * Create a cache key for a translation
 */
function createCacheKey(sourceText: string, targetLanguage: Language, sourceLanguage: string): string {
  // Simple hash function for the source text
  let hash = 0
  for (let i = 0; i < sourceText.length; i++) {
    const char = sourceText.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  return `${hash}_${sourceLanguage}_${targetLanguage}`
}
