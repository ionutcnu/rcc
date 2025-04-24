import { NextResponse } from "next/server"
import { getDeepLUsage } from "@/lib/i18n/deepl-service"
import { getTranslationSettings } from "@/lib/firebase/translationService"

export async function GET() {
    try {
        // Get the translation settings to check if custom limit is set
        const settings = await getTranslationSettings()

        // Get actual usage from DeepL API
        const usage = await getDeepLUsage()

        // If custom limit is set, use it instead of the actual limit
        if (settings && settings.customLimit && settings.customLimit > 0) {
            usage.characterLimit = settings.customLimit
            // Recalculate percentage based on custom limit
            usage.percentUsed = (usage.characterCount / usage.characterLimit) * 100
            usage.limitReached = usage.percentUsed >= 100
        }

        return NextResponse.json(usage)
    } catch (error) {
        console.error("Error fetching DeepL usage:", error)
        return NextResponse.json({ error: "Failed to fetch translation usage" }, { status: 500 })
    }
}
