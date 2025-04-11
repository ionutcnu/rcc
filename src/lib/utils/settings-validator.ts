import type { SeoSettings, FirebaseSettings } from "@/lib/firebase/settingsService"

export interface ValidationResult {
    valid: boolean
    errors: Record<string, string>
}

export function validateSeoSettings(settings: SeoSettings): ValidationResult {
    const errors: Record<string, string> = {}

    // Validate meta title
    if (!settings.metaTitle.trim()) {
        errors.metaTitle = "Meta title is required"
    } else if (settings.metaTitle.length > 60) {
        errors.metaTitle = "Meta title should be 60 characters or less"
    }

    // Validate meta description
    if (!settings.metaDescription.trim()) {
        errors.metaDescription = "Meta description is required"
    } else if (settings.metaDescription.length > 160) {
        errors.metaDescription = "Meta description should be 160 characters or less"
    }

    // Validate OG image URL (if provided)
    if (settings.ogImage && !isValidUrl(settings.ogImage)) {
        errors.ogImage = "Invalid URL format"
    }

    // Validate Google Analytics ID (if provided)
    if (settings.googleAnalyticsId && !isValidGAID(settings.googleAnalyticsId)) {
        errors.googleAnalyticsId = "Invalid Google Analytics ID format"
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    }
}

export function validateFirebaseSettings(settings: FirebaseSettings): ValidationResult {
    const errors: Record<string, string> = {}

    // Validate max image size
    if (settings.maxImageSize <= 0) {
        errors.maxImageSize = "Maximum image size must be greater than 0"
    } else if (settings.maxImageSize > 50) {
        errors.maxImageSize = "Maximum image size cannot exceed 50MB"
    }

    // Validate max video size
    if (settings.maxVideoSize <= 0) {
        errors.maxVideoSize = "Maximum video size must be greater than 0"
    } else if (settings.maxVideoSize > 200) {
        errors.maxVideoSize = "Maximum video size cannot exceed 200MB"
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    }
}

// Helper function to validate email format
function isValidEmail(email: string): boolean {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return re.test(email)
}

// Helper function to validate URL format
function isValidUrl(url: string): boolean {
    try {
        new URL(url)
        return true
    } catch (e) {
        return false
    }
}

// Helper function to validate Google Analytics ID format
function isValidGAID(gaId: string): boolean {
    // Accept both UA-XXXXX-Y and G-XXXXXXXX formats
    return /^UA-\d+-\d+$/.test(gaId) || /^G-[A-Z0-9]+$/.test(gaId)
}
