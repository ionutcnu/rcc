import { admin } from "@/lib/firebase/admin"
import type { Language } from "@/lib/i18n/types"
import { FieldValue } from "firebase-admin/firestore"
import { format } from "date-fns"
import { redis } from "@/lib/redis"

// Collection names
const SETTINGS_DOC_PATH = "settings/translation_settings"
const USAGE_HISTORY_COLLECTION = "translation_usage_history"

// Redis key prefixes
const TRANSLATION_KEY_PREFIX = "translation:"
const LANGUAGE_PAIR_PREFIX = "lang_pair:"

// DeepL API base URL
const DEEPL_API_URL = "https://api-free.deepl.com/v2"

// Get DeepL API key from environment variables
const DEEPL_API_KEY = process.env.DEEPL_API_KEY

// Rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds
const MAX_REQUESTS_PER_MINUTE = 5 // Maximum requests per minute
let requestTimestamps: number[] = []
let isRateLimited = false
let rateLimitResetTime = 0

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
  useGroupedCache: boolean // New setting for grouped cache
  storeUsageInRedis: boolean // New setting for storing usage in Redis
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
  useGroupedCache: true, // Enable grouped cache by default
  storeUsageInRedis: false, // Default to Firebase storage for backward compatibility
}

// DeepL usage interface
export interface DeepLUsage {
  characterCount: number
  characterLimit: number
  percentUsed: number
  limitReached: boolean
  lastChecked: Date
}

// Interface for cached translation
interface CachedTranslation {
  sourceText: string
  targetLanguage: Language
  sourceLanguage: string
  translatedText: string
  timestamp: string
  expiresAt: string
}

// Interface for grouped cache
interface GroupedCache {
  translations: Record<string, CachedTranslation>
  updatedAt: string
  expiresAt: string
}

/**
 * Check if we're currently rate limited
 */
function checkRateLimit(): boolean {
  const now = Date.now()

  // If we're in a rate limited state, check if it's time to reset
  if (isRateLimited) {
    if (now >= rateLimitResetTime) {
      console.log("Rate limit period expired, resetting rate limiter")
      isRateLimited = false
      requestTimestamps = []
    } else {
      return true // Still rate limited
    }
  }

  // Remove timestamps older than the window
  requestTimestamps = requestTimestamps.filter((time) => now - time < RATE_LIMIT_WINDOW)

  // Check if we've hit the limit
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    console.log(`Rate limit reached: ${requestTimestamps.length} requests in the last minute`)
    isRateLimited = true
    rateLimitResetTime = now + RATE_LIMIT_WINDOW
    return true
  }

  // Not rate limited, add current timestamp
  requestTimestamps.push(now)
  return false
}

/**
 * Get translation settings
 */
export async function getTranslationSettings(): Promise<TranslationSettings> {
  try {
    const settingsRef = admin.db.doc(SETTINGS_DOC_PATH)
    const settingsSnap = await settingsRef.get()

    if (settingsSnap.exists) {
      const settings = settingsSnap.data() as TranslationSettings
      // Ensure the useGroupedCache property exists (for backward compatibility)
      if (settings.useGroupedCache === undefined) {
        settings.useGroupedCache = defaultTranslationSettings.useGroupedCache
      }
      return settings
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

  // Check if we're rate limited
  if (checkRateLimit()) {
    console.warn("Rate limited, returning estimated usage")
    return {
      characterCount: 400000, // Conservative estimate
      characterLimit: 500000,
      percentUsed: 80,
      limitReached: false,
      lastChecked: new Date(),
    }
  }

  try {
    const response = await fetch(`${DEEPL_API_URL}/usage`, {
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      },
    })

    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        console.warn("DeepL API rate limit reached. Returning estimated usage.")
        isRateLimited = true
        rateLimitResetTime = Date.now() + 60 * 1000 // Reset after 1 minute
        return {
          characterCount: 500000, // Assume we've hit the limit
          characterLimit: 500000,
          percentUsed: 100,
          limitReached: true,
          lastChecked: new Date(),
        }
      }

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
 * Clean up translation text by removing separator markers
 */
function cleanTranslatedText(text: string): string {
  // Remove any TRADUZIONE_SEPARATORE markers
  return text.replace(/TRADUZIONE_SEPARATORE-+/g, "").trim()
}

/**
 * Translate a single large text using DeepL API
 * This is more efficient for large blocks of text
 */
export async function translateSingleText(text: string, targetLang: Language, sourceLang?: Language): Promise<string> {
  if (!DEEPL_API_KEY) {
    console.warn("DeepL API key is not set, returning original text")
    return text
  }

  // Check if we're rate limited
  if (checkRateLimit()) {
    console.warn("Rate limited, returning original text")
    return text
  }

  // Skip empty texts
  if (!text || text.trim().length === 0) {
    return text
  }

  try {
    const formData = new URLSearchParams()
    formData.append("text", text)
    formData.append("target_lang", targetLang.toUpperCase())

    if (sourceLang) {
      formData.append("source_lang", sourceLang.toUpperCase())
    }

    console.log(`Translating large text (${text.length} chars) to ${targetLang}`)

    const response = await fetch(`${DEEPL_API_URL}/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      // Handle rate limiting with a more user-friendly approach
      if (response.status === 429) {
        console.warn("DeepL API rate limit reached. Returning original text.")
        isRateLimited = true
        rateLimitResetTime = Date.now() + 60 * 1000 // Reset after 1 minute
        return text
      }

      throw new Error(`DeepL API error: ${response.status}`)
    }

    const data = await response.json()
    const translatedText = data.translations[0].text

    // Clean up the translated text
    return cleanTranslatedText(translatedText)
  } catch (error) {
    console.error("Error translating with DeepL:", error)
    return text // Return original text on error
  }
}

/**
 * Translate text using DeepL API
 */
export async function translateText(text: string, targetLang: Language, sourceLang?: Language): Promise<string> {
  if (!DEEPL_API_KEY) {
    console.warn("DeepL API key is not set, returning original text")
    return text
  }

  // Get translation settings
  const settings = await getTranslationSettings()
  if (!settings.enabled) {
    console.log("Translation is disabled in settings")
    return text
  }

  // Check if target language is supported
  if (!settings.availableLanguages.includes(targetLang)) {
    console.warn(`Target language ${targetLang} is not in the available languages list`)
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
      console.log(
        `[CACHE HIT] Found cached translation for: "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"`,
      )
      return cached
    }
  }

  try {
    // Check if we're over the limit before making the API call
    const usage = await getDeepLUsage()
    if (usage.limitReached || (settings.customLimit && usage.characterCount >= settings.customLimit)) {
      console.warn("Translation limit reached, returning original text")
      return text
    }

    // Check if we're rate limited
    if (checkRateLimit()) {
      console.warn("Rate limited, returning original text")
      return text
    }

    const formData = new URLSearchParams()
    formData.append("text", text)
    formData.append("target_lang", targetLang.toUpperCase())

    if (sourceLang) {
      formData.append("source_lang", sourceLang.toUpperCase())
    }

    console.log(`Translating text: "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}" to ${targetLang}`)

    const response = await fetch(`${DEEPL_API_URL}/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      // Handle rate limiting with a more user-friendly approach
      if (response.status === 429) {
        console.warn("DeepL API rate limit reached. Returning original text.")
        isRateLimited = true
        rateLimitResetTime = Date.now() + 60 * 1000 // Reset after 1 minute
        return text
      }

      throw new Error(`DeepL API error: ${response.status}`)
    }

    const data = await response.json()
    let translatedText = data.translations[0].text

    // Clean up the translated text
    translatedText = cleanTranslatedText(translatedText)

    // Cache the translation if enabled
    if (settings.cacheEnabled && translatedText !== text) {
      await cacheTranslation(text, targetLang, sourceLang, translatedText, settings.cacheTTL)
      console.log(`[CACHE STORE] Cached translation for: "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"`)
    }

    return translatedText
  } catch (error) {
    console.error("Error translating with DeepL:", error)
    // Don't throw the error up, just return the original text
    return text
  }
}

/**
 * Translate multiple texts at once - optimized to use a single API call
 */
export async function translateTexts(texts: string[], targetLang: Language, sourceLang?: Language): Promise<string[]> {
  if (!DEEPL_API_KEY) {
    console.warn("DeepL API key is not set, returning original texts")
    return [...texts]
  }

  // Get translation settings
  const settings = await getTranslationSettings()
  if (!settings.enabled) {
    console.log("Translation is disabled in settings")
    return [...texts]
  }

  // Check if target language is supported
  if (!settings.availableLanguages.includes(targetLang)) {
    console.warn(`Target language ${targetLang} is not in the available languages list`)
    return [...texts]
  }

  // Filter out empty texts
  const nonEmptyTexts = texts.filter((text) => text && text.trim().length > 0)
  if (nonEmptyTexts.length === 0) {
    return [...texts]
  }

  // Check if we're rate limited
  if (checkRateLimit()) {
    console.warn("Rate limited, returning original texts")
    return [...texts]
  }

  // Check cache for all texts first
  const results: string[] = []
  const textsToTranslate: string[] = []
  const originalIndices: number[] = []

  if (settings.cacheEnabled) {
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i]

      // Skip empty texts
      if (!text || text.trim().length === 0) {
        results[i] = text
        continue
      }

      const cached = await getCachedTranslation(text, targetLang, sourceLang)
      if (cached) {
        console.log(`[CACHE HIT] Found cached translation for text at index ${i}`)
        results[i] = cached
      } else {
        textsToTranslate.push(text)
        originalIndices.push(i)
      }
    }
  } else {
    // If cache is disabled, translate all non-empty texts
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i]
      if (!text || text.trim().length === 0) {
        results[i] = text
      } else {
        textsToTranslate.push(text)
        originalIndices.push(i)
      }
    }
  }

  // If all texts were in cache, return the results
  if (textsToTranslate.length === 0) {
    return results
  }

  try {
    // Check if we're over the limit before making the API call
    const usage = await getDeepLUsage()
    if (usage.limitReached || (settings.customLimit && usage.characterCount >= settings.customLimit)) {
      console.warn("Translation limit reached, returning original texts")
      // Fill in the missing translations with original texts
      for (let i = 0; i < originalIndices.length; i++) {
        results[originalIndices[i]] = texts[originalIndices[i]]
      }
      return results
    }

    // Combine all texts into a single API call using DeepL's array format
    console.log(`Translating ${textsToTranslate.length} texts in a single API call`)

    // Create the request body
    const formData = new URLSearchParams()

    // Add each text as a separate parameter
    textsToTranslate.forEach((text) => {
      formData.append("text", text)
    })

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
      // Handle rate limiting
      if (response.status === 429) {
        console.warn("DeepL API rate limit reached. Returning original texts.")
        isRateLimited = true
        rateLimitResetTime = Date.now() + 60 * 1000 // Reset after 1 minute

        // Fill in the missing translations with original texts
        for (let i = 0; i < originalIndices.length; i++) {
          results[originalIndices[i]] = texts[originalIndices[i]]
        }
        return results
      }

      throw new Error(`DeepL API error: ${response.status}`)
    }

    const data = await response.json()
    const translatedTexts = data.translations.map((t: any) => {
      // Clean up each translated text
      return cleanTranslatedText(t.text)
    })

    // Cache the translations and update the results array
    const translationsToCache: Record<string, CachedTranslation> = {}

    for (let i = 0; i < translatedTexts.length; i++) {
      const originalIndex = originalIndices[i]
      const originalText = texts[originalIndex]
      const translatedText = translatedTexts[i]

      results[originalIndex] = translatedText

      // Prepare for caching if enabled
      if (settings.cacheEnabled && translatedText !== originalText) {
        const now = new Date()
        const expiresAt = new Date(now.getTime() + settings.cacheTTL * 60 * 60 * 1000)

        if (settings.useGroupedCache) {
          // Add to grouped cache object
          const cacheKey = createCacheKey(originalText, targetLang, sourceLang || "auto")
          translationsToCache[cacheKey] = {
            sourceText: originalText,
            targetLanguage: targetLang,
            sourceLanguage: sourceLang || "auto",
            translatedText,
            timestamp: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
          }
        } else {
          // Cache individually
          await cacheTranslation(originalText, targetLang, sourceLang, translatedText, settings.cacheTTL)
        }
      }
    }

    // If using grouped cache and we have translations to cache, store them all at once
    if (settings.useGroupedCache && settings.cacheEnabled && Object.keys(translationsToCache).length > 0) {
      await cacheTranslationsGroup(translationsToCache, targetLang, sourceLang || "auto", settings.cacheTTL)
    }

    // Fill in any missing results with original texts
    for (let i = 0; i < texts.length; i++) {
      if (results[i] === undefined) {
        results[i] = texts[i]
      }
    }

    return results
  } catch (error) {
    console.error("Error translating texts with DeepL:", error)

    // Fill in the missing translations with original texts
    for (let i = 0; i < originalIndices.length; i++) {
      results[originalIndices[i]] = texts[originalIndices[i]]
    }

    // Make sure all indices have a value
    for (let i = 0; i < texts.length; i++) {
      if (results[i] === undefined) {
        results[i] = texts[i]
      }
    }

    return results
  }
}

/**
 * Get a cached translation from Redis
 * Supports both individual and grouped caching strategies
 */
export async function getCachedTranslation(
  sourceText: string,
  targetLanguage: Language,
  sourceLanguage?: Language,
): Promise<string | null> {
  try {
    const settings = await getTranslationSettings()
    const sourceLanguageKey = sourceLanguage || "auto"

    // Try individual cache first
    const cacheKey = `${TRANSLATION_KEY_PREFIX}${createCacheKey(sourceText, targetLanguage, sourceLanguageKey)}`
    const cachedData = await redis.get(cacheKey)

    if (cachedData) {
      // Handle different types of Redis responses
      let translationData: CachedTranslation | null = null

      if (typeof cachedData === "string") {
        try {
          translationData = JSON.parse(cachedData) as CachedTranslation
        } catch (parseError) {
          console.error("Error parsing cached translation:", parseError)
          return null
        }
      } else if (typeof cachedData === "object" && cachedData !== null) {
        // If Redis returns an object directly
        translationData = cachedData as unknown as CachedTranslation
      }

      if (translationData && translationData.translatedText) {
        return cleanTranslatedText(translationData.translatedText)
      }
    }

    // If individual cache miss and grouped cache is enabled, try grouped cache
    if (settings.useGroupedCache) {
      const groupKey = `${LANGUAGE_PAIR_PREFIX}${sourceLanguageKey}_${targetLanguage}`
      const groupData = await redis.get(groupKey)

      if (groupData) {
        // Handle different types of Redis responses
        let groupCache: GroupedCache | null = null

        if (typeof groupData === "string") {
          try {
            groupCache = JSON.parse(groupData) as GroupedCache
          } catch (parseError) {
            console.error("Error parsing grouped cache:", parseError)
            return null
          }
        } else if (typeof groupData === "object" && groupData !== null) {
          // If Redis returns an object directly
          groupCache = groupData as unknown as GroupedCache
        }

        if (groupCache && groupCache.translations) {
          // Check if this text exists in the group
          const textHash = createCacheKey(sourceText, targetLanguage, sourceLanguageKey)
          const translation = groupCache.translations[textHash]

          if (translation && translation.translatedText) {
            return cleanTranslatedText(translation.translatedText)
          }
        }
      }
    }

    return null
  } catch (error) {
    console.error("Error getting cached translation from Redis:", error)
    return null
  }
}

/**
 * Cache a translation in Redis
 */
export async function cacheTranslation(
  sourceText: string,
  targetLanguage: Language,
  sourceLanguage: Language | undefined,
  translatedText: string,
  ttlHours = 24,
): Promise<boolean> {
  try {
    const settings = await getTranslationSettings()
    const sourceLanguageKey = sourceLanguage || "auto"

    // If using grouped cache, add to the language pair group
    if (settings.useGroupedCache) {
      return await addToGroupCache(sourceText, targetLanguage, sourceLanguageKey, translatedText, ttlHours)
    }

    // Otherwise use individual caching
    const cacheKey = `${TRANSLATION_KEY_PREFIX}${createCacheKey(sourceText, targetLanguage, sourceLanguageKey)}`

    // Calculate expiration time
    const now = new Date()
    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000)

    // Clean up the translated text before caching
    const cleanedText = cleanTranslatedText(translatedText)

    // Prepare data for Redis
    const data = {
      sourceText,
      targetLanguage,
      sourceLanguage: sourceLanguageKey,
      translatedText: cleanedText,
      timestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }

    // Save to Redis with expiration
    await redis.set(cacheKey, JSON.stringify(data), { ex: ttlHours * 60 * 60 })

    return true
  } catch (error) {
    console.error("Error caching translation in Redis:", error)
    return false
  }
}

/**
 * Add a translation to a grouped cache by language pair
 */
async function addToGroupCache(
  sourceText: string,
  targetLanguage: Language,
  sourceLanguage: string,
  translatedText: string,
  ttlHours = 24,
): Promise<boolean> {
  try {
    const groupKey = `${LANGUAGE_PAIR_PREFIX}${sourceLanguage}_${targetLanguage}`
    const textHash = createCacheKey(sourceText, targetLanguage, sourceLanguage)

    // Calculate expiration time
    const now = new Date()
    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000)

    // Clean up the translated text
    const cleanedText = cleanTranslatedText(translatedText)

    // Get existing group or create new one
    let groupCache: GroupedCache = {
      translations: {},
      updatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }

    // Get existing group data
    const existingGroup = await redis.get(groupKey)

    if (existingGroup) {
      // Handle different types of Redis responses
      if (typeof existingGroup === "string") {
        try {
          const parsedGroup = JSON.parse(existingGroup)
          if (parsedGroup && typeof parsedGroup === "object") {
            groupCache = parsedGroup as GroupedCache
          }
        } catch (parseError) {
          console.error("Error parsing existing group cache:", parseError)
          // Continue with new group cache
        }
      } else if (typeof existingGroup === "object" && existingGroup !== null) {
        // If Redis returns an object directly
        groupCache = existingGroup as unknown as GroupedCache
      }

      // Update the expiration time if needed
      if (groupCache.expiresAt && new Date(groupCache.expiresAt) < expiresAt) {
        groupCache.expiresAt = expiresAt.toISOString()
      }
    }

    // Ensure translations object exists
    if (!groupCache.translations) {
      groupCache.translations = {}
    }

    // Add or update the translation in the group
    groupCache.translations[textHash] = {
      sourceText,
      targetLanguage,
      sourceLanguage,
      translatedText: cleanedText,
      timestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }

    groupCache.updatedAt = now.toISOString()

    // Save the updated group to Redis
    await redis.set(groupKey, JSON.stringify(groupCache), { ex: ttlHours * 60 * 60 })

    return true
  } catch (error) {
    console.error("Error adding to group cache:", error)
    return false
  }
}

/**
 * Cache multiple translations at once in a grouped format
 */
async function cacheTranslationsGroup(
  translations: Record<string, CachedTranslation>,
  targetLanguage: Language,
  sourceLanguage: string,
  ttlHours = 24,
): Promise<boolean> {
  try {
    if (Object.keys(translations).length === 0) {
      return true
    }

    const groupKey = `${LANGUAGE_PAIR_PREFIX}${sourceLanguage}_${targetLanguage}`

    // Calculate expiration time
    const now = new Date()
    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000)

    // Initialize new group cache
    let groupCache: GroupedCache = {
      translations: {},
      updatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }

    // Get existing group data
    const existingGroup = await redis.get(groupKey)

    if (existingGroup) {
      // Handle different types of Redis responses
      if (typeof existingGroup === "string") {
        try {
          const parsedGroup = JSON.parse(existingGroup)
          if (parsedGroup && typeof parsedGroup === "object") {
            groupCache = parsedGroup as GroupedCache
          }
        } catch (parseError) {
          console.error("Error parsing existing group cache in cacheTranslationsGroup:", parseError)
          // Continue with new group cache
        }
      } else if (typeof existingGroup === "object" && existingGroup !== null) {
        // If Redis returns an object directly
        groupCache = existingGroup as unknown as GroupedCache
      }

      // Update the expiration time if needed
      if (groupCache.expiresAt && new Date(groupCache.expiresAt) < expiresAt) {
        groupCache.expiresAt = expiresAt.toISOString()
      }
    }

    // Ensure translations object exists
    if (!groupCache.translations) {
      groupCache.translations = {}
    }

    // Merge the translations
    groupCache.translations = {
      ...groupCache.translations,
      ...translations,
    }

    groupCache.updatedAt = now.toISOString()

    // Save the updated group to Redis
    await redis.set(groupKey, JSON.stringify(groupCache), { ex: ttlHours * 60 * 60 })

    console.log(`Cached ${Object.keys(translations).length} translations in group ${groupKey}`)
    return true
  } catch (error) {
    console.error("Error caching translations group:", error)
    return false
  }
}

/**
 * Clear all translation cache from Redis
 */
export async function clearTranslationCache(): Promise<boolean> {
  try {
    // Get all keys with the translation and language pair prefixes
    const translationKeys = await redis.keys(`${TRANSLATION_KEY_PREFIX}*`)
    const langPairKeys = await redis.keys(`${LANGUAGE_PAIR_PREFIX}*`)
    const allKeys = [...translationKeys, ...langPairKeys]

    if (allKeys.length > 0) {
      // Delete all matching keys
      await redis.del(...allKeys)
      console.log(`Cleared ${allKeys.length} translation cache entries from Redis`)
    } else {
      console.log("No translation cache entries to clear")
    }

    return true
  } catch (error) {
    console.error("Error clearing translation cache from Redis:", error)
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
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    // Try a simple ping operation
    await redis.ping()
    return true
  } catch (error) {
    console.error("Redis connection check failed:", error)
    return false
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

    // Get translation settings
    const settings = await getTranslationSettings()

    // Check if Redis is available when storeUsageInRedis is true
    if (settings.storeUsageInRedis) {
      const redisAvailable = await isRedisAvailable()
      if (!redisAvailable) {
        console.warn("Redis is not available, falling back to Firebase storage")
        return recordTranslationUsageInFirebase(characterCount)
      }
      return recordTranslationUsageInRedis(characterCount)
    } else {
      return recordTranslationUsageInFirebase(characterCount)
    }
  } catch (error) {
    console.error("Error recording translation usage:", error)
    return false
  }
}

/**
 * Record translation usage in Firebase
 */
async function recordTranslationUsageInFirebase(characterCount: number): Promise<boolean> {
  try {
    if (typeof characterCount !== "number" || characterCount < 0) {
      throw new Error("Invalid character count")
    }

    // Get today's date in YYYY-MM-dd format
    const today = format(new Date(), "yyyy-MM-dd")

    // Create the Redis key
    const redisKey = `translation_usage:${today}`

    // Initialize new data
    let existingData = {
      date: today,
      characterCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Get existing data
    const existingDataJson = await redis.get(redisKey)

    if (existingDataJson) {
      // Handle different types of Redis responses
      if (typeof existingDataJson === "string") {
        try {
          const parsedData = JSON.parse(existingDataJson)
          if (parsedData && typeof parsedData === "object") {
            existingData = parsedData
          }
        } catch (parseError) {
          console.error("Error parsing existing usage data:", parseError)
          // Continue with new data
        }
      } else if (typeof existingDataJson === "object" && existingDataJson !== null) {
        // If Redis returns an object directly
        existingData = existingDataJson as any
      }
    }

    // Update the character count
    existingData.characterCount += characterCount
    existingData.updatedAt = new Date().toISOString()

    // Save to Redis with expiration
    await redis.set(redisKey, JSON.stringify(existingData), { ex: 60 * 60 * 24 * 365 * 2 }) // 2 years

    return true
  } catch (error) {
    console.error("Error recording translation usage in Redis:", error)
    return false
  }
}

/**
 * Record translation usage in Redis
 */
async function recordTranslationUsageInRedis(characterCount: number): Promise<boolean> {
  try {
    if (typeof characterCount !== "number" || characterCount < 0) {
      throw new Error("Invalid character count")
    }

    // Get today's date in YYYY-MM-DD format
    const today = format(new Date(), "yyyy-MM-dd")

    // Create the Redis key
    const redisKey = `translation_usage:${today}`

    // Get existing data
    const existingDataJson = await redis.get(redisKey)

    let existingData: {
      date: string
      characterCount: number
      createdAt: string
      updatedAt: string
    } = {
      date: today,
      characterCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (existingDataJson) {
      // Handle different types of Redis responses
      if (typeof existingDataJson === "string") {
        try {
          const parsedData = JSON.parse(existingDataJson)
          if (parsedData && typeof parsedData === "object") {
            existingData = parsedData
          }
        } catch (parseError) {
          console.error("Error parsing existing usage data:", parseError)
          // Continue with new data
        }
      } else if (typeof existingDataJson === "object" && existingDataJson !== null) {
        // If Redis returns an object directly
        existingData = existingDataJson as any
      }
    }

    // Update the character count
    existingData.characterCount += characterCount
    existingData.updatedAt = new Date().toISOString()

    // Save to Redis with expiration
    await redis.set(redisKey, JSON.stringify(existingData), { ex: 60 * 60 * 24 * 365 * 2 }) // 2 years

    // Add the date to the list of migrated dates
    await addMigratedDate(today)

    return true
  } catch (error) {
    console.error("Error recording translation usage in Redis:", error)
    return false
  }
}

/**
 * Add a date to the list of migrated dates
 */
async function addMigratedDate(date: string): Promise<boolean> {
  try {
    // Get the list of migrated dates
    const migratedDatesJson = await redis.get("translation_usage:migrated_dates")
    let migratedDates: string[] = []

    if (migratedDatesJson) {
      // Handle different types of Redis responses
      if (typeof migratedDatesJson === "string") {
        try {
          migratedDates = JSON.parse(migratedDatesJson) as string[]
        } catch (parseError) {
          console.error("Error parsing migrated dates:", parseError)
          return false
        }
      } else if (Array.isArray(migratedDatesJson)) {
        // If Redis returns an array directly
        migratedDates = migratedDatesJson as string[]
      } else {
        console.log("Unexpected format for migrated dates in Redis")
        return false
      }
    }

    // Add the date if it's not already in the list
    if (!migratedDates.includes(date)) {
      migratedDates.push(date)
      await redis.set("translation_usage:migrated_dates", JSON.stringify(migratedDates))
    }

    return true
  } catch (error) {
    console.error("Error adding migrated date:", error)
    return false
  }
}

/**
 * Get cache statistics for a language pair
 */
export async function getCacheStats(
  targetLanguage: Language,
  sourceLanguage?: Language,
): Promise<{
  individualCount: number
  groupedCount: number
  totalSize: number
}> {
  try {
    const sourceLanguageKey = sourceLanguage || "auto"

    // Get individual cache entries
    const individualKeys = await redis.keys(`${TRANSLATION_KEY_PREFIX}*_${sourceLanguageKey}_${targetLanguage}`)

    // Get grouped cache
    const groupKey = `${LANGUAGE_PAIR_PREFIX}${sourceLanguageKey}_${targetLanguage}`
    const groupData = await redis.get(groupKey)

    let groupedCount = 0
    let totalSize = 0

    // Calculate size of individual entries
    for (const key of individualKeys) {
      const data = await redis.get(key)
      if (data) {
        if (typeof data === "string") {
          totalSize += data.length
        } else if (typeof data === "object" && data !== null) {
          totalSize += JSON.stringify(data).length
        }
      }
    }

    // Calculate size and count of grouped entries
    if (groupData) {
      let groupCache: GroupedCache | null = null

      if (typeof groupData === "string") {
        try {
          groupCache = JSON.parse(groupData) as GroupedCache
          totalSize += groupData.length
        } catch (parseError) {
          console.error("Error parsing group data in getCacheStats:", parseError)
        }
      } else if (typeof groupData === "object" && groupData !== null) {
        // If Redis returns an object directly
        groupCache = groupData as unknown as GroupedCache
        totalSize += JSON.stringify(groupData).length
      }

      if (groupCache && groupCache.translations) {
        groupedCount = Object.keys(groupCache.translations).length
      }
    }

    return {
      individualCount: individualKeys.length,
      groupedCount,
      totalSize,
    }
  } catch (error) {
    console.error("Error getting cache stats:", error)
    return {
      individualCount: 0,
      groupedCount: 0,
      totalSize: 0,
    }
  }
}

/**
 * Get translation usage history from Redis
 */
export async function getTranslationUsageHistoryFromRedis(limit = 30): Promise<any[]> {
  try {
    // Get the list of migrated dates
    const migratedDatesJson = await redis.get("translation_usage:migrated_dates")
    let migratedDates: string[] = []

    if (migratedDatesJson) {
      // Handle different types of Redis responses
      if (typeof migratedDatesJson === "string") {
        try {
          migratedDates = JSON.parse(migratedDatesJson) as string[]
        } catch (parseError) {
          console.error("Error parsing migrated dates:", parseError)
          // Fall back to Firebase
          return getTranslationUsageHistory(limit)
        }
      } else if (Array.isArray(migratedDatesJson)) {
        // If Redis returns an array directly
        migratedDates = migratedDatesJson as string[]
      } else {
        console.log("Unexpected format for migrated dates in Redis")
        // Fall back to Firebase
        return getTranslationUsageHistory(limit)
      }
    } else {
      console.log("No migrated dates found in Redis")
      // Fall back to Firebase
      return getTranslationUsageHistory(limit)
    }

    // Sort dates in descending order and limit
    const sortedDates = migratedDates.sort((a, b) => b.localeCompare(a)).slice(0, limit)

    // Get data for each date
    const history: any[] = []

    for (const date of sortedDates) {
      const redisKey = `translation_usage:${date}`
      const dataJson = await redis.get(redisKey)

      if (dataJson) {
        let data: any = null

        // Handle different types of Redis responses
        if (typeof dataJson === "string") {
          try {
            data = JSON.parse(dataJson)
          } catch (parseError) {
            console.error(`Error parsing usage data for date ${date}:`, parseError)
            // Skip this date
            continue
          }
        } else if (typeof dataJson === "object" && dataJson !== null) {
          // If Redis returns an object directly
          data = dataJson
        } else {
          // Skip invalid data
          continue
        }

        if (data && data.date && data.characterCount !== undefined) {
          history.push({
            date: data.date,
            count: data.characterCount || 0,
          })
        }
      }
    }

    return history
  } catch (error) {
    console.error("Error getting translation usage history from Redis:", error)
    // Fall back to Firebase
    return getTranslationUsageHistory(limit)
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
