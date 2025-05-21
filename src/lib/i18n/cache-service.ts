import type { Language, SourceLanguage, CachedTranslation, GroupedCache } from "@/lib/i18n/types"

// Local storage keys
const TRANSLATION_KEY_PREFIX = "translation_cache:"
const LANGUAGE_PAIR_PREFIX = "lang_pair_cache:"

/**
 * Get a cached translation from localStorage
 */
export async function getCachedTranslation(
  sourceText: string,
  targetLanguage: Language,
  sourceLanguage?: Language,
): Promise<string | null> {
    try {
        const sourceLanguageKey = sourceLanguage || "auto"

        // Create a hash of the source text to use as document ID
        const cacheKey = createCacheKey(sourceText, targetLanguage, sourceLanguageKey)

        // Try individual cache first
        const cachedItem = localStorage.getItem(`${TRANSLATION_KEY_PREFIX}${cacheKey}`)

        if (cachedItem) {
            const data = JSON.parse(cachedItem)

            // Check if the cache has expired
            if (new Date() > new Date(data.expiresAt)) {
                // Cache has expired, delete it
                localStorage.removeItem(`${TRANSLATION_KEY_PREFIX}${cacheKey}`)
                return null
            }

            return data.translatedText
        }

        // Try grouped cache
        const groupKey = `${LANGUAGE_PAIR_PREFIX}${sourceLanguageKey}_${targetLanguage}`
        const groupData = localStorage.getItem(groupKey)

        if (groupData) {
            const groupCache = JSON.parse(groupData) as GroupedCache

            // Check if the group cache has expired
            if (new Date() > new Date(groupCache.expiresAt)) {
                // Cache has expired, delete it
                localStorage.removeItem(groupKey)
                return null
            }

            // Check if this text exists in the group
            if (groupCache.translations[cacheKey]) {
                return groupCache.translations[cacheKey].translatedText
            }
        }

        return null
    } catch (error) {
        console.error("Error getting cached translation:", error)
        return null
    }
}

/**
 * Cache a translation in localStorage
 */
export async function cacheTranslation(
  sourceText: string,
  targetLanguage: Language,
  sourceLanguage: Language | undefined,
  translatedText: string,
  ttlHours = 24,
  useGroupedCache = true,
): Promise<boolean> {
    try {
        const sourceLanguageKey = sourceLanguage || "auto"
        const cacheKey = createCacheKey(sourceText, targetLanguage, sourceLanguageKey)

        // Calculate expiration time
        const now = new Date()
        const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000)

        const cacheEntry: CachedTranslation = {
            sourceText,
            targetLanguage,
            sourceLanguage: sourceLanguageKey,
            translatedText,
            timestamp: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
        }

        if (useGroupedCache) {
            // Add to grouped cache
            const groupKey = `${LANGUAGE_PAIR_PREFIX}${sourceLanguageKey}_${targetLanguage}`
            const existingGroup = localStorage.getItem(groupKey)
            let groupCache: GroupedCache

            if (existingGroup) {
                groupCache = JSON.parse(existingGroup) as GroupedCache

                // Update the expiration time if needed
                if (new Date(groupCache.expiresAt) < expiresAt) {
                    groupCache.expiresAt = expiresAt.toISOString()
                }

                // Add or update the translation
                groupCache.translations[cacheKey] = cacheEntry
            } else {
                groupCache = {
                    translations: { [cacheKey]: cacheEntry },
                    updatedAt: now.toISOString(),
                    expiresAt: expiresAt.toISOString(),
                }
            }

            groupCache.updatedAt = now.toISOString()

            // Save to localStorage
            localStorage.setItem(groupKey, JSON.stringify(groupCache))
        } else {
            // Save individual entry
            localStorage.setItem(`${TRANSLATION_KEY_PREFIX}${cacheKey}`, JSON.stringify(cacheEntry))
        }

        return true
    } catch (error) {
        console.error("Error caching translation:", error)
        return false
    }
}

/**
 * Clear all translation cache from localStorage
 */
export async function clearTranslationCache(): Promise<boolean> {
    try {
        // Find all localStorage items with the translation_cache or lang_pair_cache prefix
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && (key.startsWith(TRANSLATION_KEY_PREFIX) || key.startsWith(LANGUAGE_PAIR_PREFIX))) {
                keysToRemove.push(key)
            }
        }

        // Remove all matching keys
        keysToRemove.forEach((key) => localStorage.removeItem(key))

        return true
    } catch (error) {
        console.error("Error clearing translation cache:", error)
        return false
    }
}

/**
 * Create a cache key for a translation
 */
function createCacheKey(sourceText: string, targetLanguage: Language, sourceLanguage: SourceLanguage): string {
    // Simple hash function for the source text
    let hash = 0
    for (let i = 0; i < sourceText.length; i++) {
        const char = sourceText.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash // Convert to 32bit integer
    }

    return `${hash}_${sourceLanguage}_${targetLanguage}`
}
