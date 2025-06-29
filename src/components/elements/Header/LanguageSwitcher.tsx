"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Loader2, AlertCircle, Archive, RefreshCw, Trash2 } from "lucide-react"
import { type Language, languages } from "@/lib/i18n/types"
import { getLocalUsage } from "@/lib/i18n/usageTracker"
import { getDeepLUsage } from "@/lib/api/translationClient"

// Default site language
const DEFAULT_LANGUAGE: Language = "en"

// Stats tracking
interface TranslationStats {
    totalTexts: number
    cachedTexts: number
    translatedTexts: number
    apiCalls: number
}

// Batch size for translations - using a much larger batch size to reduce API calls
const BATCH_SIZE = 100 // Increased from 20 to 100

// Maximum content length for a single API call (DeepL has a limit)
const MAX_CONTENT_LENGTH = 128000 // Characters

// Clean up translated text by removing separator markers
function cleanTranslatedText(text: string): string {
    if (!text) return text

    // Remove any TRADUZIONE_SEPARATORE markers
    return text.replace(/TRADUZIONE_SEPARATORE-+/g, "").trim()
}

// Check if current page is an admin page
function isAdminPage(): boolean {
    if (typeof window !== "undefined") {
        return window.location.pathname.startsWith("/admin")
    }
    return false
}

async function translatePage(targetLang: Language, sourceLang: Language): Promise<TranslationStats> {
    const stats: TranslationStats = {
        totalTexts: 0,
        cachedTexts: 0,
        translatedTexts: 0,
        apiCalls: 0,
    }

    // Skip translation for admin pages
    if (isAdminPage()) {
        console.log("[TRANSLATION SKIPPED] Admin page detected, skipping translation")
        return stats
    }

    try {
        // First check if translation is enabled in settings
        const settingsResponse = await fetch("/api/translate/settings", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })

        if (!settingsResponse.ok) {
            console.error("Failed to fetch translation settings")
            throw new Error("Translation settings unavailable")
        }

        const settings = await settingsResponse.json()

        // Check if translation is enabled
        if (!settings.enabled) {
            console.log("Translation is disabled in settings")
            throw new Error("Translation is disabled by administrator")
        }

        // Check usage limits
        const usageResponse = await fetch("/api/translate/usage", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })

        if (!usageResponse.ok) {
            console.error("Failed to fetch translation usage")
            throw new Error("Unable to check translation limits")
        }

        const usage = await usageResponse.json()

        // Check if we're over the limit
        if (usage.limitReached || (settings.customLimit && usage.characterCount >= settings.customLimit)) {
            console.error("Translation limit reached")
            throw new Error("Translation limit reached")
        }

        // Get all text nodes in the document
        const textNodes = getTextNodes(document.body)
        console.log(`Found ${textNodes.length} text nodes to potentially translate`)

        // Group text nodes by parent to reduce API calls
        const textByParent = groupTextNodesByParent(textNodes)

        // Prepare batches for translation
        const allTextsToTranslate: { text: string; node: Text; cacheKey: string }[] = []

        // First pass: collect all texts that need translation and check cache
        for (const [parent, nodes] of textByParent.entries()) {
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i]
                const text = node.nodeValue || ""

                // Skip empty or whitespace-only text
                if (!text || text.trim() === "") continue

                // Skip if text contains only numbers, special characters, or is very short
                if (text.length < 3 || /^[\d\s\W]+$/.test(text)) continue

                // Count this as a text that needs translation
                stats.totalTexts++

                // Check cache first (if enabled)
                const cacheKey = `translation_${text}_${targetLang}_${sourceLang}`
                const cachedTranslation = settings.cacheEnabled ? localStorage.getItem(cacheKey) : null

                if (cachedTranslation) {
                    // Use cached translation (clean it first)
                    const cleanedTranslation = cleanTranslatedText(cachedTranslation)
                    node.nodeValue = cleanedTranslation
                    console.log(
                      `[CACHE HIT] Using cached translation for: "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"`,
                    )
                    stats.cachedTexts++
                } else {
                    // Add to the list of texts to translate
                    allTextsToTranslate.push({ text, node, cacheKey })
                }
            }
        }

        // If we have texts to translate, process them in a single API call if possible
        if (allTextsToTranslate.length > 0) {
            console.log(`Need to translate ${allTextsToTranslate.length} texts`)

            // Calculate total content length
            const totalContentLength = allTextsToTranslate.reduce((sum, item) => sum + item.text.length, 0)

            // If total content is small enough, do a single API call
            if (totalContentLength <= MAX_CONTENT_LENGTH && allTextsToTranslate.length <= 50) {
                // Mark all nodes as being translated
                allTextsToTranslate.forEach((item) => {
                    if (item.node.parentElement) {
                        item.node.parentElement.setAttribute("data-translating", "true")
                    }
                })

                try {
                    // Translate all texts in one call
                    stats.apiCalls++
                    const response = await fetch("/api/translate", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            texts: allTextsToTranslate.map((item) => item.text),
                            targetLanguage: targetLang,
                            sourceLanguage: sourceLang,
                        }),
                    })

                    if (!response.ok) {
                        throw new Error(`Translation API error: ${response.status}`)
                    }

                    const data = await response.json()
                    const translatedTexts = data.translatedTexts

                    // Update nodes with translated text
                    for (let j = 0; j < allTextsToTranslate.length; j++) {
                        const { node, text, cacheKey } = allTextsToTranslate[j]
                        let translatedText = translatedTexts[j]

                        // Clean up the translated text
                        translatedText = cleanTranslatedText(translatedText)

                        // Update the node value
                        if (translatedText && translatedText !== text) {
                            node.nodeValue = translatedText
                            stats.translatedTexts++

                            // Cache the translation if enabled
                            if (settings.cacheEnabled) {
                                localStorage.setItem(cacheKey, translatedText)
                            }
                        }

                        // Remove the visual indication
                        if (node.parentElement) {
                            node.parentElement.removeAttribute("data-translating")
                        }
                    }
                } catch (error) {
                    console.error("Error translating all texts:", error)

                    // If bulk translation fails, fall back to batch processing
                    console.log("Falling back to batch processing")

                    // Remove visual indication
                    allTextsToTranslate.forEach((item) => {
                        if (item.node.parentElement) {
                            item.node.parentElement.removeAttribute("data-translating")
                        }
                    })

                    // Process in larger batches
                    for (let i = 0; i < allTextsToTranslate.length; i += BATCH_SIZE) {
                        const batch = allTextsToTranslate.slice(i, i + BATCH_SIZE)

                        // Skip processing if we've hit too many errors
                        if (stats.apiCalls >= 3) {
                            console.warn("Too many API errors, skipping remaining batches")
                            break
                        }

                        await processBatch(batch, targetLang, sourceLang, settings.cacheEnabled, stats)

                        // Add a longer delay between batches to avoid rate limiting
                        if (i + BATCH_SIZE < allTextsToTranslate.length) {
                            await new Promise((resolve) => setTimeout(resolve, 2000))
                        }
                    }
                }
            } else {
                // Content is too large for a single call, process in batches
                console.log(`Content too large (${totalContentLength} chars) for single call, using batches`)

                // Process in larger batches
                for (let i = 0; i < allTextsToTranslate.length; i += BATCH_SIZE) {
                    const batch = allTextsToTranslate.slice(i, i + BATCH_SIZE)

                    // Skip processing if we've hit too many errors
                    if (stats.apiCalls >= 3) {
                        console.warn("Too many API errors, skipping remaining batches")
                        break
                    }

                    await processBatch(batch, targetLang, sourceLang, settings.cacheEnabled, stats)

                    // Add a longer delay between batches to avoid rate limiting
                    if (i + BATCH_SIZE < allTextsToTranslate.length) {
                        await new Promise((resolve) => setTimeout(resolve, 2000))
                    }
                }
            }
        }

        // Log translation stats
        console.log(`
Translation Stats:
-----------------
Total texts: ${stats.totalTexts}
Cached texts: ${stats.cachedTexts} (${stats.totalTexts > 0 ? Math.round((stats.cachedTexts / stats.totalTexts) * 100) : 0}%)
Newly translated: ${stats.translatedTexts} (${stats.totalTexts > 0 ? Math.round((stats.translatedTexts / stats.totalTexts) * 100) : 0}%)
API calls: ${stats.apiCalls}
`)

        return stats
    } catch (error) {
        console.error("Error translating page:", error)
        throw error
    }
}

async function processBatch(
  batch: { text: string; node: Text; cacheKey: string }[],
  targetLang: Language,
  sourceLang: Language,
  cacheEnabled: boolean,
  stats: TranslationStats,
): Promise<void> {
    // Skip translation for admin pages
    if (isAdminPage()) {
        return
    }

    const batchTexts = batch.map((item) => item.text)

    // Mark nodes as being translated
    batch.forEach((item) => {
        if (item.node.parentElement) {
            item.node.parentElement.setAttribute("data-translating", "true")
        }
    })

    try {
        // Translate the batch
        stats.apiCalls++
        const response = await fetch("/api/translate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                texts: batchTexts,
                targetLanguage: targetLang,
                sourceLanguage: sourceLang,
            }),
        })

        if (!response.ok) {
            throw new Error(`Translation API error: ${response.status}`)
        }

        const data = await response.json()
        const translatedTexts = data.translatedTexts

        // Update nodes with translated text
        for (let j = 0; j < batch.length; j++) {
            const { node, text, cacheKey } = batch[j]
            let translatedText = translatedTexts[j]

            // Clean up the translated text
            translatedText = cleanTranslatedText(translatedText)

            // Update the node value
            if (translatedText && translatedText !== text) {
                node.nodeValue = translatedText
                stats.translatedTexts++

                // Cache the translation if enabled
                if (cacheEnabled) {
                    localStorage.setItem(cacheKey, translatedText)
                }
            }

            // Remove the visual indication
            if (node.parentElement) {
                node.parentElement.removeAttribute("data-translating")
            }
        }
    } catch (error) {
        console.error("Error translating batch:", error)

        // Remove visual indication on error
        batch.forEach((item) => {
            if (item.node.parentElement) {
                item.node.parentElement.removeAttribute("data-translating")
            }
        })
    }
}

function getTextNodes(node: Node): Text[] {
    const textNodes: Text[] = []

    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        textNodes.push(node as Text)
    } else {
        const children = node.childNodes
        for (let i = 0; i < children.length; i++) {
            // Skip script, style, and noscript elements
            const child = children[i]
            const parentElement = child.parentElement
            if (
              parentElement &&
              (parentElement.tagName === "SCRIPT" ||
                parentElement.tagName === "STYLE" ||
                parentElement.tagName === "NOSCRIPT" ||
                parentElement.getAttribute("translate") === "no")
            ) {
                continue
            }

            textNodes.push(...getTextNodes(child))
        }
    }

    return textNodes
}

function groupTextNodesByParent(nodes: Text[]): Map<Node, Text[]> {
    const map = new Map<Node, Text[]>()

    for (const node of nodes) {
        const parent = node.parentNode
        if (!parent) continue

        if (!map.has(parent)) {
            map.set(parent, [])
        }

        map.get(parent)!.push(node)
    }

    return map
}

async function checkDeepLUsage(): Promise<void> {
    try {
        await getDeepLUsage()
    } catch (error) {
        console.error("Error checking DeepL usage:", error)
    }
}

function clearTranslationCache(): void {
    const keysToRemove: string[] = []

    // Find all translation cache keys
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("translation_")) {
            keysToRemove.push(key)
        }
    }

    // Remove the keys
    keysToRemove.forEach((key) => localStorage.removeItem(key))

    console.log(`[CACHE CLEAR] Removed ${keysToRemove.length} cached translations`)
}

function checkPageLanguage(targetLang: Language): boolean {
    // Skip check for admin pages
    if (isAdminPage()) {
        return true
    }

    // If target language is the default, we assume it matches
    if (targetLang === DEFAULT_LANGUAGE) return true

    // Get a sample of text nodes to check
    const textNodes = getTextNodes(document.body)
    if (textNodes.length === 0) return true

    // Take a sample of up to 5 significant text nodes
    const significantNodes = textNodes
      .filter((node) => {
          const text = node.nodeValue || ""
          return text.trim().length > 20 // Only check longer text segments
      })
      .slice(0, 5)

    if (significantNodes.length === 0) return true

    // Check if any of these nodes have cached translations
    let matchCount = 0
    for (const node of significantNodes) {
        const text = node.nodeValue || ""
        const cacheKey = `translation_${text}_${targetLang}_${DEFAULT_LANGUAGE}`
        const cachedTranslation = localStorage.getItem(cacheKey)

        // If we have a cached translation but the node text doesn't match it,
        // the page content doesn't match the selected language
        if (cachedTranslation && text !== cachedTranslation) {
            return false
        }

        // If we don't have a cached translation, we can't be sure
        if (!cachedTranslation) {
            matchCount++
        }
    }

    // If we couldn't find cached translations for most of our sample,
    // we assume the page needs translation
    return matchCount < significantNodes.length / 2
}

function fixTranslationMarkers(): number {
    // Skip for admin pages
    if (isAdminPage()) {
        return 0
    }

    let fixedCount = 0
    const textNodes = getTextNodes(document.body)

    for (const node of textNodes) {
        const text = node.nodeValue || ""
        if (text.includes("TRADUZIONE_SEPARATORE")) {
            const cleanedText = cleanTranslatedText(text)
            if (cleanedText !== text) {
                node.nodeValue = cleanedText
                fixedCount++
            }
        }
    }

    return fixedCount
}

function detectMixedLanguageContent(targetLang: Language): string[] {
    // Skip for admin pages
    if (isAdminPage()) {
        return []
    }

    const mixedContentElements: string[] = []
    const textNodes = getTextNodes(document.body)

    // Language detection patterns (simplified)
    const patterns: Record<Language, RegExp> = {
        en: /\b(the|and|is|are|with|for|this|that|have|from)\b/i,
        fr: /\b(le|la|les|et|est|sont|avec|pour|ce|cette|ces|avoir|de)\b/i,
        de: /\b(der|die|das|und|ist|sind|mit|für|dies|das|haben|von)\b/i,
        it: /\b(il|la|le|e|è|sono|con|per|questo|quella|hanno|da)\b/i,
        ro: /\b(și|este|sunt|cu|pentru|acest|acea|au|de la)\b/i,
    }

    // Check each text node for language patterns that don't match target language
    for (const node of textNodes) {
        const text = node.nodeValue || ""
        if (text.length < 10) continue // Skip very short texts

        // Skip if text matches target language pattern
        if (patterns[targetLang] && patterns[targetLang].test(text)) continue

        // Check if text matches patterns of other languages
        for (const [lang, pattern] of Object.entries(patterns)) {
            if (lang !== targetLang && pattern.test(text)) {
                // Found text that matches a different language pattern
                const parentElement = node.parentElement
                if (parentElement) {
                    const elementInfo = `${parentElement.tagName.toLowerCase()}${parentElement.id ? "#" + parentElement.id : ""}`
                    mixedContentElements.push(elementInfo)

                    // Mark element for visual identification
                    parentElement.setAttribute("data-mixed-language", "true")
                }
                break
            }
        }
    }

    return [...new Set(mixedContentElements)] // Remove duplicates
}

async function forceRetranslateAll(targetLang: Language, sourceLang: Language): Promise<TranslationStats> {
    // Skip for admin pages
    if (isAdminPage()) {
        console.log("[FORCE RETRANSLATE SKIPPED] Admin page detected, skipping translation")
        return {
            totalTexts: 0,
            cachedTexts: 0,
            translatedTexts: 0,
            apiCalls: 0,
        }
    }

    // Clear existing translations from cache for this language pair
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes(`_${targetLang}_`)) {
            keysToRemove.push(key)
        }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key))
    console.log(`[FORCE RETRANSLATE] Removed ${keysToRemove.length} cached translations for ${targetLang}`)

    // Add CSS to highlight mixed language content
    const style = document.createElement("style")
    style.textContent = `
        [data-mixed-language="true"] {
            outline: 2px dashed #ff6b6b !important;
            background-color: rgba(255, 107, 107, 0.1) !important;
        }
    `
    document.head.appendChild(style)

    // Translate all content
    const stats = await translatePage(targetLang, sourceLang)

    // Remove mixed language markers
    document.querySelectorAll('[data-mixed-language="true"]').forEach((el) => {
        el.removeAttribute("data-mixed-language")
    })

    // Remove the style
    document.head.removeChild(style)

    return stats
}

export default function LanguageSwitcher() {
    const [currentLanguage, setCurrentLanguage] = useState<Language>(DEFAULT_LANGUAGE)
    const [isOpen, setIsOpen] = useState(false)
    const [isTranslating, setIsTranslating] = useState(false)
    const [usageWarning, setUsageWarning] = useState(false)
    const [usagePercent, setUsagePercent] = useState(0)
    const [translationEnabled, setTranslationEnabled] = useState(true)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [cacheStats, setCacheStats] = useState<TranslationStats | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [hasInteracted, setHasInteracted] = useState(false)
    const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(true)
    const [pageLanguageMatches, setPageLanguageMatches] = useState(true)
    const [hasMarkers, setHasMarkers] = useState(false)
    // NEW: State for mixed language detection
    const [hasMixedLanguage, setHasMixedLanguage] = useState(false)
    const [mixedLanguageElements, setMixedLanguageElements] = useState<string[]>([])
    // Add a ref to track if initial translation has been attempted
    const initialTranslationAttempted = useRef(false)
    // Track if we're on an admin page
    const [isAdmin, setIsAdmin] = useState(false)

    // Load saved language preference on mount and set up navigation translation
    useEffect(() => {
        // Check if we're on an admin page
        setIsAdmin(isAdminPage())

        const savedLanguage = localStorage.getItem("preferredLanguage") as Language
        const savedAutoTranslate = localStorage.getItem("autoTranslateEnabled")

        // Set auto-translate state from localStorage
        if (savedAutoTranslate !== null) {
            setAutoTranslateEnabled(savedAutoTranslate === "true")
        }

        if (savedLanguage && Object.keys(languages).includes(savedLanguage)) {
            setCurrentLanguage(savedLanguage)

            // Skip translation for admin pages
            if (isAdminPage()) {
                console.log("[TRANSLATION SKIPPED] Admin page detected, skipping translation setup")
                return
            }

            // Check for translation markers in the DOM
            const fixedCount = fixTranslationMarkers()
            if (fixedCount > 0) {
                console.log(`[CLEANUP] Fixed ${fixedCount} translation markers in the DOM`)
                setHasMarkers(true)
            }

            // If not the default language, set up auto-translation
            if (savedLanguage !== DEFAULT_LANGUAGE) {
                setHasInteracted(true)

                // Check if the page content matches the selected language
                const matches = checkPageLanguage(savedLanguage)
                setPageLanguageMatches(matches)

                // NEW: Check for mixed language content
                const mixedElements = detectMixedLanguageContent(savedLanguage)
                setHasMixedLanguage(mixedElements.length > 0)
                setMixedLanguageElements(mixedElements)

                // If content doesn't match and auto-translate is enabled, translate the page
                if ((!matches || mixedElements.length > 0) && (savedAutoTranslate === null || savedAutoTranslate === "true")) {
                    console.log("[LANGUAGE CHECK] Page content doesn't match selected language, translating...")
                    translateCurrentPage(savedLanguage, DEFAULT_LANGUAGE)
                }

                // Set up navigation listener for future page changes
                setupNavigationTranslation(savedLanguage)
            }
        }

        // Add CSS for translation indicators
        const style = document.createElement("style")
        style.textContent = `
      [data-translating="true"] {
        background-color: rgba(255, 215, 0, 0.2);
        transition: background-color 0.5s ease-in-out;
      }
    `
        document.head.appendChild(style)

        return () => {
            document.head.removeChild(style)
        }
    }, [])

    // Add a new useEffect to force translation on initial load
    useEffect(() => {
        // Skip for admin pages
        if (isAdminPage()) {
            return
        }

        // Only run once and only if we have a non-default language
        if (!initialTranslationAttempted.current && currentLanguage !== DEFAULT_LANGUAGE) {
            initialTranslationAttempted.current = true

            // Short delay to ensure the DOM is fully loaded
            const timer = setTimeout(() => {
                console.log(`[INITIAL LOAD] Forcing translation to ${currentLanguage}`)
                // Clear all cached translations for this language to ensure fresh translation
                clearLanguageCache(currentLanguage)
                // Force translation
                translateCurrentPage(currentLanguage, DEFAULT_LANGUAGE)
            }, 1000)

            return () => clearTimeout(timer)
        }
    }, [currentLanguage])

    // Function to clear cache for a specific language
    const clearLanguageCache = (lang: Language) => {
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.includes(`_${lang}_`)) {
                keysToRemove.push(key)
            }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key))
        console.log(`[CACHE CLEAR] Removed ${keysToRemove.length} cached translations for ${lang}`)
    }

    // Function to translate the current page
    const translateCurrentPage = async (targetLang: Language, sourceLang: Language) => {
        // Skip for admin pages
        if (isAdminPage()) {
            console.log("[TRANSLATION SKIPPED] Admin page detected, skipping translation")
            return
        }

        try {
            setIsTranslating(true)
            setPageLanguageMatches(true) // Assume we're going to fix it
            setHasMixedLanguage(false) // Assume we're going to fix mixed language issues

            // First, check for and fix any translation markers
            const fixedCount = fixTranslationMarkers()
            if (fixedCount > 0) {
                console.log(`[CLEANUP] Fixed ${fixedCount} translation markers in the DOM`)
                setHasMarkers(false)
            }

            // Check if translation is enabled in settings
            const canTranslate = await checkTranslationStatus()

            if (canTranslate) {
                // Add retry mechanism
                let retryCount = 0
                const maxRetries = 2
                let success = false
                let stats: TranslationStats | null = null

                while (!success && retryCount <= maxRetries) {
                    try {
                        if (retryCount > 0) {
                            console.log(`[RETRY] Attempt ${retryCount} of ${maxRetries} to translate page to ${targetLang}`)
                        }

                        // Force retranslation to ensure all content is translated
                        stats = await forceRetranslateAll(targetLang, sourceLang)
                        success = true
                    } catch (error) {
                        retryCount++
                        console.error(`[TRANSLATION ERROR] Attempt ${retryCount}: ${error}`)

                        if (retryCount <= maxRetries) {
                            // Wait before retrying
                            await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
                        } else {
                            throw error // Re-throw if all retries failed
                        }
                    }
                }

                if (stats) {
                    setCacheStats(stats)
                    console.log(`[TRANSLATION COMPLETE] Translated ${stats.translatedTexts} texts in ${stats.apiCalls} API calls`)
                }

                // Check again for any remaining markers
                const remainingMarkers = fixTranslationMarkers()
                setHasMarkers(remainingMarkers > 0)

                // NEW: Check for mixed language content after translation
                const mixedElements = detectMixedLanguageContent(targetLang)
                setHasMixedLanguage(mixedElements.length > 0)
                setMixedLanguageElements(mixedElements)

                if (mixedElements.length > 0) {
                    console.warn(
                      `[MIXED LANGUAGE] Detected ${mixedElements.length} elements with mixed language content:`,
                      mixedElements,
                    )
                }
            }
        } catch (error) {
            console.error("Error translating current page:", error)
            setPageLanguageMatches(false) // Mark that we failed to translate
        } finally {
            setIsTranslating(false)
        }
    }

    // Set up navigation translation to handle page changes
    const setupNavigationTranslation = (targetLang: Language) => {
        // Create a MutationObserver to watch for DOM changes
        const observer = new MutationObserver((mutations) => {
            // Skip for admin pages
            if (isAdminPage()) {
                return
            }

            // Only proceed if auto-translate is enabled
            if (!autoTranslateEnabled) return

            // Check if this is a significant DOM change (like a page navigation)
            const significantChange = mutations.some(
              (mutation) => mutation.type === "childList" && mutation.addedNodes.length > 5,
            )

            if (significantChange) {
                console.log("[AUTO-TRANSLATE] Detected significant DOM change, translating new content")

                // First, check for and fix any translation markers
                const fixedCount = fixTranslationMarkers()
                if (fixedCount > 0) {
                    console.log(`[CLEANUP] Fixed ${fixedCount} translation markers in the DOM`)
                    setHasMarkers(false)
                }

                // Check if the page content matches the selected language
                const matches = checkPageLanguage(targetLang)
                setPageLanguageMatches(matches)

                // NEW: Check for mixed language content
                const mixedElements = detectMixedLanguageContent(targetLang)
                setHasMixedLanguage(mixedElements.length > 0)
                setMixedLanguageElements(mixedElements)

                if (!matches || mixedElements.length > 0) {
                    translateCurrentPage(targetLang, DEFAULT_LANGUAGE)
                }
            }
        })

        // Start observing the document with the configured parameters
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false,
        })

        // Also listen for Next.js route changes
        if (typeof window !== "undefined") {
            const handleRouteChange = () => {
                // Update admin status
                setIsAdmin(isAdminPage())

                // Skip for admin pages
                if (isAdminPage()) {
                    console.log("[TRANSLATION SKIPPED] Admin page detected after navigation, skipping translation")
                    return
                }

                if (autoTranslateEnabled) {
                    console.log("[AUTO-TRANSLATE] Detected route change, translating new page")
                    // Add a small delay to ensure the page has fully loaded
                    setTimeout(() => {
                        // First, check for and fix any translation markers
                        const fixedCount = fixTranslationMarkers()
                        if (fixedCount > 0) {
                            console.log(`[CLEANUP] Fixed ${fixedCount} translation markers in the DOM`)
                            setHasMarkers(false)
                        }

                        // Check if the page content matches the selected language
                        const matches = checkPageLanguage(targetLang)
                        setPageLanguageMatches(matches)

                        // NEW: Check for mixed language content
                        const mixedElements = detectMixedLanguageContent(targetLang)
                        setHasMixedLanguage(mixedElements.length > 0)
                        setMixedLanguageElements(mixedElements)

                        if (!matches || mixedElements.length > 0) {
                            translateCurrentPage(targetLang, DEFAULT_LANGUAGE)
                        }
                    }, 500)
                }
            }

            // Listen for clicks on links
            document.addEventListener("click", (e) => {
                const target = e.target as HTMLElement
                const link = target.closest("a")
                if (link && link.href && link.href.startsWith(window.location.origin)) {
                    // This is an internal link, prepare for translation after navigation
                    handleRouteChange()
                }
            })

            // Listen for popstate (back/forward navigation)
            window.addEventListener("popstate", handleRouteChange)

            // Return cleanup function
            return () => {
                observer.disconnect()
                window.removeEventListener("popstate", handleRouteChange)
            }
        }
    }

    // Check translation settings and usage statistics - but only when explicitly needed
    const checkTranslationStatus = async () => {
        try {
            // Skip for admin pages
            if (isAdminPage()) {
                return false
            }

            // Only check if user has interacted with language switcher
            if (!hasInteracted) return true // Changed to return true by default

            // Reset error message
            setErrorMessage(null)

            // 1. Check if translation is enabled in admin settings
            const settingsResponse = await fetch("/api/translate/settings", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })

            if (!settingsResponse.ok) {
                console.error("Failed to fetch translation settings")
                setTranslationEnabled(false)
                setErrorMessage("Translation settings unavailable")
                return false
            }

            const settings = await settingsResponse.json()
            setTranslationEnabled(settings.enabled)

            if (!settings.enabled) {
                setErrorMessage("Translation is disabled by administrator")
                return false
            }

            // 2. Check usage limits
            await checkDeepLUsage()
            const usage = getLocalUsage()
            setUsagePercent(usage.percentUsed)

            // Update warning thresholds - only show warning if usage is above 80%
            const isWarning = usage.percentUsed > (settings.warningThreshold || 80)
            const isCritical = usage.percentUsed > (settings.criticalThreshold || 95)

            setUsageWarning(isWarning)

            if (isCritical) {
                setErrorMessage("Translation limit nearly reached")
                return false
            }

            return true
        } catch (error) {
            console.error("Error checking translation status:", error)
            setErrorMessage("Error checking translation status")
            return false
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

        // Mark that user has interacted with language switcher
        setHasInteracted(true)
        setIsTranslating(true)
        setCacheStats(null)

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

            // Skip translation for admin pages
            if (isAdminPage()) {
                console.log("[LANGUAGE CHANGE SKIPPED] Admin page detected, skipping translation")
                setCurrentLanguage(language)
                setIsTranslating(false)
                return
            }

            // Check translation status before translating
            const canTranslate = await checkTranslationStatus()

            if (!canTranslate) {
                // Still update the language preference even if we can't translate
                setCurrentLanguage(language)
                setIsTranslating(false)
                return
            }

            console.log(`[LANGUAGE CHANGE] Changing language from ${currentLanguage} to ${language}`)

            // Clear all cached translations for this language to ensure fresh translation
            clearLanguageCache(language)

            // NEW: Force retranslation to ensure clean translation
            const stats = await forceRetranslateAll(language, DEFAULT_LANGUAGE)
            setCacheStats(stats)
            setPageLanguageMatches(true) // Mark that page now matches language

            console.log(`[LANGUAGE CHANGE] Translation complete: ${stats.translatedTexts} texts translated`)

            // Check for any remaining markers
            const remainingMarkers = fixTranslationMarkers()
            setHasMarkers(remainingMarkers > 0)

            // NEW: Check for mixed language content after translation
            const mixedElements = detectMixedLanguageContent(language)
            setHasMixedLanguage(mixedElements.length > 0)
            setMixedLanguageElements(mixedElements)

            // Set up navigation translation for future page changes
            setupNavigationTranslation(language)

            // Update state after translation is complete
            setCurrentLanguage(language)
        } catch (error) {
            console.error("Error changing language:", error)
            setErrorMessage(error instanceof Error ? error.message : "Translation failed")
            setPageLanguageMatches(false) // Mark that page doesn't match language
        } finally {
            setIsTranslating(false)
        }
    }

    // Force retranslation of the current page
    const handleForceTranslate = () => {
        if (currentLanguage === DEFAULT_LANGUAGE) return

        // Skip for admin pages
        if (isAdminPage()) {
            console.log("[FORCE TRANSLATE SKIPPED] Admin page detected, skipping translation")
            return
        }

        setIsTranslating(true)
        setCacheStats(null)

        // Clear all cached translations for this language to ensure fresh translation
        clearLanguageCache(currentLanguage)

        translateCurrentPage(currentLanguage, DEFAULT_LANGUAGE)
          .then(() => {
              setPageLanguageMatches(true)
          })
          .catch((error) => {
              console.error("Error forcing translation:", error)
              setPageLanguageMatches(false)
          })
    }

    // Fix translation markers
    const handleFixMarkers = () => {
        // Skip for admin pages
        if (isAdminPage()) {
            return
        }

        const fixedCount = fixTranslationMarkers()
        if (fixedCount > 0) {
            console.log(`[CLEANUP] Fixed ${fixedCount} translation markers in the DOM`)
            setHasMarkers(false)
        }
    }

    // Toggle auto-translation
    const toggleAutoTranslate = () => {
        const newState = !autoTranslateEnabled
        setAutoTranslateEnabled(newState)
        localStorage.setItem("autoTranslateEnabled", newState.toString())
    }

    // Handle cache clear
    const handleClearCache = () => {
        clearTranslationCache()
        setCacheStats(null)
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

    // If we're on an admin page, show a simplified version
    if (isAdmin) {
        return (
          <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors bg-gray-100 hover:bg-gray-200"
                aria-expanded={isOpen}
                aria-haspopup="true"
              >
                  <span className="mr-1">{currentFlag}</span>
                  <span className="font-medium text-sm">{currentLanguage.toUpperCase()}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-1 w-60 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="px-3 py-2 text-xs text-blue-800 bg-blue-50 border-b border-blue-100">
                        Translation disabled for admin pages
                    </div>
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        {Object.entries(languages).map(([code, name]) => (
                          <button
                            key={code}
                            className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                              currentLanguage === code ? "bg-amber-50 text-amber-900" : "text-gray-700 hover:bg-gray-50"
                            }`}
                            role="menuitem"
                            onClick={() => {
                                setIsOpen(false)
                                localStorage.setItem("preferredLanguage", code as Language)
                                setCurrentLanguage(code as Language)
                                document.documentElement.lang = code
                            }}
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

    // Regular version for non-admin pages
    return (
      <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
                setIsOpen(!isOpen)
                // Only check translation status when dropdown is opened
                if (!isOpen && !hasInteracted) {
                    setHasInteracted(true)
                    checkTranslationStatus()
                }
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors ${
              hasMarkers
                ? "bg-red-100 hover:bg-red-200"
                : hasMixedLanguage
                  ? "bg-purple-100 hover:bg-purple-200"
                  : !pageLanguageMatches
                    ? "bg-amber-100 hover:bg-amber-200"
                    : usageWarning
                      ? "bg-amber-100 hover:bg-amber-200"
                      : "bg-amber-50 hover:bg-amber-100"
            }`}
            aria-expanded={isOpen}
            aria-haspopup="true"
            disabled={isTranslating}
          >
              <span className="mr-1">{currentFlag}</span>
              <span className="font-medium text-sm">{currentLanguage.toUpperCase()}</span>
              {isTranslating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : hasMarkers ? (
                <AlertCircle className="h-3.5 w-3.5 text-red-600" />
              ) : hasMixedLanguage ? (
                <AlertCircle className="h-3.5 w-3.5 text-purple-600" />
              ) : !pageLanguageMatches ? (
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              ) : usageWarning ? (
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-1 w-60 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                {hasMarkers && (
                  <div className="px-3 py-2 text-xs text-red-800 bg-red-50 border-b border-red-100 flex justify-between items-center">
                      <span>Translation markers detected</span>
                      <button
                        onClick={handleFixMarkers}
                        className="flex items-center gap-1 text-red-700 hover:text-red-900"
                        disabled={isTranslating}
                      >
                          <Trash2 className="h-3 w-3" />
                          <span>Fix</span>
                      </button>
                  </div>
                )}

                {hasMixedLanguage && (
                  <div className="px-3 py-2 text-xs text-purple-800 bg-purple-50 border-b border-purple-100 flex justify-between items-center">
                      <span>Mixed language content detected</span>
                      <button
                        onClick={handleForceTranslate}
                        className="flex items-center gap-1 text-purple-700 hover:text-purple-900"
                        disabled={isTranslating}
                      >
                          <RefreshCw className="h-3 w-3" />
                          <span>Fix</span>
                      </button>
                  </div>
                )}

                {!pageLanguageMatches && currentLanguage !== DEFAULT_LANGUAGE && (
                  <div className="px-3 py-2 text-xs text-amber-800 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
                      <span>Page not translated</span>
                      <button
                        onClick={handleForceTranslate}
                        className="flex items-center gap-1 text-amber-700 hover:text-amber-900"
                        disabled={isTranslating}
                      >
                          <RefreshCw className="h-3 w-3" />
                          <span>Retry</span>
                      </button>
                  </div>
                )}

                {(usageWarning || errorMessage) && (
                  <div className="px-3 py-2 text-xs text-amber-800 bg-amber-50 border-b border-amber-100">
                      {errorMessage || `Translation usage: ${Math.round(usagePercent)}% of monthly limit`}
                  </div>
                )}

                {cacheStats && (
                  <div className="px-3 py-2 text-xs border-b">
                      <div className="flex justify-between mb-1">
                          <span className="text-gray-500">Total texts:</span>
                          <span className="font-medium">{cacheStats.totalTexts}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                          <span className="text-gray-500">From cache:</span>
                          <span className="font-medium text-emerald-600">
                  {cacheStats.cachedTexts} (
                              {cacheStats.totalTexts > 0 ? Math.round((cacheStats.cachedTexts / cacheStats.totalTexts) * 100) : 0}%)
                </span>
                      </div>
                      <div className="flex justify-between mb-1">
                          <span className="text-gray-500">Newly translated:</span>
                          <span className="font-medium text-blue-600">
                  {cacheStats.translatedTexts} (
                              {cacheStats.totalTexts > 0
                                ? Math.round((cacheStats.translatedTexts / cacheStats.totalTexts) * 100)
                                : 0}
                              %)
                </span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-500">API calls:</span>
                          <span className="font-medium text-purple-600">{cacheStats.apiCalls}</span>
                      </div>
                      <button
                        onClick={handleClearCache}
                        className="mt-2 w-full flex items-center justify-center gap-1 py-1 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      >
                          <Archive className="h-3 w-3" />
                          <span>Clear Translation Cache</span>
                      </button>
                  </div>
                )}

                {currentLanguage !== DEFAULT_LANGUAGE && (
                  <div className="px-3 py-2 border-b">
                      <label className="flex items-center justify-between text-sm cursor-pointer">
                          <span>Auto-translate new pages</span>
                          <div
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoTranslateEnabled ? "bg-blue-600" : "bg-gray-200"}`}
                          >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoTranslateEnabled ? "translate-x-5" : "translate-x-1"}`}
                  />
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={autoTranslateEnabled}
                                onChange={toggleAutoTranslate}
                              />
                          </div>
                      </label>
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
