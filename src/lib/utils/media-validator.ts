import { serverLogger } from "./server-logger"
import { mediaLogger } from "./media-logger"
import { isServer } from "@/lib/utils/isServer"

// Use the appropriate logger based on environment
const logger = isServer() ? serverLogger : mediaLogger

/**
 * Safely checks if a media URL is accessible
 * @param url The URL to check
 * @returns Promise<boolean> true if accessible, false if not
 */
export async function isMediaAccessible(url: string): Promise<boolean> {
    // Skip empty URLs and placeholders
    if (!url || url.includes("placeholder")) {
        return true
    }

    try {
        // Use a timeout to prevent hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        try {
            const response = await fetch(url, {
                method: "HEAD",
                signal: controller.signal,
            })

            clearTimeout(timeoutId)
            return response.ok
        } catch (error) {
            clearTimeout(timeoutId)
            console.error(`Error checking media URL ${url}:`, error)
            // Assume the URL is valid if we can't check it
            return true
        }
    } catch (e) {
        console.error("Error in media validation:", e)
        // Assume the URL is valid if we can't check it
        return true
    }
}

/**
 * Validates all media URLs and returns a summary of the results
 * @param progressCallback Callback to report progress
 * @returns Object containing broken, missing, and valid URLs
 */
export async function validateAllMedia(
  progressCallback?: (current: number, total: number) => void,
): Promise<{ broken: string[]; missing: string[]; valid: string[]; total: number }> {
    const broken: string[] = []
    const missing: string[] = []
    const valid: string[] = []
    let total = 0

    try {
        // Dynamically import getAllMedia to avoid circular dependencies
        const { getAllMedia } = await import("@/lib/firebase/storageService")
        const mediaItems = await getAllMedia()
        total = mediaItems.length

        // Log the start of validation
        if (isServer()) {
            await logger.info(`Starting validation of ${total} media items`)
        } else {
            logger.info(`Starting validation of ${total} media items`)
        }

        for (let i = 0; i < mediaItems.length; i++) {
            const item = mediaItems[i]
            const url = item.url

            if (!url || url.includes("placeholder")) {
                missing.push(url || item.name)
            } else {
                const isAccessible = await isMediaAccessible(url)
                if (isAccessible) {
                    valid.push(url)
                } else {
                    broken.push(url)

                    // Log broken URLs
                    if (isServer()) {
                        await logger.warn(`Found broken media URL: ${url}`, { id: item.id, name: item.name })
                    } else {
                        logger.warn(`Found broken media URL: ${url}`, { id: item.id, name: item.name })
                    }
                }
            }

            // Report progress
            if (progressCallback) {
                progressCallback(i + 1, mediaItems.length)
            }
        }

        // Log validation results
        const results = { broken, missing, valid, total }
        if (isServer()) {
            await logger.info(`Media validation complete`, {
                brokenCount: broken.length,
                missingCount: missing.length,
                validCount: valid.length,
                total,
            })
        } else {
            logger.info(`Media validation complete`, {
                brokenCount: broken.length,
                missingCount: missing.length,
                validCount: valid.length,
                total,
            })
        }

        return results
    } catch (error) {
        console.error("Error during media validation:", error)

        // Log the error
        if (isServer()) {
            await logger.error(`Error during media validation`, { error })
        } else {
            logger.error(`Error during media validation`, { error })
        }

        return { broken, missing, valid, total }
    }
}
