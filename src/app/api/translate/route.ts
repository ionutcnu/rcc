// Add debugging to the translate API route to help diagnose issues
import { NextResponse } from "next/server"
import { translateWithDeepL } from "@/lib/i18n/deepl-service"
import { getCachedTranslation } from "@/lib/i18n/cache-service"
import { getTranslationSettings } from "@/lib/firebase/translationService"
import type { Language } from "@/lib/i18n/types"
import { admin } from "@/lib/firebase/admin"

// Collection name for translation cache
const CACHE_COLLECTION = "translation_cache"

export async function POST(request: Request) {
    try {
        // Parse request body
        const body = await request.json()
        console.log("Translation request body:", body)

        // Handle both single text and array of texts
        const { text, texts: textsArray, targetLanguage, sourceLanguage } = body

        // Convert single text to array if provided
        const texts = text ? [text] : textsArray

        // Validate request
        if ((!texts || !Array.isArray(texts)) && !text) {
            console.error("Invalid translation request:", { text, texts, targetLanguage, sourceLanguage })
            return NextResponse.json({ error: "Invalid request: missing text or texts" }, { status: 400 })
        }

        if (!targetLanguage) {
            console.error("Invalid translation request: missing targetLanguage")
            return NextResponse.json({ error: "Invalid request: missing targetLanguage" }, { status: 400 })
        }

        // Get translation settings
        const settings = await getTranslationSettings()
        if (!settings || !settings.enabled) {
            console.error("Translation is disabled in settings")
            return NextResponse.json({ error: "Translation is disabled" }, { status: 403 })
        }

        // Process each text
        const translatedTexts = []
        for (const textItem of texts) {
            // Skip empty texts
            if (!textItem || textItem.trim().length === 0) {
                translatedTexts.push(textItem)
                continue
            }

            let translatedText = textItem

            // Check cache if enabled
            if (settings.cacheEnabled) {
                const cached = await getCachedTranslation(textItem, targetLanguage as Language, sourceLanguage as Language)
                if (cached) {
                    translatedTexts.push(cached)
                    continue
                }
            }

            // Translate with DeepL
            try {
                translatedText = await translateWithDeepL(textItem, targetLanguage, sourceLanguage)

                // Cache the translation if enabled
                if (settings.cacheEnabled && translatedText !== textItem) {
                    try {
                        // Use admin SDK to cache translation
                        const cacheKey = createCacheKey(textItem, targetLanguage, sourceLanguage || "auto")
                        const now = new Date()
                        const expiresAt = new Date(now.getTime() + (settings.cacheTTL || 24) * 60 * 60 * 1000)

                        await admin.db
                          .collection(CACHE_COLLECTION)
                          .doc(cacheKey)
                          .set({
                              sourceText: textItem,
                              targetLanguage,
                              sourceLanguage: sourceLanguage || "auto",
                              translatedText,
                              timestamp: now,
                              expiresAt,
                          })

                        console.log(`Cached translation from ${sourceLanguage || "auto"} to ${targetLanguage}`)
                    } catch (cacheError) {
                        console.error("Error caching translation with admin SDK:", cacheError)
                        // Continue even if caching fails
                    }
                }
            } catch (error) {
                console.error("DeepL translation error:", error)
                // Use original text if translation fails
                translatedText = textItem
            }

            translatedTexts.push(translatedText)
        }

        // Log translation results for debugging
        console.log(`Translated ${translatedTexts.length} texts from ${sourceLanguage || "auto"} to ${targetLanguage}`)

        // Return single text or array based on input
        if (text) {
            return NextResponse.json({ translatedText: translatedTexts[0] })
        } else {
            return NextResponse.json({ translatedTexts })
        }
    } catch (error) {
        console.error("Translation API error:", error)
        return NextResponse.json({ error: "Translation failed", details: (error as Error).message }, { status: 500 })
    }
}

// Helper function to create a cache key
function createCacheKey(sourceText: string, targetLanguage: string, sourceLanguage: string): string {
    // Simple hash function for the source text
    let hash = 0
    for (let i = 0; i < sourceText.length; i++) {
        const char = sourceText.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash // Convert to 32bit integer
    }

    return `${hash}_${sourceLanguage}_${targetLanguage}`
}
