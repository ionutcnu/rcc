import { db } from "@/lib/firebase/firebaseConfig"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import type { Language } from "@/lib/i18n/types"

// Translation settings interface
export interface TranslationSettings {
    enabled: boolean
    customLimit: number
    warningThreshold: number
    criticalThreshold: number
    defaultLanguage: Language
    availableLanguages: Language[]
    cacheEnabled: boolean
    cacheTTL: number // hours
}

// Default settings
export const defaultTranslationSettings: TranslationSettings = {
    enabled: true,
    customLimit: 400000, // 80% of free tier
    warningThreshold: 80,
    criticalThreshold: 95,
    defaultLanguage: "en",
    availableLanguages: ["en", "fr", "de", "it", "ro"],
    cacheEnabled: true,
    cacheTTL: 24, // 1 day
}

// Document ID for translation settings
const TRANSLATION_SETTINGS_DOC_ID = "translation_settings"

/**
 * Get translation settings
 */
export async function getTranslationSettings(): Promise<TranslationSettings | null> {
    try {
        const settingsRef = doc(db, "settings", TRANSLATION_SETTINGS_DOC_ID)
        const settingsSnap = await getDoc(settingsRef)

        if (settingsSnap.exists()) {
            return settingsSnap.data() as TranslationSettings
        }

        // If no settings exist, initialize with defaults and return
        await initializeTranslationSettings()
        return { ...defaultTranslationSettings }
    } catch (error) {
        console.error("Error fetching translation settings:", error)
        return null
    }
}

/**
 * Initialize translation settings with defaults
 */
async function initializeTranslationSettings(): Promise<void> {
    try {
        const settingsRef = doc(db, "settings", TRANSLATION_SETTINGS_DOC_ID)
        await setDoc(settingsRef, {
            ...defaultTranslationSettings,
            updatedAt: serverTimestamp(),
        })
    } catch (error) {
        console.error("Error initializing translation settings:", error)
    }
}

/**
 * Update translation settings
 */
export async function updateTranslationSettings(settings: TranslationSettings): Promise<boolean> {
    try {
        const settingsRef = doc(db, "settings", TRANSLATION_SETTINGS_DOC_ID)
        await setDoc(
            settingsRef,
            {
                ...settings,
                updatedAt: serverTimestamp(),
            },
            { merge: true },
        )
        return true
    } catch (error) {
        console.error("Error updating translation settings:", error)
        return false
    }
}

/**
 * Get translation usage history
 * This is a placeholder - in a real implementation, you would store usage data in Firestore
 */
export async function getTranslationUsageHistory(): Promise<any[]> {
    // This would fetch actual usage history from Firestore
    // For now, returning mock data
    return [
        { date: "2023-04-01", count: 120000 },
        { date: "2023-04-02", count: 150000 },
        { date: "2023-04-03", count: 180000 },
        { date: "2023-04-04", count: 210000 },
        { date: "2023-04-05", count: 250000 },
        { date: "2023-04-06", count: 320000 },
        { date: "2023-04-07", count: 350000 },
    ]
}
