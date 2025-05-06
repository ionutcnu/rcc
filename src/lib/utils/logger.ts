/**
 * Secure logging utility that only logs in development environment
 */

// Check if we're in production
const isProduction = process.env.NODE_ENV === "production"

/**
 * Safely logs errors in development but not in production
 * @param message Error message
 * @param error Error object
 */
export function safeErrorLog(message: string, error?: any): void {
    if (isProduction) {
        // In production, log minimal information without stack traces or paths
        return
    }

    // In development, log full error details
    console.error(message, error)
}

/**
 * Logs an error message
 * @param message Error message
 * @param details Optional details to include in the log
 */
export function logError(message: string, details?: any): void {
    if (isProduction) {
        // In production, log minimal information without stack traces or paths
        return
    }

    console.error(message, details)
}
