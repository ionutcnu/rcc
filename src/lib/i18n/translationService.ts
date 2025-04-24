"use client"

import type { Language } from "./types"
import { updateLocalCharacterCount, shouldCheckUsage, isLimitReached } from "./usageTracker"

// Default site language
const DEFAULT_LANGUAGE: Language = "en"

// Cache structure to store translations and reduce API calls
interface TranslationCache {
    [key: string]: {
        [targetLang: string]: string
    }
}

// In-memory cache for translations
const translationCache: TranslationCache = {}

// Maximum text length to send in a single request
const MAX_TEXT_LENGTH = 1000

// Minimum text length to translate (skip very short texts)
const MIN_TEXT_LENGTH = 3

/**
 * Generates a cache key for storing translations
 */
const getCacheKey = (text: string): string => {
    // Use a simple hash function for the text to keep cache keys manageable
    let hash = 0
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash // Convert to 32bit integer
    }
    return `${hash}`
}

/**
 * Check DeepL usage statistics from the API
 */
export async function checkDeepLUsage(): Promise<boolean> {
    try {
        const response = await fetch("/api/translate/usage")
        if (!response.ok) {
            throw new Error(`Failed to fetch usage: ${response.status}`)
        }

        const usageData = await response.json()

        // Save to local storage
        if (typeof window !== "undefined") {
            localStorage.setItem("deepl-usage-stats", JSON.stringify(usageData))
        }

        // Return true if limit is reached
        return usageData.limitReached
    } catch (error) {
        console.error("Error checking DeepL usage:", error)
        return false
    }
}

/**
 * Translates text using the selected translation API
 */
export async function translateText(
    text: string,
    targetLanguage: Language,
    sourceLanguage: Language = DEFAULT_LANGUAGE,
): Promise<string> {
    // Skip very short texts
    if (text.length < MIN_TEXT_LENGTH) {
        return text
    }

    // Don't translate if the target language is the same as source
    if (targetLanguage === sourceLanguage) {
        return text
    }

    // Don't translate if target is the default language - return original text
    if (targetLanguage === DEFAULT_LANGUAGE) {
        return text
    }

    // Check if usage limit has been reached
    if (isLimitReached()) {
        console.warn("Translation limit reached, returning original text")
        return text
    }

    // Check if we need to update usage stats
    if (shouldCheckUsage()) {
        const limitReached = await checkDeepLUsage()
        if (limitReached) {
            return text
        }
    }

    // Check if we have this translation in cache
    const cacheKey = getCacheKey(text)
    if (translationCache[cacheKey]?.[targetLanguage]) {
        return translationCache[cacheKey][targetLanguage]
    }

    try {
        // Make API call to translation service
        const response = await fetch("/api/translate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text,
                targetLanguage,
                sourceLanguage,
            }),
        })

        if (!response.ok) {
            throw new Error(`Translation API error: ${response.status}`)
        }

        const data = await response.json()

        // Check if limit was reached during translation
        if (data.limitReached) {
            console.warn("Translation limit reached during request")
            return text
        }

        const translatedText = data.translatedText

        // Update local character count if not from cache
        if (!data.fromCache) {
            updateLocalCharacterCount(text.length)
        }

        // Cache the result
        if (!translationCache[cacheKey]) {
            translationCache[cacheKey] = {}
        }
        translationCache[cacheKey][targetLanguage] = translatedText

        return translatedText
    } catch (error) {
        console.error("Translation error:", error)
        return text // Return original text on error
    }
}

/**
 * Optimizes text for translation by removing unnecessary whitespace
 */
function optimizeText(text: string): string {
    return text.trim().replace(/\s+/g, " ")
}

/**
 * Translates an entire HTML element and its children
 */
export async function translateElement(
    element: HTMLElement,
    targetLanguage: Language,
    sourceLanguage: Language = DEFAULT_LANGUAGE,
): Promise<void> {
    // Skip translation if target is the default language
    if (targetLanguage === DEFAULT_LANGUAGE) {
        return
    }

    // Check if usage limit has been reached
    if (isLimitReached()) {
        console.warn("Translation limit reached, skipping translation")
        return
    }

    // Skip translation for certain elements
    const skipNodeNames = [
        "SCRIPT",
        "STYLE",
        "NOSCRIPT",
        "IFRAME",
        "OBJECT",
        "EMBED",
        "BUTTON",
        "SELECT",
        "OPTION",
        "CODE",
        "PRE",
    ]
    if (skipNodeNames.includes(element.nodeName)) {
        return
    }

    // Skip elements with data-no-translate attribute
    if (element.getAttribute("data-no-translate") === "true") {
        return
    }

    // Skip elements with certain classes
    const skipClasses = ["no-translate", "notranslate"]
    if (element.classList && skipClasses.some((cls) => element.classList.contains(cls))) {
        return
    }

    // Collect text nodes for batch translation
    const textNodes: { node: Node; text: string }[] = []
    let totalChars = 0

    // Process text nodes directly under this element
    for (const node of Array.from(element.childNodes)) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
            const originalText = node.textContent.trim()
            if (originalText.length >= MIN_TEXT_LENGTH) {
                const optimizedText = optimizeText(originalText)
                textNodes.push({ node, text: optimizedText })
                totalChars += optimizedText.length

                // If we've collected enough text, translate this batch
                if (totalChars >= MAX_TEXT_LENGTH) {
                    await translateTextNodes(textNodes, targetLanguage, sourceLanguage)
                    textNodes.length = 0
                    totalChars = 0
                }
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Recursively translate child elements
            await translateElement(node as HTMLElement, targetLanguage, sourceLanguage)
        }
    }

    // Translate any remaining text nodes
    if (textNodes.length > 0) {
        await translateTextNodes(textNodes, targetLanguage, sourceLanguage)
    }
}

/**
 * Translates a batch of text nodes
 */
async function translateTextNodes(
    textNodes: { node: Node; text: string }[],
    targetLanguage: Language,
    sourceLanguage: Language,
): Promise<void> {
    // Process each text node individually for now
    // In a future optimization, we could batch these together
    for (const { node, text } of textNodes) {
        if (text.length >= MIN_TEXT_LENGTH) {
            const translatedText = await translateText(text, targetLanguage, sourceLanguage)
            if (translatedText !== text && node.textContent) {
                node.textContent = node.textContent.replace(text, translatedText)
            }
        }
    }
}

/**
 * Translates the entire page content
 */
export async function translatePage(
    targetLanguage: Language,
    sourceLanguage: Language = DEFAULT_LANGUAGE,
): Promise<void> {
    // Skip translation if target is the default language
    if (targetLanguage === DEFAULT_LANGUAGE) {
        return
    }

    // Check if usage limit has been reached
    if (isLimitReached()) {
        console.warn("Translation limit reached, skipping page translation")
        return
    }

    // Select the main content areas to translate
    const contentElements = document.querySelectorAll("main, article, section, .content, #content, .main-content")

    if (contentElements.length === 0) {
        // If no specific content areas found, translate the body
        await translateElement(document.body, targetLanguage, sourceLanguage)
    } else {
        // Translate each content element
        for (const element of Array.from(contentElements)) {
            await translateElement(element as HTMLElement, targetLanguage, sourceLanguage)
        }
    }
}

/**
 * Clear the translation cache
 */
export function clearTranslationCache(): void {
    Object.keys(translationCache).forEach((key) => {
        delete translationCache[key]
    })
}
