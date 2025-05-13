export interface DeepLUsage {
    characterCount: number
    characterLimit: number
    percentUsed: number
    limitReached: boolean
    lastChecked: Date
}

const LOCAL_USAGE_KEY = "deeplUsage"

// Get usage data from localStorage
export function getLocalUsage(): DeepLUsage {
    try {
        const savedUsage = localStorage.getItem(LOCAL_USAGE_KEY)
        if (savedUsage) {
            const usage = JSON.parse(savedUsage)
            usage.lastChecked = new Date(usage.lastChecked)
            return usage
        }
    } catch (error) {
        console.error("Error reading usage from localStorage:", error)
    }

    // Default values if no saved data
    return {
        characterCount: 0,
        characterLimit: 500000,
        percentUsed: 0,
        limitReached: false,
        lastChecked: new Date(),
    }
}

// Update usage data in localStorage
export function updateLocalUsage(usage: DeepLUsage): void {
    try {
        localStorage.setItem(
          LOCAL_USAGE_KEY,
          JSON.stringify({
              ...usage,
              lastChecked: new Date(),
          }),
        )
    } catch (error) {
        console.error("Error saving usage to localStorage:", error)
    }
}

// Reset usage tracking
export async function resetUsageTracking(): Promise<void> {
    try {
        localStorage.removeItem(LOCAL_USAGE_KEY)
    } catch (error) {
        console.error("Error resetting usage tracking:", error)
    }
}
