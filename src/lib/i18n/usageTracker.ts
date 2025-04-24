export interface DeepLUsage {
    characterCount: number
    characterLimit: number
    percentUsed: number
    limitReached: boolean
    lastChecked: Date
}

/**
 * Gets the DeepL usage statistics from local storage
 */
export function getLocalUsage(): DeepLUsage {
    if (typeof localStorage === "undefined") {
        return {
            characterCount: 0,
            characterLimit: 500000,
            percentUsed: 0,
            limitReached: false,
            lastChecked: new Date(0),
        }
    }

    const storedUsage = localStorage.getItem("deepl-usage-stats")

    if (storedUsage) {
        try {
            return JSON.parse(storedUsage) as DeepLUsage
        } catch (e) {
            console.error("Error parsing DeepL usage from local storage:", e)
        }
    }

    return {
        characterCount: 0,
        characterLimit: 500000,
        percentUsed: 0,
        limitReached: false,
        lastChecked: new Date(0),
    }
}

/**
 * Resets the DeepL usage statistics in local storage
 */
export function resetLocalUsage(): void {
    if (typeof localStorage !== "undefined") {
        localStorage.removeItem("deepl-usage-stats")
    }
}

/**
 * Updates the local character count
 */
export function updateLocalCharacterCount(count: number): void {
    if (typeof localStorage === "undefined") return

    const usage = getLocalUsage()
    usage.characterCount += count
    usage.percentUsed = (usage.characterCount / usage.characterLimit) * 100
    localStorage.setItem("deepl-usage-stats", JSON.stringify(usage))
}

/**
 * Checks if it's time to check the DeepL usage from the API
 */
export function shouldCheckUsage(): boolean {
    if (typeof localStorage === "undefined") return false

    const usage = getLocalUsage()
    const now = new Date()
    const lastChecked = usage.lastChecked

    // Check if it's been more than 1 hour since the last check
    const timeSinceLastCheck = now.getTime() - lastChecked.getTime()
    return timeSinceLastCheck > 60 * 60 * 1000
}

/**
 * Checks if the usage limit has been reached
 */
export function isLimitReached(): boolean {
    if (typeof localStorage === "undefined") return false

    const usage = getLocalUsage()
    return usage.limitReached
}

/**
 * Resets the usage tracking
 */
export const resetUsageTracking = async (): Promise<void> => {
    resetLocalUsage()
}
