import { deduplicateRequest } from "./requestDeduplicator"
import type { Language } from "@/lib/i18n/types"
import { updateLocalUsage } from "@/lib/i18n/usageTracker"

// Translation client functions
export async function fetchTranslationSettings() {
  try {
    return await deduplicateRequest("translation-settings", async () => {
      const response = await fetch("/api/translate/settings", {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch translation settings: ${response.status}`)
      }

      return await response.json()
    })
  } catch (error) {
    console.error("Error fetching translation settings:", error)
    return null
  }
}

export async function updateTranslationSettings(settings: any) {
  try {
    const response = await fetch("/api/translate/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(settings),
    })

    if (!response.ok) {
      throw new Error(`Failed to update translation settings: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error updating translation settings:", error)
    throw error
  }
}

export async function fetchTranslationHistory() {
  try {
    // Use deduplicateRequest to prevent duplicate calls
    return await deduplicateRequest("translation-history", async () => {
      const response = await fetch("/api/translate/history", {
        method: "GET",
        credentials: "include",
        // Add cache control headers to prevent browser caching
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch translation history: ${response.status}`)
      }

      return await response.json()
    })
  } catch (error) {
    console.error("Error fetching translation history:", error)
    return []
  }
}

export async function fetchTranslationUsage() {
  try {
    return await deduplicateRequest("translation-usage", async () => {
      const response = await fetch("/api/translate/usage", {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch translation usage: ${response.status}`)
      }

      const data = await response.json()

      // Update local usage for client-side access
      updateLocalUsage(data)

      // Record the usage for history tracking
      if (data && typeof data.characterCount === "number") {
        recordTranslationUsage(data.characterCount).catch((err) => {
          console.error("Failed to record translation usage:", err)
        })
      }

      return data
    })
  } catch (error) {
    console.error("Error fetching translation usage:", error)
    return null
  }
}

// Add this function to export getDeepLUsage
export async function getDeepLUsage() {
  try {
    const usageData = await fetchTranslationUsage()
    return usageData
  } catch (error) {
    console.error("Error getting DeepL usage:", error)
    throw error
  }
}

export async function recordTranslationUsage(characterCount: number) {
  try {
    const response = await fetch("/api/translate/record-usage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ characterCount }),
    })

    if (!response.ok) {
      throw new Error(`Failed to record translation usage: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error recording translation usage:", error)
    throw error
  }
}

export async function clearTranslationCache() {
  try {
    const response = await fetch("/api/translate/clear-cache", {
      method: "POST",
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Failed to clear translation cache: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error clearing translation cache:", error)
    throw error
  }
}

// Add the missing testTranslation function
export async function testTranslation(text: string, targetLang: Language, sourceLang?: Language) {
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        text,
        targetLanguage: targetLang,
        sourceLanguage: sourceLang,
        isTest: true, // Flag to indicate this is a test translation
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to test translation: ${response.status}`)
    }

    const result = await response.json()
    return {
      translatedText: result.translatedText || text,
      success: true,
    }
  } catch (error) {
    console.error("Error testing translation:", error)
    throw error
  }
}

export async function translateText(text: string, targetLang: Language, sourceLang?: Language) {
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        text,
        targetLanguage: targetLang,
        sourceLanguage: sourceLang,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to translate text: ${response.status}`)
    }

    const result = await response.json()
    return result.translatedText || text
  } catch (error) {
    console.error("Error translating text:", error)
    return text // Return original text on error
  }
}

export async function translateTexts(texts: string[], targetLang: Language, sourceLang?: Language) {
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        texts,
        targetLanguage: targetLang,
        sourceLanguage: sourceLang,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to translate texts: ${response.status}`)
    }

    const result = await response.json()
    return result.translatedTexts || texts
  } catch (error) {
    console.error("Error translating texts:", error)
    return texts // Return original texts on error
  }
}
