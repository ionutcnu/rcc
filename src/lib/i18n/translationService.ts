import type { Language } from "./types"
import { updateLocalUsage } from "./usageTracker"

// Update the translatePage function to better handle text nodes and ensure translations are applied
export async function translatePage(targetLanguage: Language, sourceLanguage: Language = "en"): Promise<void> {
    try {
        // Get all text nodes in the document
        const textNodes = getTextNodes(document.body)

        // Skip translation if no text nodes found
        if (textNodes.length === 0) return

        // Group text nodes to reduce API calls (max 50 nodes per call)
        const textGroups = chunkArray(textNodes, 50)

        for (const group of textGroups) {
            // Extract text content from nodes
            const texts = group.map((node) => node.textContent || "")

            // Skip empty texts
            const nonEmptyTexts = texts.filter((text) => text.trim().length > 0)
            if (nonEmptyTexts.length === 0) continue

            // Call translation API
            const response = await fetch("/api/translate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    texts: nonEmptyTexts,
                    targetLanguage,
                    sourceLanguage,
                }),
            })

            if (!response.ok) {
                console.error(`Translation API error: ${response.status}`)
                const errorData = await response.json().catch(() => ({}))
                console.error("Translation API error details:", errorData)
                throw new Error(`Translation failed: ${response.statusText}`)
            }

            const result = await response.json()

            // Debug log to check what we're getting back
            console.log("Translation result:", result)

            // Apply translations back to nodes
            let translationIndex = 0
            for (let i = 0; i < group.length; i++) {
                const text = texts[i].trim()
                if (text.length > 0) {
                    // Make sure we have a translation before applying it
                    if (result.translatedTexts && result.translatedTexts[translationIndex]) {
                        group[i].textContent = result.translatedTexts[translationIndex++]
                    } else {
                        console.warn(`Missing translation for text: ${text}`)
                    }
                }
            }
        }

        // Add a small delay to ensure DOM updates are complete
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Force a re-render by triggering a small DOM change
        const dummyElement = document.createElement("div")
        dummyElement.style.display = "none"
        document.body.appendChild(dummyElement)
        document.body.removeChild(dummyElement)
    } catch (error) {
        console.error("Error translating page:", error)
        throw error
    }
}

// Improve the text node selection to ensure we're getting all translatable content
function getTextNodes(element: Node): Text[] {
    const textNodes: Text[] = []
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
            // Skip script and style elements
            const parent = node.parentElement
            if (
                !parent ||
                parent.tagName === "SCRIPT" ||
                parent.tagName === "STYLE" ||
                parent.tagName === "NOSCRIPT" ||
                parent.hasAttribute("data-no-translate") ||
                parent.closest("[data-no-translate]") ||
                (node.textContent?.trim().length || 0) === 0
            ) {
                return NodeFilter.FILTER_REJECT
            }

            // Skip nodes that are part of SVG elements (often icons)
            if (parent.closest("svg")) {
                return NodeFilter.FILTER_REJECT
            }

            // Skip nodes with only whitespace or very short content (likely not meaningful text)
            const text = node.textContent?.trim() || ""
            if (text.length === 0 || (text.length < 2 && !/[a-zA-Z]/.test(text))) {
                return NodeFilter.FILTER_REJECT
            }

            return NodeFilter.FILTER_ACCEPT
        },
    })

    let node
    while ((node = walker.nextNode())) {
        textNodes.push(node as Text)
    }

    return textNodes
}

// Helper function to chunk array into smaller groups
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
}

// Function to check DeepL usage
export async function checkDeepLUsage(): Promise<void> {
    try {
        const response = await fetch("/api/translate/usage")
        if (!response.ok) {
            throw new Error("Failed to fetch usage data")
        }
        const data = await response.json()
        updateLocalUsage(data)
    } catch (error) {
        console.error("Error checking DeepL usage:", error)
        throw error
    }
}

// Function to clear translation cache
export function clearTranslationCache(): void {
    localStorage.removeItem("translationCache")
}
