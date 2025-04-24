import { NextResponse } from "next/server"
import type { Language } from "@/lib/i18n/types"

// Default site language
const DEFAULT_LANGUAGE: Language = "en"

// Simple in-memory cache (will reset on server restart)
const translationCache = new Map<string, { text: string; timestamp: number }>()
const CACHE_TTL = 86400 * 1000 // 24 hours in milliseconds

// Character limit warning threshold (95% of free tier)
const WARNING_THRESHOLD = 475000 // 95% of 500,000

// Track usage in memory between restarts
let charactersSentToday = 0
let lastReset = new Date()

// Reset daily counter if it's a new day
function checkAndResetDailyCounter() {
    const now = new Date()
    if (
        now.getDate() !== lastReset.getDate() ||
        now.getMonth() !== lastReset.getMonth() ||
        now.getFullYear() !== lastReset.getFullYear()
    ) {
        charactersSentToday = 0
        lastReset = now
    }
}

export async function POST(request: Request) {
    try {
        checkAndResetDailyCounter()

        const { text, targetLanguage, sourceLanguage = DEFAULT_LANGUAGE } = await request.json()

        // Don't translate if target and source are the same
        if (targetLanguage === sourceLanguage) {
            return NextResponse.json({ translatedText: text })
        }

        // Don't translate if target is the default language
        if (targetLanguage === DEFAULT_LANGUAGE) {
            return NextResponse.json({ translatedText: text })
        }

        // Check in-memory cache first
        const cacheKey = `${sourceLanguage}:${targetLanguage}:${text.substring(0, 100)}`
        const cachedItem = translationCache.get(cacheKey)

        if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_TTL) {
            return NextResponse.json({
                translatedText: cachedItem.text,
                fromCache: true,
                usage: { charactersSaved: text.length },
            })
        }

        // Check if we're approaching the character limit
        if (charactersSentToday > WARNING_THRESHOLD) {
            // Check actual usage from DeepL API
            try {
                const usageResponse = await fetch("https://api-free.deepl.com/v2/usage", {
                    method: "GET",
                    headers: {
                        Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
                    },
                })

                if (usageResponse.ok) {
                    const usageData = await usageResponse.json()

                    // If we're at 98% or more of the limit, return original text
                    if (usageData.character_count / usageData.character_limit >= 0.98) {
                        console.warn("DeepL character limit nearly reached, skipping translation")
                        return NextResponse.json({
                            translatedText: text,
                            limitReached: true,
                            usage: {
                                characterCount: usageData.character_count,
                                characterLimit: usageData.character_limit,
                                percentUsed: (usageData.character_count / usageData.character_limit) * 100,
                            },
                        })
                    }
                }
            } catch (error) {
                console.error("Error checking DeepL usage:", error)
                // Continue with translation if we can't check usage
            }
        }

        // Update character count
        charactersSentToday += text.length

        // Try DeepL first (if API key is available)
        if (process.env.DEEPL_API_KEY) {
            try {
                const deeplResponse = await fetch("https://api-free.deepl.com/v2/translate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
                    },
                    body: JSON.stringify({
                        text: [text],
                        target_lang: targetLanguage.toUpperCase(),
                        source_lang: sourceLanguage.toUpperCase(),
                    }),
                })

                if (deeplResponse.ok) {
                    const data = await deeplResponse.json()
                    const translatedText = data.translations[0].text

                    // Cache the result in memory
                    translationCache.set(cacheKey, {
                        text: translatedText,
                        timestamp: Date.now(),
                    })

                    return NextResponse.json({
                        translatedText,
                        usage: {
                            charactersTranslated: text.length,
                            dailyTotal: charactersSentToday,
                        },
                    })
                }
            } catch (error) {
                console.error("DeepL translation error:", error)
                // Fall through to Google Translate
            }
        }

        // Fallback to Google Translate
        if (process.env.GOOGLE_TRANSLATE_API_KEY) {
            try {
                const googleResponse = await fetch(
                    `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            q: text,
                            target: targetLanguage,
                            source: sourceLanguage,
                            format: "text",
                        }),
                    },
                )

                if (googleResponse.ok) {
                    const data = await googleResponse.json()
                    const translatedText = data.data.translations[0].translatedText

                    // Cache the result in memory
                    translationCache.set(cacheKey, {
                        text: translatedText,
                        timestamp: Date.now(),
                    })

                    return NextResponse.json({ translatedText })
                }
            } catch (error) {
                console.error("Google translation error:", error)
            }
        }

        // If all translation attempts fail, return the original text
        return NextResponse.json({ translatedText: text })
    } catch (error) {
        console.error("Translation API error:", error)
        return NextResponse.json({ error: "Translation failed" }, { status: 500 })
    }
}
