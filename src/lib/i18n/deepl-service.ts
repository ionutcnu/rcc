import type { DeepLUsage } from "./usageTracker"

// DeepL API base URL
const DEEPL_API_URL = "https://api-free.deepl.com/v2"

// Get DeepL API key from environment variables
const DEEPL_API_KEY = process.env.DEEPL_API_KEY

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
export async function translateWithDeepL(text: string, targetLang: string, sourceLang?: string): Promise<string> {
    if (!DEEPL_API_KEY) {
        throw new Error("DeepL API key is not set")
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
        return data.translations[0].text
    } catch (error) {
        console.error("Error translating with DeepL:", error)
        return text // Return original text on error
    }
}
