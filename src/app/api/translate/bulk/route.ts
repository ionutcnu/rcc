import { NextResponse } from "next/server"
import { translateSingleText, getTranslationSettings, recordTranslationUsage } from "@/lib/server/translationService"
import type { Language } from "@/lib/i18n/types"

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    console.log(`Bulk translation request with ${body.texts?.length || 0} texts`)

    // Handle array of texts
    const { texts, targetLanguage, sourceLanguage } = body

    // Validate request
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      console.error("Invalid bulk translation request: missing texts array")
      return NextResponse.json({ error: "Invalid request: missing texts array" }, { status: 400 })
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

    // Combine all texts into a single string with special markers
    const SEPARATOR = "\n--TRANSLATION_SEPARATOR--\n"
    const combinedText = texts.join(SEPARATOR)

    // Calculate total character count for usage tracking
    const totalCharCount = combinedText.length

    // Check if the combined text is too large
    if (totalCharCount > 128000) {
      // DeepL has a limit
      console.error("Combined text too large for bulk translation")
      return NextResponse.json({ error: "Combined text too large for bulk translation" }, { status: 400 })
    }

    try {
      // Translate the combined text
      const translatedCombined = await translateSingleText(
        combinedText,
        targetLanguage as Language,
        sourceLanguage as Language,
      )

      // Split the translated text back into individual translations
      const translatedTexts = translatedCombined.split(SEPARATOR)

      // Ensure we have the same number of translations as original texts
      if (translatedTexts.length !== texts.length) {
        console.error("Translation result count mismatch", {
          original: texts.length,
          translated: translatedTexts.length,
        })

        // Pad with original texts if needed
        while (translatedTexts.length < texts.length) {
          translatedTexts.push(texts[translatedTexts.length])
        }

        // Truncate if we somehow got more translations than original texts
        if (translatedTexts.length > texts.length) {
          translatedTexts.length = texts.length
        }
      }

      // Record usage
      if (totalCharCount > 0) {
        await recordTranslationUsage(totalCharCount)
      }

      return NextResponse.json({ translatedTexts })
    } catch (error) {
      console.error("Bulk translation error:", error)

      // If we get a 429 error, return a specific error message
      if (error instanceof Error && error.message.includes("429")) {
        return NextResponse.json({ error: "Translation limit reached. Please try again later." }, { status: 429 })
      }

      // For other errors, return the original texts
      return NextResponse.json({ translatedTexts: texts })
    }
  } catch (error) {
    console.error("Bulk translation API error:", error)
    return NextResponse.json({ error: "Translation failed", details: (error as Error).message }, { status: 500 })
  }
}
