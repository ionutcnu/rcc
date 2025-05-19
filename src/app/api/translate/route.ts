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

        // Process each text
        let translatedTexts: string[]

        if (text) {
            // Single text translation
            const translatedText = await translateText(text, targetLanguage as Language, sourceLanguage as Language)
            translatedTexts = [translatedText]
        } else {
            // Multiple texts translation
            translatedTexts = await translateTexts(texts, targetLanguage as Language, sourceLanguage as Language)
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
