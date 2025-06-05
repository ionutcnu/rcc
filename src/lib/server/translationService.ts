import type { Language } from "@/lib/i18n/types"
import { format } from "date-fns"
import { redis } from "@/lib/redis"

// Redis key names
const SETTINGS_KEY = "translation:settings"
const USAGE_HISTORY_KEY_PREFIX = "translation:usage:"

// Redis key prefixes for caching
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
  defaultLanguage: string
  availableLanguages: string[]
  cacheEnabled: boolean
  cacheTTL: number
  useGroupedCache?: boolean
  storeUsageInRedis?: boolean
  rateLimiterEnabled?: boolean
  maxRequestsPerMinute?: number
  rateLimitWindow?: number
  updatedAt?: string
}

// Default translation settings
const defaultTranslationSettings: TranslationSettings = {
  enabled: true,
  customLimit: 500000,
  warningThreshold: 80,
  criticalThreshold: 95,
  defaultLanguage: "EN",
  availableLanguages: ["EN", "DE", "FR", "ES", "IT", "PT", "RU", "JA", "ZH"],
  cacheEnabled: true,
  cacheTTL: 86400,
  useGroupedCache: true,
  storeUsageInRedis: true,
  rateLimiterEnabled: false,
  maxRequestsPerMinute: 10,
  rateLimitWindow: 60000,
}

// DeepL usage interface
interface DeepLUsage {
  characterCount: number
  characterLimit: number
  percentUsed: number
  limitReached: boolean
}

// Cached translation interface
interface CachedTranslation {
  text: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  timestamp: number
  characterCount: number
}

// Grouped cache interface
interface GroupedCache {
  texts: string[]
  translations: string[]
  sourceLanguage: string
  targetLanguage: string
  timestamp: number
}

/**
 * Check rate limit synchronously
 */
function checkRateLimit(): boolean {
  return isRateLimited && Date.now() < rateLimitResetTime
}

/**
 * Check and update rate limit asynchronously
 */
async function checkRateLimitAsync(): Promise<boolean> {
  const now = Date.now()

  // Clean up old timestamps
  requestTimestamps = requestTimestamps.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW)

  // Check if we're at the limit
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    isRateLimited = true
    rateLimitResetTime = requestTimestamps[0] + RATE_LIMIT_WINDOW

    // Try to get settings to see if rate limiting is enabled
    try {
      const settings = await getTranslationSettings()
      if (!settings.rateLimiterEnabled) {
        // Rate limiting is disabled, allow the request
        isRateLimited = false
        rateLimitResetTime = 0
        return false
      }

      // Use custom settings if available
      const customMaxRequests = settings.maxRequestsPerMinute || MAX_REQUESTS_PER_MINUTE
      const customWindow = settings.rateLimitWindow || RATE_LIMIT_WINDOW

      // Re-check with custom settings
      const customTimestamps = requestTimestamps.filter((timestamp) => now - timestamp < customWindow)
      if (customTimestamps.length >= customMaxRequests) {
        rateLimitResetTime = customTimestamps[0] + customWindow
        return true
      } else {
        isRateLimited = false
        rateLimitResetTime = 0
        return false
      }
    } catch (error) {
      console.error("Error checking rate limit settings:", error)
      return true // Default to rate limited on error
    }
  }

  // Add current timestamp
  requestTimestamps.push(now)
  isRateLimited = false
  rateLimitResetTime = 0
  return false
}

/**
 * Get translation settings from Redis
 */
export async function getTranslationSettings(): Promise<TranslationSettings> {
  try {
    const settingsJson = await redis.get(SETTINGS_KEY)
    
    if (settingsJson) {
      let settings: TranslationSettings
      if (typeof settingsJson === 'string') {
        settings = JSON.parse(settingsJson) as TranslationSettings
      } else {
        settings = settingsJson as TranslationSettings
      }
      
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
    const settingsWithTimestamp = {
      ...defaultTranslationSettings,
      updatedAt: new Date().toISOString(),
    }
    await redis.set(SETTINGS_KEY, JSON.stringify(settingsWithTimestamp))
    console.log("Translation settings initialized with defaults")
  } catch (error) {
    console.error("Error initializing translation settings:", error)
  }
}

/**
 * Update translation settings
 */
export async function updateTranslationSettings(settings: Partial<TranslationSettings>): Promise<boolean> {
  try {
    // Get current settings
    const currentSettings = await getTranslationSettings()
    
    // Merge with new settings
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      updatedAt: new Date().toISOString(),
    }
    
    // Save to Redis
    await redis.set(SETTINGS_KEY, JSON.stringify(updatedSettings))
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
    const waitTime = Math.ceil((rateLimitResetTime - Date.now()) / 1000)
    throw new Error(`Rate limited. Please wait ${waitTime} seconds before trying again.`)
  }

  try {
    const response = await fetch(`${DEEPL_API_URL}/usage`, {
      method: "GET",
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401) {
        throw new Error("Invalid DeepL API key")
      } else if (response.status === 456) {
        throw new Error("DeepL API quota exceeded")
      } else if (response.status === 429) {
        throw new Error("Too many requests to DeepL API")
      } else {
        throw new Error(`DeepL API error: ${response.status} ${response.statusText}`)
      }
    }

    const data = await response.json()

    // Calculate percentage and check if limit is reached
    const percentUsed = (data.character_count / data.character_limit) * 100
    const limitReached = percentUsed >= 100

    return {
      characterCount: data.character_count,
      characterLimit: data.character_limit,
      percentUsed,
      limitReached,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to fetch DeepL usage statistics")
  }
}

/**
 * Clean translated text by removing extra spaces and normalizing
 */
function cleanTranslatedText(text: string): string {
  return text.trim().replace(/\s+/g, " ")
}

/**
 * Translate a single text using DeepL API
 */
async function translateSingleText(
  text: string,
  targetLanguage: Language,
  sourceLanguage?: Language,
): Promise<string> {
  if (!DEEPL_API_KEY) {
    throw new Error("DeepL API key is not set")
  }

  // Check rate limit
  if (await checkRateLimitAsync()) {
    const waitTime = Math.ceil((rateLimitResetTime - Date.now()) / 1000)
    throw new Error(`Rate limited. Please wait ${waitTime} seconds before trying again.`)
  }

  const params = new URLSearchParams({
    auth_key: DEEPL_API_KEY,
    text: text,
    target_lang: targetLanguage,
  })

  if (sourceLanguage) {
    params.append("source_lang", sourceLanguage)
  }

  try {
    const response = await fetch(`${DEEPL_API_URL}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Invalid DeepL API key")
      } else if (response.status === 456) {
        throw new Error("DeepL API quota exceeded")
      } else if (response.status === 429) {
        throw new Error("Too many requests to DeepL API")
      } else {
        throw new Error(`DeepL API error: ${response.status} ${response.statusText}`)
      }
    }

    const data = await response.json()

    if (!data.translations || data.translations.length === 0) {
      throw new Error("No translation returned from DeepL API")
    }

    return cleanTranslatedText(data.translations[0].text)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Translation failed")
  }
}

/**
 * Translate text with caching support
 */
export async function translateText(
  text: string,
  targetLanguage: Language,
  sourceLanguage?: Language,
): Promise<string> {
  try {
    // Get settings to check if translation is enabled
    const settings = await getTranslationSettings()
    
    if (!settings.enabled) {
      console.log("Translation is disabled in settings")
      return text
    }

    // Validate input
    if (!text || text.trim() === "") {
      return ""
    }

    // Check cache first if enabled
    if (settings.cacheEnabled) {
      const cachedTranslation = await getCachedTranslation(text, targetLanguage, sourceLanguage)
      if (cachedTranslation) {
        console.log("Using cached translation")
        return cachedTranslation.translatedText
      }
    }

    // Perform translation
    const translatedText = await translateSingleText(text, targetLanguage, sourceLanguage)

    // Cache the result if caching is enabled
    if (settings.cacheEnabled && translatedText) {
      await cacheTranslation(text, translatedText, targetLanguage, sourceLanguage || "auto")
    }

    // Record usage
    if (settings.storeUsageInRedis) {
      await recordTranslationUsage(text.length)
    }

    return translatedText
  } catch (error) {
    console.error("Error in translateText:", error)
    
    // Return original text on error
    if (error instanceof Error) {
      console.error("Translation error:", error.message)
    }
    return text
  }
}

/**
 * Translate multiple texts with batching and caching
 */
export async function translateTexts(
  texts: string[],
  targetLanguage: Language,
  sourceLanguage?: Language,
): Promise<string[]> {
  try {
    // Get settings
    const settings = await getTranslationSettings()
    
    if (!settings.enabled) {
      console.log("Translation is disabled in settings")
      return texts
    }

    // Filter out empty texts
    const validTexts = texts.filter((text) => text && text.trim() !== "")
    if (validTexts.length === 0) {
      return texts
    }

    const results: string[] = []
    const uncachedTexts: string[] = []
    const uncachedIndices: number[] = []

    // Check cache for each text if caching is enabled
    if (settings.cacheEnabled) {
      for (let i = 0; i < validTexts.length; i++) {
        const text = validTexts[i]
        const cachedTranslation = await getCachedTranslation(text, targetLanguage, sourceLanguage)
        
        if (cachedTranslation) {
          results[i] = cachedTranslation.translatedText
        } else {
          uncachedTexts.push(text)
          uncachedIndices.push(i)
        }
      }
    } else {
      // If caching is disabled, all texts are uncached
      uncachedTexts.push(...validTexts)
      uncachedIndices.push(...validTexts.map((_, i) => i))
    }

    // Translate uncached texts
    if (uncachedTexts.length > 0) {
      try {
        // Check if we should use grouped cache
        if (settings.useGroupedCache && settings.cacheEnabled && uncachedTexts.length > 1) {
          // Use grouped translation for better efficiency
          const groupTranslations = await translateTextsGroup(uncachedTexts, targetLanguage, sourceLanguage)
          
          // Store results and cache them
          for (let i = 0; i < uncachedTexts.length; i++) {
            const originalIndex = uncachedIndices[i]
            results[originalIndex] = groupTranslations[i]
          }
          
          // Cache the group
          await cacheTranslationsGroup(uncachedTexts, groupTranslations, targetLanguage, sourceLanguage || "auto")
        } else {
          // Translate individually
          for (let i = 0; i < uncachedTexts.length; i++) {
            try {
              const translatedText = await translateSingleText(uncachedTexts[i], targetLanguage, sourceLanguage)
              const originalIndex = uncachedIndices[i]
              results[originalIndex] = translatedText
              
              // Cache individual translation
              if (settings.cacheEnabled) {
                await cacheTranslation(uncachedTexts[i], translatedText, targetLanguage, sourceLanguage || "auto")
              }
            } catch (error) {
              console.error(`Error translating text ${i}:`, error)
              const originalIndex = uncachedIndices[i]
              results[originalIndex] = uncachedTexts[i] // Return original text on error
            }
          }
        }
        
        // Record usage for all uncached texts
        if (settings.storeUsageInRedis) {
          const totalCharacters = uncachedTexts.reduce((sum, text) => sum + text.length, 0)
          await recordTranslationUsage(totalCharacters)
        }
      } catch (error) {
        console.error("Error in batch translation:", error)
        // Fill remaining with original texts
        for (let i = 0; i < uncachedTexts.length; i++) {
          const originalIndex = uncachedIndices[i]
          if (results[originalIndex] === undefined) {
            results[originalIndex] = uncachedTexts[i]
          }
        }
      }
    }

    return results
  } catch (error) {
    console.error("Error in translateTexts:", error)
    return texts // Return original texts on error
  }
}

/**
 * Get cached translation from Redis
 */
async function getCachedTranslation(
  text: string,
  targetLanguage: Language,
  sourceLanguage?: Language,
): Promise<CachedTranslation | null> {
  try {
    const isRedisAvailable = await redis.ping()
    if (!isRedisAvailable) {
      console.log("Redis is not available for caching")
      return null
    }

    const cacheKey = createCacheKey(text, targetLanguage, sourceLanguage)
    const cachedData = await redis.get(cacheKey)

    if (cachedData && typeof cachedData === 'string') {
      try {
        const cached = JSON.parse(cachedData) as CachedTranslation
        
        // Check if cache is still valid based on TTL
        const settings = await getTranslationSettings()
        const cacheAge = Date.now() - cached.timestamp
        const maxAge = (settings.cacheTTL || 86400) * 1000 // Convert to milliseconds
        
        if (cacheAge < maxAge) {
          console.log(`Cache hit for text: "${text.substring(0, 50)}..."`)
          return cached
        } else {
          // Cache expired, delete it
          await redis.del(cacheKey)
          console.log(`Cache expired for text: "${text.substring(0, 50)}..."`)
        }
      } catch (parseError) {
        console.error("Error parsing cached translation:", parseError)
        // Delete corrupted cache entry
        await redis.del(cacheKey)
      }
    }

    return null
  } catch (error) {
    console.error("Error retrieving cached translation:", error)
    return null
  }
}

/**
 * Cache translation in Redis
 */
async function cacheTranslation(
  text: string,
  translatedText: string,
  targetLanguage: Language,
  sourceLanguage: string,
): Promise<void> {
  try {
    const isRedisAvailable = await redis.ping()
    if (!isRedisAvailable) {
      console.log("Redis is not available for caching")
      return
    }

    const cacheKey = createCacheKey(text, targetLanguage, sourceLanguage)
    const cacheData: CachedTranslation = {
      text,
      translatedText,
      sourceLanguage,
      targetLanguage,
      timestamp: Date.now(),
      characterCount: text.length,
    }

    // Get TTL from settings
    const settings = await getTranslationSettings()
    const ttlSeconds = settings.cacheTTL || 86400 // Default 24 hours

    await redis.set(cacheKey, JSON.stringify(cacheData), { ex: ttlSeconds })
    console.log(`Cached translation for: "${text.substring(0, 50)}..."`)
  } catch (error) {
    console.error("Error caching translation:", error)
  }
}

/**
 * Add translations to group cache
 */
async function addToGroupCache(
  texts: string[],
  translations: string[],
  targetLanguage: Language,
  sourceLanguage: string,
): Promise<void> {
  try {
    const isRedisAvailable = await redis.ping()
    if (!isRedisAvailable) {
      console.log("Redis is not available for group caching")
      return
    }

    // Create a group cache key
    const groupKey = `${LANGUAGE_PAIR_PREFIX}${sourceLanguage}_${targetLanguage}_group_${Date.now()}`
    
    const groupData: GroupedCache = {
      texts,
      translations,
      sourceLanguage,
      targetLanguage,
      timestamp: Date.now(),
    }

    // Get TTL from settings
    const settings = await getTranslationSettings()
    const ttlSeconds = settings.cacheTTL || 86400

    await redis.set(groupKey, JSON.stringify(groupData), { ex: ttlSeconds })
    console.log(`Added ${texts.length} translations to group cache`)
  } catch (error) {
    console.error("Error adding to group cache:", error)
  }
}

/**
 * Cache multiple translations as a group
 */
async function cacheTranslationsGroup(
  texts: string[],
  translations: string[],
  targetLanguage: Language,
  sourceLanguage: string,
): Promise<void> {
  try {
    // Cache individual translations
    const cachePromises = texts.map((text, index) => {
      const translation = translations[index]
      if (translation) {
        return cacheTranslation(text, translation, targetLanguage, sourceLanguage)
      }
      return Promise.resolve()
    })

    await Promise.all(cachePromises)

    // Add to group cache for analytics
    await addToGroupCache(texts, translations, targetLanguage, sourceLanguage)
  } catch (error) {
    console.error("Error caching translations group:", error)
  }
}

/**
 * Translate multiple texts as a group (for better API efficiency)
 */
async function translateTextsGroup(
  texts: string[],
  targetLanguage: Language,
  sourceLanguage?: Language,
): Promise<string[]> {
  if (!DEEPL_API_KEY) {
    throw new Error("DeepL API key is not set")
  }

  // Check rate limit
  if (await checkRateLimitAsync()) {
    const waitTime = Math.ceil((rateLimitResetTime - Date.now()) / 1000)
    throw new Error(`Rate limited. Please wait ${waitTime} seconds before trying again.`)
  }

  const params = new URLSearchParams({
    auth_key: DEEPL_API_KEY,
    target_lang: targetLanguage,
  })

  // Add all texts
  texts.forEach((text) => {
    params.append("text", text)
  })

  if (sourceLanguage) {
    params.append("source_lang", sourceLanguage)
  }

  try {
    const response = await fetch(`${DEEPL_API_URL}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Invalid DeepL API key")
      } else if (response.status === 456) {
        throw new Error("DeepL API quota exceeded")
      } else if (response.status === 429) {
        throw new Error("Too many requests to DeepL API")
      } else {
        throw new Error(`DeepL API error: ${response.status} ${response.statusText}`)
      }
    }

    const data = await response.json()

    if (!data.translations || data.translations.length !== texts.length) {
      throw new Error("Invalid response from DeepL API for group translation")
    }

    return data.translations.map((translation: any) => cleanTranslatedText(translation.text))
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Group translation failed")
  }
}

/**
 * Clear translation cache
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
 * Get translation usage history from Redis
 */
export async function getTranslationUsageHistory(limit = 30): Promise<any[]> {
  try {
    // Get all usage keys from Redis
    const keys = await redis.keys(`${USAGE_HISTORY_KEY_PREFIX}*`)
    
    if (keys.length === 0) {
      return []
    }

    // Get all usage data
    const usagePromises = keys.map(async (key) => {
      const data = await redis.get(key)
      if (data && typeof data === 'string') {
        try {
          return JSON.parse(data)
        } catch (error) {
          console.error(`Error parsing usage data for key ${key}:`, error)
          return null
        }
      }
      return null
    })

    const usageData = await Promise.all(usagePromises)
    
    // Filter out null values and sort by date descending
    const history = usageData
      .filter(data => data !== null)
      .map(data => ({
        date: data.date,
        count: data.characterCount || 0,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)

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
    await redis.ping()
    return true
  } catch (error) {
    console.error("Redis connection check failed:", error)
    return false
  }
}

/**
 * Record translation usage in Redis
 */
export async function recordTranslationUsage(characterCount: number): Promise<boolean> {
  try {
    if (typeof characterCount !== "number" || characterCount < 0) {
      throw new Error("Invalid character count")
    }

    // Get today's date in YYYY-MM-dd format
    const today = format(new Date(), "yyyy-MM-dd")

    try {
      // Create the Redis key
      const redisKey = `${USAGE_HISTORY_KEY_PREFIX}${today}`

      // Initialize new data
      let existingData = {
        date: today,
        characterCount: characterCount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Get existing data
      const existingDataJson = await redis.get(redisKey)

      if (existingDataJson) {
        // Handle different types of Redis responses
        let parsedData: any = null

        if (typeof existingDataJson === "string") {
          try {
            parsedData = JSON.parse(existingDataJson)
          } catch (parseError) {
            console.error("Error parsing existing usage data:", parseError)
            // Continue with new data
          }
        } else if (typeof existingDataJson === "object" && existingDataJson !== null) {
          // If Redis returns an object directly
          parsedData = existingDataJson
        }

        if (parsedData && typeof parsedData === "object") {
          // Update the character count
          existingData = {
            ...parsedData,
            characterCount: (parsedData.characterCount || 0) + characterCount,
            updatedAt: new Date().toISOString(),
          }
        }
      }

      // Save to Redis with expiration (2 years)
      await redis.set(redisKey, JSON.stringify(existingData), { ex: 60 * 60 * 24 * 365 * 2 })

      console.log(`Successfully recorded ${characterCount} characters of translation usage for ${today}`)
      return true
    } catch (redisError) {
      console.error("Error recording usage in Redis:", redisError)
      return false
    }
  } catch (error) {
    console.error("Error recording translation usage:", error)
    return false
  }
}

/**
 * Create cache key for translation
 */
function createCacheKey(text: string, targetLanguage: Language, sourceLanguage?: string): string {
  const source = sourceLanguage || "auto"
  return `${TRANSLATION_KEY_PREFIX}${source}_${targetLanguage}_${Buffer.from(text).toString("base64")}`
}