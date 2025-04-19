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
