"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Loader2, AlertCircle } from "lucide-react"
import { type Language, languages } from "@/lib/i18n/types"
import { translatePage, checkDeepLUsage } from "@/lib/i18n/translationService"
import { getLocalUsage } from "@/lib/i18n/usageTracker"

// Default site language
const DEFAULT_LANGUAGE: Language = "en"

export default function LanguageSwitcher() {
    const [currentLanguage, setCurrentLanguage] = useState<Language>(DEFAULT_LANGUAGE)
    const [isOpen, setIsOpen] = useState(false)
    const [isTranslating, setIsTranslating] = useState(false)
    const [usageWarning, setUsageWarning] = useState(false)
    const [usagePercent, setUsagePercent] = useState(0)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Load saved language preference and check usage on mount
    useEffect(() => {
        const savedLanguage = localStorage.getItem("preferredLanguage") as Language
        if (savedLanguage && Object.keys(languages).includes(savedLanguage)) {
            setCurrentLanguage(savedLanguage)
            // Apply translation if not the default language
            if (savedLanguage !== DEFAULT_LANGUAGE) {
                handleLanguageChange(savedLanguage, false)
            }
        }

        // Check DeepL usage
        checkUsage()
    }, [])

    // Check DeepL usage statistics
    const checkUsage = async () => {
        try {
            await checkDeepLUsage()
            const usage = getLocalUsage()
            setUsagePercent(usage.percentUsed)
            setUsageWarning(usage.percentUsed > 80)
        } catch (error) {
            console.error("Error checking usage:", error)
        }
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    // Handle language change
    const handleLanguageChange = async (language: Language, closeDropdown = true) => {
        if (language === currentLanguage) return
        if (closeDropdown) setIsOpen(false)

        setIsTranslating(true)

        try {
            // Save preference
            localStorage.setItem("preferredLanguage", language)

            // Update HTML lang attribute for SEO
            document.documentElement.lang = language

            // If switching to default language, reload the page instead of translating
            if (language === DEFAULT_LANGUAGE) {
                // Set the language without translation
                setCurrentLanguage(language)
                setIsTranslating(false)
                return
            }

            // Check usage before translating
            await checkUsage()
            const usage = getLocalUsage()

            // If we're over 95% of the limit, show warning and don't translate
            if (usage.percentUsed > 95) {
                setUsageWarning(true)
                setCurrentLanguage(language)
                setIsTranslating(false)
                alert("Translation limit nearly reached. Some content may not be translated.")
                return
            }

            // Translate the page content - make sure we're passing the correct source language
            // Always use DEFAULT_LANGUAGE as source when translating to ensure proper translation
            await translatePage(language, DEFAULT_LANGUAGE)

            // Update state after translation is complete
            setCurrentLanguage(language)

            // Check usage after translation
            await checkUsage()
        } catch (error) {
            console.error("Error changing language:", error)
        } finally {
            setIsTranslating(false)
        }
    }

    // Get current language name
    const currentLangName = languages[currentLanguage] || "English"

    // Get current language flag
    const getLanguageFlag = (code: Language): string => {
        switch (code) {
            case "en":
                return "🇬🇧"
            case "ro":
                return "🇷🇴"
            case "de":
                return "🇩🇪"
            case "it":
                return "🇮🇹"
            case "fr":
                return "🇫🇷"
            default:
                return "🇬🇧"
        }
    }

    const currentFlag = getLanguageFlag(currentLanguage)

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors ${
                    usageWarning ? "bg-amber-100 hover:bg-amber-200" : "bg-amber-50 hover:bg-amber-100"
                }`}
                aria-expanded={isOpen}
                aria-haspopup="true"
                disabled={isTranslating}
            >
                <span className="mr-1">{currentFlag}</span>
                <span className="font-medium text-sm">{currentLanguage.toUpperCase()}</span>
                {isTranslating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : usageWarning ? (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                ) : (
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    {usageWarning && (
                        <div className="px-3 py-2 text-xs text-amber-800 bg-amber-50 border-b border-amber-100">
                            Translation usage: {Math.round(usagePercent)}% of monthly limit
                        </div>
                    )}
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        {Object.entries(languages).map(([code, name]) => (
                            <button
                                key={code}
                                className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                                    currentLanguage === code ? "bg-amber-50 text-amber-900" : "text-gray-700 hover:bg-gray-50"
                                }`}
                                role="menuitem"
                                onClick={() => handleLanguageChange(code as Language)}
                                disabled={isTranslating}
                                type="button"
                            >
                                <span className="mr-2">{getLanguageFlag(code as Language)}</span>
                                <span>{name}</span>
                                {currentLanguage === code && (
                                    <span className="ml-auto text-xs font-medium text-amber-600">Current</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
