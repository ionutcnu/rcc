/**
 * Debug logger utility that only logs in development mode
 */

// Check if we're in development mode
const isDev = process.env.NODE_ENV !== "production"

/**
 * Log a message only in development mode
 * @param message The message to log
 * @param optionalParams Additional parameters to log
 */
export function devLog(message: any, ...optionalParams: any[]): void {
  if (isDev) {
    console.log(`[DEV] ${message}`, ...optionalParams)
  }
}

/**
 * Log an error only in development mode
 * @param message The error message to log
 * @param optionalParams Additional parameters to log
 */
export function devError(message: any, ...optionalParams: any[]): void {
  if (isDev) {
    console.error(`[DEV ERROR] ${message}`, ...optionalParams)
  }
}

/**
 * Log a warning only in development mode
 * @param message The warning message to log
 * @param optionalParams Additional parameters to log
 */
export function devWarn(message: any, ...optionalParams: any[]): void {
  if (isDev) {
    console.warn(`[DEV WARNING] ${message}`, ...optionalParams)
  }
}

/**
 * Log information only in development mode
 * @param message The info message to log
 * @param optionalParams Additional parameters to log
 */
export function devInfo(message: any, ...optionalParams: any[]): void {
  if (isDev) {
    console.info(`[DEV INFO] ${message}`, ...optionalParams)
  }
}

/**
 * Always log regardless of environment (use sparingly)
 * @param message The message to log
 * @param optionalParams Additional parameters to log
 */
export function alwaysLog(message: any, ...optionalParams: any[]): void {
  console.log(`[IMPORTANT] ${message}`, ...optionalParams)
}
