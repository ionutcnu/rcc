/**
 * Secure logging utility that only logs in development environment
 */

// Check if we're in production
const isProduction = process.env.NODE_ENV === "production"

/**
 * Safe console logging that only works in development
 */
export const logger = {
    log: (...args: any[]) => {
        if (!isProduction) {
            console.log(...args)
        }
    },

    error: (...args: any[]) => {
        if (!isProduction) {
            console.error(...args)
        }
    },

    warn: (...args: any[]) => {
        if (!isProduction) {
            console.warn(...args)
        }
    },

    info: (...args: any[]) => {
        if (!isProduction) {
            console.info(...args)
        }
    },

    debug: (...args: any[]) => {
        if (!isProduction) {
            console.debug(...args)
        }
    },
}

/**
 * Safely logs errors with sanitized information for production
 */
export function safeErrorLog(message: string, error?: any): void {
    if (isProduction) {
        // In production, log minimal information without stack traces or paths
        const sanitizedError = error
            ? {
                message: error.message || "Unknown error",
                code: error.code || "UNKNOWN_ERROR",
            }
            : {}

        // Use a custom error reporting service here if available
        // errorReportingService.report(message, sanitizedError);
    } else {
        // In development, log full error details
        console.error(message, error)
    }
}
