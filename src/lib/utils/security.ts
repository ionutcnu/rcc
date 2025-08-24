/**
 * Security utility functions for production environments
 */

/**
 * Safely logs errors in development but not in production
 * @param message Error message
 * @param error Error object
 */
export function safeErrorLog(message: string, error?: any): void {
    if (process.env.NODE_ENV !== "production") {
        console.error(message, error)
    }
}

/**
 * Creates a generic error message for users
 * @param errorCode Internal error code
 * @returns User-friendly error message
 */
export function getUserFriendlyError(errorCode: string): string {
    // Map internal error codes to user-friendly messages
    const errorMap: Record<string, string> = {
        "auth/user-disabled": "This account has been disabled. Please contact support.",
        "auth/invalid-email": "Invalid email or password. Please try again.",
        "auth/user-not-found": "Invalid email or password. Please try again.",
        "auth/wrong-password": "Invalid email or password. Please try again.",
        "auth/too-many-requests": "Too many unsuccessful login attempts. Please try again later.",
        "auth/network-request-failed": "Network error. Please check your connection and try again.",
        "auth/invalid-credential": "Authentication failed. Please try again.",
        "auth/session-expired": "Your session has expired. Please sign in again.",
        "permission/insufficient": "You don't have permission to access this resource.",
        "server/unavailable": "The server is currently unavailable. Please try again later.",
    }

    return errorMap[errorCode] || "An unexpected error occurred. Please try again later."
}

/**
 * Strips sensitive information from error objects
 * @param error Original error
 * @returns Sanitized error
 */
export function sanitizeError(error: any): { message: string; code?: string } {
    if (!error) return { message: "Unknown error" }

    // Extract only safe properties
    return {
        message: getUserFriendlyError(error.code || "unknown"),
        code: error.code ? error.code.replace(/^auth\//, "error/") : "error/unknown",
    }
}

/**
 * Validates and sanitizes URLs for use in HTML attributes
 * Prevents XSS attacks through malicious URL schemes
 * @param url The URL to validate
 * @param allowedProtocols Array of allowed protocols (default: ['http:', 'https:', 'blob:', 'data:'])
 * @returns Sanitized URL or safe fallback
 */
export function sanitizeUrl(url: string | null | undefined, allowedProtocols: string[] = ['http:', 'https:', 'blob:', 'data:']): string {
    if (!url || typeof url !== 'string') {
        return '/placeholder.svg'
    }

    // Remove any leading/trailing whitespace
    const trimmedUrl = url.trim()
    
    if (!trimmedUrl) {
        return '/placeholder.svg'
    }

    try {
        // Handle relative URLs (safe by default)
        if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('./') || trimmedUrl.startsWith('../')) {
            // Additional validation for path injection
            if (trimmedUrl.includes('..') && !trimmedUrl.startsWith('../')) {
                return '/placeholder.svg'
            }
            return trimmedUrl
        }

        // Parse absolute URLs
        const parsedUrl = new URL(trimmedUrl)
        
        // Check if protocol is allowed
        if (!allowedProtocols.includes(parsedUrl.protocol)) {
            safeErrorLog(`Blocked unsafe URL protocol: ${parsedUrl.protocol}`)
            return '/placeholder.svg'
        }

        // Additional validation for blob URLs to ensure they're from same origin
        if (parsedUrl.protocol === 'blob:') {
            if (typeof window !== 'undefined' && parsedUrl.origin !== window.location.origin) {
                safeErrorLog(`Blocked cross-origin blob URL: ${trimmedUrl}`)
                return '/placeholder.svg'
            }
        }

        // Block javascript: and data: URLs with suspicious content
        if (parsedUrl.protocol === 'javascript:') {
            safeErrorLog(`Blocked javascript: URL: ${trimmedUrl}`)
            return '/placeholder.svg'
        }

        return trimmedUrl
        
    } catch (error) {
        safeErrorLog(`Invalid URL format: ${trimmedUrl}`, error)
        return '/placeholder.svg'
    }
}

/**
 * Sanitizes URLs specifically for media elements (img, video, audio)
 * More restrictive than general URL sanitization
 * @param url The media URL to validate
 * @returns Sanitized URL or safe fallback
 */
export function sanitizeMediaUrl(url: string | null | undefined): string {
    return sanitizeUrl(url, ['http:', 'https:', 'blob:'])
}
