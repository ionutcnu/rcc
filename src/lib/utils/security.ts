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
