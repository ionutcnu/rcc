// Add debugging to the translate API route to help diagnose issues
import { NextResponse } from "next/server"
import { translateWithDeepL } from "@/lib/i18n/deepl-service"
import { getCachedTranslation, cacheTranslation } from "@/lib/i18n/cache-service"
import { getTranslationSettings } from "@/lib/firebase/translationService"
import type { Language } from "@/lib/i18n/types"

export async function POST(request: Request) {
    try {
        // Parse request body
        const body = await request.json()
        const { texts, targetLanguage, sourceLanguage } = body

        // Validate request
        if (!texts || !Array.isArray(texts) || !targetLanguage) {
            console.error("Invalid translation request:", { texts, targetLanguage, sourceLanguage })
            return NextResponse.json({ error: "Invalid request" }, { status: 400 })
        }

        // Get translation settings
        const settings = await getTranslationSettings()
        if (!settings || !settings.enabled) {
            console.error("Translation is disabled in settings")
            return NextResponse.json({ error: "Translation is disabled" }, { status: 403 })
        }

        // Process each text
        const translatedTexts = []
        for (const text of texts) {
            // Skip empty texts
            if (!text || text.trim().length === 0) {
                translatedTexts.push(text)
                continue
            }

            let translatedText = text

            // Check cache if enabled
            if (settings.cacheEnabled) {
                const cached = await getCachedTranslation(text, targetLanguage as Language, sourceLanguage as Language)
                if (cached) {
                    translatedTexts.push(cached)
                    continue
                }
            }

            // Translate with DeepL
            try {
                translatedText = await translateWithDeepL(text, targetLanguage, sourceLanguage)

                // Cache the translation if enabled
                if (settings.cacheEnabled && translatedText !== text) {
                    await cacheTranslation(
                        text,
                        targetLanguage as Language,
                        sourceLanguage as Language,
                        translatedText,
                        settings.cacheTTL,
                    )
                }
            } catch (error) {
                console.error("DeepL translation error:", error)
                // Use original text if translation fails
                translatedText = text
            }

            translatedTexts.push(translatedText)
        }

        // Log translation results for debugging
        console.log(`Translated ${translatedTexts.length} texts from ${sourceLanguage} to ${targetLanguage}`)

        return NextResponse.json({ translatedTexts })
    } catch (error) {
        console.error("Translation API error:", error)
        return NextResponse.json({ error: "Translation failed", details: (error as Error).message }, { status: 500 })
    }
}
