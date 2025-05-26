import { NextResponse } from "next/server"
import {
    translateText,
    translateTexts,
    getTranslationSettings,
    recordTranslationUsage,
} from "@/lib/server/translationService"
import type { Language } from "@/lib/i18n/types"

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

        // Check if target language is supported
        if (!settings.availableLanguages.includes(targetLanguage as Language)) {
            console.error(`Target language ${targetLanguage} is not supported`)
            return NextResponse.json({ error: `Language '${targetLanguage}' is not supported` }, { status: 400 })
        }

        // Process each text
        let translatedTexts: string[]

        try {
            if (text) {
                // Single text translation
                const translatedText = await translateText(text, targetLanguage as Language, sourceLanguage as Language)
                translatedTexts = [translatedText]
                console.log(
                  `Successfully translated text to ${targetLanguage}: "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}" → "${translatedText.substring(0, 30)}${translatedText.length > 30 ? "..." : ""}"`,
                )
            } else {
                // Multiple texts translation
                translatedTexts = await translateTexts(texts, targetLanguage as Language, sourceLanguage as Language)
                console.log(`Successfully translated ${texts.length} texts to ${targetLanguage}`)

                // Log a sample of translations for debugging
                if (texts.length > 0 && translatedTexts.length > 0) {
                    console.log(
                      `Sample translation: "${texts[0].substring(0, 30)}${texts[0].length > 30 ? "..." : ""}" → "${translatedTexts[0].substring(0, 30)}${translatedTexts[0].length > 30 ? "..." : ""}"`,
                    )
                }
            }
        } catch (error) {
            console.error("Translation error:", error)

            // If we get a 429 error, return a specific error message
            if (error instanceof Error && error.message.includes("429")) {
                return NextResponse.json({ error: "Translation limit reached. Please try again later." }, { status: 429 })
            }

            // For other errors, return the original texts
            translatedTexts = texts
        }

        // Calculate total character count for usage tracking
        const totalCharCount = texts.reduce((sum: number, t: string | null | undefined) => sum + (t?.length || 0), 0)

        // Record usage
        if (totalCharCount > 0) {
            await recordTranslationUsage(totalCharCount)
        }

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
