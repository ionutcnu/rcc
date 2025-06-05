import type { Language } from "./types"
import { redis } from "@/lib/redis"
import { format } from "date-fns"

// Redis key names
const SETTINGS_KEY = "translation:settings"
const USAGE_HISTORY_KEY_PREFIX = "translation:usage:"
const TRANSLATION_KEY_PREFIX = "translation:"
const LANGUAGE_PAIR_PREFIX = "lang_pair:"

// DeepL API configuration
const DEEPL_API_URL = "https://api-free.deepl.com/v2"
const DEEPL_API_KEY = process.env.DEEPL_API_KEY

// Rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000
const MAX_REQUESTS_PER_MINUTE = 5
let requestTimestamps: number[] = []
let isRateLimited = false
let rateLimitResetTime = 0

interface TranslationSettings {
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

interface DeepLUsage {
  characterCount: number
  characterLimit: number
  percentUsed: number
  limitReached: boolean
}

interface CachedTranslation {
  text: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  timestamp: number
  characterCount: number
}

interface GroupedCache {
  texts: string[]
  translations: string[]
  sourceLanguage: string
  targetLanguage: string
  timestamp: number
}

interface UsageHistoryEntry {
  date: string
  characterCount: number
  createdAt: string
  updatedAt: string
}

function checkRateLimit(): boolean {
  return isRateLimited && Date.now() < rateLimitResetTime
}

export async function getTranslationSettings(): Promise<TranslationSettings> {
  try {
    const settingsJson = await redis.get(SETTINGS_KEY)
    
    if (settingsJson && typeof settingsJson === 'string') {
      const settings = JSON.parse(settingsJson) as TranslationSettings
      if (settings.useGroupedCache === undefined) {
        settings.useGroupedCache = defaultTranslationSettings.useGroupedCache
      }
      return settings
    }

    await initializeTranslationSettings()
    return { ...defaultTranslationSettings }
  } catch (error) {
    console.error("Error fetching translation settings:", error)
    return { ...defaultTranslationSettings }
  }
}

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

export async function updateTranslationSettings(settings: Partial<TranslationSettings>): Promise<boolean> {
  try {
    const currentSettings = await getTranslationSettings()
    
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      updatedAt: new Date().toISOString(),
    }
    
    await redis.set(SETTINGS_KEY, JSON.stringify(updatedSettings))
    console.log("Translation settings updated successfully")
    return true
  } catch (error) {
    console.error("Error updating translation settings:", error)
    throw error
  }
}

export async function getDeepLUsage(): Promise<DeepLUsage> {
  if (!DEEPL_API_KEY) {
    throw new Error("DeepL API key is not set")
  }

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

function cleanTranslatedText(text: string): string {
  return text.trim().replace(/\s+/g, " ")
}

async function translateSingleText(
  text: string,
  targetLanguage: Language,
  sourceLanguage?: Language,
): Promise<string> {
  if (!DEEPL_API_KEY) {
    throw new Error("DeepL API key is not set")
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

export async function translateText(
  text: string,
  targetLanguage: Language,
  sourceLanguage?: Language,
): Promise<string> {
  try {
    const settings = await getTranslationSettings()
    
    if (!settings.enabled) {
      console.log("Translation is disabled in settings")
      return text
    }

    if (!text || text.trim() === "") {
      return ""
    }

    if (settings.cacheEnabled) {
      const cachedTranslation = await getCachedTranslation(text, targetLanguage, sourceLanguage)
      if (cachedTranslation) {
        console.log("Using cached translation")
        return cachedTranslation.translatedText
      }
    }

    const translatedText = await translateSingleText(text, targetLanguage, sourceLanguage)

    if (settings.cacheEnabled && translatedText) {
      await cacheTranslation(text, translatedText, targetLanguage, sourceLanguage || "auto")
    }

    if (settings.storeUsageInRedis) {
      await recordTranslationUsage(text.length)
    }

    return translatedText
  } catch (error) {
    console.error("Error in translateText:", error)
    
    if (error instanceof Error) {
      console.error("Translation error:", error.message)
    }
    return text
  }
}

export async function translateTexts(
  texts: string[],
  targetLanguage: Language,
  sourceLanguage?: Language,
): Promise<string[]> {
  try {
    const settings = await getTranslationSettings()
    
    if (!settings.enabled) {
      console.log("Translation is disabled in settings")
      return texts
    }

    const validTexts = texts.filter((text) => text && text.trim() !== "")
    if (validTexts.length === 0) {
      return texts
    }

    const results: string[] = []
    const uncachedTexts: string[] = []
    const uncachedIndices: number[] = []

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
      uncachedTexts.push(...validTexts)
      uncachedIndices.push(...validTexts.map((_, i) => i))
    }

    if (uncachedTexts.length > 0) {
      try {
        for (let i = 0; i < uncachedTexts.length; i++) {
          try {
            const translatedText = await translateSingleText(uncachedTexts[i], targetLanguage, sourceLanguage)
            const originalIndex = uncachedIndices[i]
            results[originalIndex] = translatedText
            
            if (settings.cacheEnabled) {
              await cacheTranslation(uncachedTexts[i], translatedText, targetLanguage, sourceLanguage || "auto")
            }
          } catch (error) {
            console.error(`Error translating text ${i}:`, error)
            const originalIndex = uncachedIndices[i]
            results[originalIndex] = uncachedTexts[i]
          }
        }
        
        if (settings.storeUsageInRedis) {
          const totalCharacters = uncachedTexts.reduce((sum, text) => sum + text.length, 0)
          await recordTranslationUsage(totalCharacters)
        }
      } catch (error) {
        console.error("Error in batch translation:", error)
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
    return texts
  }
}

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
        
        const settings = await getTranslationSettings()
        const cacheAge = Date.now() - cached.timestamp
        const maxAge = (settings.cacheTTL || 86400) * 1000
        
        if (cacheAge < maxAge) {
          console.log(`Cache hit for text: "${text.substring(0, 50)}..."`)
          return cached
        } else {
          await redis.del(cacheKey)
          console.log(`Cache expired for text: "${text.substring(0, 50)}..."`)
        }
      } catch (parseError) {
        console.error("Error parsing cached translation:", parseError)
        await redis.del(cacheKey)
      }
    }

    return null
  } catch (error) {
    console.error("Error retrieving cached translation:", error)
    return null
  }
}

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

    const settings = await getTranslationSettings()
    const ttlSeconds = settings.cacheTTL || 86400

    await redis.set(cacheKey, JSON.stringify(cacheData), { ex: ttlSeconds })
    console.log(`Cached translation for: "${text.substring(0, 50)}..."`)
  } catch (error) {
    console.error("Error caching translation:", error)
  }
}

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

    const groupKey = `${LANGUAGE_PAIR_PREFIX}${sourceLanguage}_${targetLanguage}_group_${Date.now()}`
    
    const groupData: GroupedCache = {
      texts,
      translations,
      sourceLanguage,
      targetLanguage,
      timestamp: Date.now(),
    }

    const settings = await getTranslationSettings()
    const ttlSeconds = settings.cacheTTL || 86400

    await redis.set(groupKey, JSON.stringify(groupData), { ex: ttlSeconds })
    console.log(`Added ${texts.length} translations to group cache`)
  } catch (error) {
    console.error("Error adding to group cache:", error)
  }
}

async function cacheTranslationsGroup(
  texts: string[],
  translations: string[],
  targetLanguage: Language,
  sourceLanguage: string,
): Promise<void> {
  try {
    const cachePromises = texts.map((text, index) => {
      const translation = translations[index]
      if (translation) {
        return cacheTranslation(text, translation, targetLanguage, sourceLanguage)
      }
      return Promise.resolve()
    })

    await Promise.all(cachePromises)
    await addToGroupCache(texts, translations, targetLanguage, sourceLanguage)
  } catch (error) {
    console.error("Error caching translations group:", error)
  }
}

export async function clearTranslationCache(): Promise<boolean> {
  try {
    const translationKeys = await redis.keys(`${TRANSLATION_KEY_PREFIX}*`)
    const langPairKeys = await redis.keys(`${LANGUAGE_PAIR_PREFIX}*`)
    const allKeys = [...translationKeys, ...langPairKeys]

    if (allKeys.length > 0) {
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

export async function getTranslationUsageHistory(limit = 30): Promise<any[]> {
  try {
    const keys = await redis.keys(`${USAGE_HISTORY_KEY_PREFIX}*`)
    
    if (keys.length === 0) {
      return []
    }

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

export async function getTranslationUsageHistoryFromRedis(): Promise<UsageHistoryEntry[]> {
  try {
    const keys = await redis.keys(`${USAGE_HISTORY_KEY_PREFIX}*`)
    
    if (keys.length === 0) {
      return []
    }

    const usagePromises = keys.map(async (key) => {
      const data = await redis.get(key)
      if (data && typeof data === 'string') {
        try {
          return JSON.parse(data) as UsageHistoryEntry
        } catch (error) {
          console.error(`Error parsing usage data for key ${key}:`, error)
          return null
        }
      }
      return null
    })

    const usageData = await Promise.all(usagePromises)
    
    return usageData
      .filter(data => data !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error("Error fetching usage history from Redis:", error)
    return []
  }
}

export async function recordTranslationUsage(characterCount: number): Promise<boolean> {
  try {
    if (typeof characterCount !== "number" || characterCount < 0) {
      throw new Error("Invalid character count")
    }

    const today = format(new Date(), "yyyy-MM-dd")

    try {
      const redisKey = `${USAGE_HISTORY_KEY_PREFIX}${today}`

      let existingData = {
        date: today,
        characterCount: characterCount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const existingDataJson = await redis.get(redisKey)

      if (existingDataJson) {
        let parsedData: any = null

        if (typeof existingDataJson === "string") {
          try {
            parsedData = JSON.parse(existingDataJson)
          } catch (parseError) {
            console.error("Error parsing existing usage data:", parseError)
          }
        } else if (typeof existingDataJson === "object" && existingDataJson !== null) {
          parsedData = existingDataJson
        }

        if (parsedData && typeof parsedData === "object") {
          existingData = {
            ...parsedData,
            characterCount: (parsedData.characterCount || 0) + characterCount,
            updatedAt: new Date().toISOString(),
          }
        }
      }

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

export async function recordTranslationUsageInRedis(characterCount: number): Promise<boolean> {
  return recordTranslationUsage(characterCount)
}

export async function getCacheStats(): Promise<{
  totalKeys: number
  translationKeys: number
  groupKeys: number
  usageKeys: number
}> {
  try {
    const translationKeys = await redis.keys(`${TRANSLATION_KEY_PREFIX}*`)
    const groupKeys = await redis.keys(`${LANGUAGE_PAIR_PREFIX}*`)
    const usageKeys = await redis.keys(`${USAGE_HISTORY_KEY_PREFIX}*`)
    
    return {
      totalKeys: translationKeys.length + groupKeys.length + usageKeys.length,
      translationKeys: translationKeys.length,
      groupKeys: groupKeys.length,
      usageKeys: usageKeys.length,
    }
  } catch (error) {
    console.error("Error getting cache stats:", error)
    return {
      totalKeys: 0,
      translationKeys: 0,
      groupKeys: 0,
      usageKeys: 0,
    }
  }
}

function createCacheKey(text: string, targetLanguage: Language, sourceLanguage?: string): string {
  const source = sourceLanguage || "auto"
  return `${TRANSLATION_KEY_PREFIX}${source}_${targetLanguage}_${Buffer.from(text).toString("base64")}`
}