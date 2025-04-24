"use client"

import { useState, useEffect, useCallback } from "react"
import { type Language, languages } from "./types"
import { translatePage, clearTranslationCache } from "./translationService"

export function useTranslation() {
    // Get initial language from localStorage or default to English
    const [currentLanguage, setCurrentLanguage] = useState<Language>("en")
    const [isTranslating, setIsTranslating] = useState(false)

    // Initialize language from localStorage on component mount
    useEffect(() => {
        const savedLanguage = localStorage.getItem("preferredLanguage") as Language
        if (savedLanguage && Object.keys(languages).includes(savedLanguage)) {
            setCurrentLanguage(savedLanguage)
        } else {
            // Try to detect browser language
            const browserLang = navigator.language.split("-")[0] as Language
            if (Object.keys(languages).includes(browserLang)) {
                setCurrentLanguage(browserLang)
            }
        }
    }, [])

    // Change language and translate the page
    const changeLanguage = useCallback(
        async (language: Language) => {
            if (language === currentLanguage) return

            setIsTranslating(true)

            try {
                // Save to localStorage
                localStorage.setItem("preferredLanguage", language)

                // Update HTML lang attribute for SEO
                document.documentElement.lang = language

                // Translate the page content
                await translatePage(language, currentLanguage)

                // Update state after translation is complete
                setCurrentLanguage(language)
            } catch (error) {
                console.error("Error changing language:", error)
            } finally {
                setIsTranslating(false)
            }
        },
        [currentLanguage],
    )

    // Clear translation cache
    const clearCache = useCallback(() => {
        clearTranslationCache()
    }, [])

    return {
        currentLanguage,
        changeLanguage,
        isTranslating,
        clearCache,
        languages,
    }
}
