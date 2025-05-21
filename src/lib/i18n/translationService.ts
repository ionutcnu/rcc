import { admin } from "@/lib/firebase/admin"
import type { Language } from "@/lib/i18n/types"
import { FieldValue } from "firebase-admin/firestore"
import { format } from "date-fns"
import { redis } from "@/lib/redis"

// Collection names
const SETTINGS_DOC_PATH = "settings/translation_settings"
const USAGE_HISTORY_COLLECTION = "translation_usage_history"
const REDIS_USAGE_HISTORY_PREFIX = "translation_usage:"

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
    storeUsageInRedis: boolean // New setting for usage history storage
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
    storeUsageInRedis: false, // Default to Firebase for backward compatibility
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

// Interface for usage history entry
interface UsageHistoryEntry {
    date: string
    characterCount: number
    createdAt: string
    updatedAt: string
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
            // Ensure the storeUsageInRedis property exists (for backward compatibility)
            if (settings.storeUsageInRedis === undefined) {
                settings.storeUsageInRedis = defaultTranslationSettings.storeUsageInRedis
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
            const data = JSON.parse(cachedData as string) as CachedTranslation
            return cleanTranslatedText(data.translatedText)
        }

        // If individual cache miss and grouped cache is enabled, try grouped cache
        if (settings.useGroupedCache) {
            const groupKey = `${LANGUAGE_PAIR_PREFIX}${sourceLanguageKey}_${targetLanguage}`
            const groupData = await redis.get(groupKey)

            if (groupData) {
                const groupCache = JSON.parse(groupData as string) as GroupedCache

                // Check if this text exists in the group
                const textHash = createCacheKey(sourceText, targetLanguage, sourceLanguageKey)
                if (groupCache.translations[textHash]) {
                    return cleanTranslatedText(groupCache.translations[textHash].translatedText)
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
        const data = JSON.stringify({
            sourceText,
            targetLanguage,
            sourceLanguage: sourceLanguageKey,
            translatedText: cleanedText,
            timestamp: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
        })

        // Save to Redis with expiration
        await redis.set(cacheKey, data, { ex: ttlHours * 60 * 60 })

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
        const existingGroup = await redis.get(groupKey)
        let groupCache: GroupedCache

        if (existingGroup) {
            groupCache = JSON.parse(existingGroup as string) as GroupedCache

            // Update the expiration time if needed
            if (new Date(groupCache.expiresAt) < expiresAt) {
                groupCache.expiresAt = expiresAt.toISOString()
            }
        } else {
            groupCache = {
                translations: {},
                updatedAt: now.toISOString(),
                expiresAt: expiresAt.toISOString(),
            }
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

        // Get existing group or create new one
        const existingGroup = await redis.get(groupKey)
        let groupCache: GroupedCache

        if (existingGroup) {
            groupCache = JSON.parse(existingGroup as string) as GroupedCache

            // Update the expiration time if needed
            if (new Date(groupCache.expiresAt) < expiresAt) {
                groupCache.expiresAt = expiresAt.toISOString()
            }

            // Merge the translations
            groupCache.translations = {
                ...groupCache.translations,
                ...translations,
            }
        } else {
            groupCache = {
                translations,
                updatedAt: now.toISOString(),
                expiresAt: expiresAt.toISOString(),
            }
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
        const settings = await getTranslationSettings()

        // If storeUsageInRedis is enabled, get from Redis
        if (settings.storeUsageInRedis) {
            return await getTranslationUsageHistoryFromRedis(limit)
        }

        // Otherwise get from Firebase (default)
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
 * Get translation usage history from Redis
 */
async function getTranslationUsageHistoryFromRedis(limit = 30): Promise<any[]> {
    try {
        // Get all usage history keys
        const historyKeys = await redis.keys(`${REDIS_USAGE_HISTORY_PREFIX}*`)

        // Sort keys by date (descending)
        historyKeys.sort().reverse()

        // Limit the number of keys
        const limitedKeys = historyKeys.slice(0, limit)

        // Get data for each key
        const historyData = []
        for (const key of limitedKeys) {
            const data = await redis.get(key)
            if (data) {
                const entry = JSON.parse(data as string) as UsageHistoryEntry
                historyData.push({
                    date: entry.date,
                    count: entry.characterCount,
                })
            }
        }

        return historyData
    } catch (error) {
        console.error("Error fetching translation usage history from Redis:", error)
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

        // Get settings to determine where to store usage
        const settings = await getTranslationSettings()

        // If storeUsageInRedis is enabled, store in Redis
        if (settings.storeUsageInRedis) {
            return await recordTranslationUsageInRedis(characterCount, today)
        }

        // Otherwise store in Firebase (default)
        // Check if we already have an entry for today
        const docRef = admin.db.collection(USAGE_HISTORY_COLLECTION).doc(today)
        const docSnap = await docRef.get()

        if (docSnap.exists) {
            // Update the existing entry
            await docRef.update({
                characterCount: FieldValue.increment(characterCount),
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
 * Record translation usage in Redis
 */
async function recordTranslationUsageInRedis(characterCount: number, date: string): Promise<boolean> {
    try {
        const key = `${REDIS_USAGE_HISTORY_PREFIX}${date}`

        // Check if we already have an entry for today
        const existingData = await redis.get(key)

        if (existingData) {
            // Update the existing entry
            const entry = JSON.parse(existingData as string) as UsageHistoryEntry
            entry.characterCount += characterCount
            entry.updatedAt = new Date().toISOString()

            // Save back to Redis
            await redis.set(key, JSON.stringify(entry))
        } else {
            // Create a new entry
            const now = new Date().toISOString()
            const entry: UsageHistoryEntry = {
                date,
                characterCount,
                createdAt: now,
                updatedAt: now,
            }

            // Save to Redis
            await redis.set(key, JSON.stringify(entry))
        }

        return true
    } catch (error) {
        console.error("Error recording translation usage in Redis:", error)
        return false
    }
}

/**
 * Migrate translation usage history from Firebase to Redis
 */
export async function migrateUsageHistoryToRedis(limit = 365): Promise<boolean> {
    try {
        // Get all history from Firebase
        const historyRef = admin.db.collection(USAGE_HISTORY_COLLECTION)
        const snapshot = await historyRef.orderBy("date", "desc").limit(limit).get()

        if (snapshot.empty) {
            console.log("No usage history to migrate")
            return true
        }

        // Migrate each entry to Redis
        for (const doc of snapshot.docs) {
            const data = doc.data()
            const key = `${REDIS_USAGE_HISTORY_PREFIX}${data.date}`

            const entry: UsageHistoryEntry = {
                date: data.date,
                characterCount: data.characterCount || 0,
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
            }

            // Save to Redis
            await redis.set(key, JSON.stringify(entry))
            console.log(`Migrated usage history for ${data.date}`)
        }

        console.log(`Successfully migrated ${snapshot.size} usage history entries to Redis`)
        return true
    } catch (error) {
        console.error("Error migrating usage history to Redis:", error)
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
                totalSize += (data as string).length
            }
        }

        // Calculate size and count of grouped entries
        if (groupData) {
            const groupCache = JSON.parse(groupData as string) as GroupedCache
            groupedCount = Object.keys(groupCache.translations).length
            totalSize += (groupData as string).length
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
