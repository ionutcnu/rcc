import { isServer } from "@/lib/utils/isServer"

if (!isServer()) {
  throw new Error("Server logger can only be used on the server. Do not import this file in client components.")
}

import { adminDb } from "@/lib/firebase/admin"

// Define log levels
type LogLevel = "info" | "warn" | "error" | "debug"

// Define log entry structure
interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  details?: any
  userId?: string | null // Updated to allow null
  userEmail?: string | null // Updated to allow null
}

// Configuration for logging
const LOG_CONFIG = {
  // Set to false to disable debug logs being written to Firestore
  WRITE_DEBUG_TO_DB: process.env.DEBUG === "true",
  // Set to false to disable all debug logs (console and DB)
  ENABLE_DEBUG_LOGS: process.env.NODE_ENV !== "production" || process.env.DEBUG === "true",
  // Set to false to disable all database logging
  WRITE_LOGS_TO_DB: process.env.DISABLE_DB_LOGGING !== "true",
  // Set to true to log API requests
  LOG_API_REQUESTS: process.env.LOG_API_REQUESTS === "true",
  // Set to true to log database operations
  LOG_DB_OPERATIONS: process.env.LOG_DB_OPERATIONS === "true",
}

/**
 * Removes undefined values from an object recursively
 * Firestore doesn't accept undefined values
 */
function removeUndefined(obj: any): any {
  if (obj === undefined) return null
  if (obj === null || typeof obj !== "object") return obj

  if (Array.isArray(obj)) {
    return obj.map(removeUndefined)
  }

  const result: Record<string, any> = {}
  for (const key in obj) {
    const value = removeUndefined(obj[key])
    if (value !== undefined) {
      result[key] = value
    }
  }
  return result
}

/**
 * Server-side only logger that uses Firebase Admin SDK
 * This avoids permission issues when logging from API routes
 */
class ServerLogger {
  private logCollection: string

  constructor(collectionName = "logs") {
    this.logCollection = collectionName
  }

  async info(message: string, details?: any, userId?: string, userEmail?: string): Promise<void> {
    return this.log("info", message, details, userId, userEmail)
  }

  async warn(message: string, details?: any, userId?: string, userEmail?: string): Promise<void> {
    return this.log("warn", message, details, userId, userEmail)
  }

  async error(message: string, details?: any, userId?: string, userEmail?: string): Promise<void> {
    return this.log("error", message, details, userId, userEmail)
  }

  async debug(message: string, details?: any, userId?: string, userEmail?: string): Promise<void> {
    // Skip debug logs if disabled
    if (!LOG_CONFIG.ENABLE_DEBUG_LOGS) {
      return
    }

    // Skip writing to DB for API and DB operation logs
    const isApiLog = message.includes("API Request") || message.includes("API response")
    const isDbLog =
      message.includes("Executing Firestore") ||
      message.includes("Query returned") ||
      message.includes("Cache hit") ||
      message.includes("Cached") ||
      message.includes("Returning") ||
      message.includes("filtered logs")

    // Skip DB writes for API and DB logs unless explicitly enabled
    const skipDbWrite =
      (isApiLog && !LOG_CONFIG.LOG_API_REQUESTS) ||
      (isDbLog && !LOG_CONFIG.LOG_DB_OPERATIONS) ||
      !LOG_CONFIG.WRITE_DEBUG_TO_DB

    // Always log to console in development
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEBUG] ${message}`, details || "")
    }

    // Skip DB write if configured to do so
    if (skipDbWrite) {
      return
    }

    return this.log("debug", message, details, userId, userEmail)
  }

  private async log(
    level: LogLevel,
    message: string,
    details?: any,
    userId?: string,
    userEmail?: string,
  ): Promise<void> {
    try {
      // Skip DB writes if disabled
      if (!LOG_CONFIG.WRITE_LOGS_TO_DB) {
        // Still log to console
        if (process.env.NODE_ENV !== "production") {
          console.log(`[${level.toUpperCase()}] ${message}`, details || "")
        }
        return
      }

      // Create log entry with sanitized values
      const logEntry: LogEntry = {
        timestamp: new Date(),
        level,
        message,
        // Convert undefined values to null
        details: details === undefined ? null : removeUndefined(details),
        userId: userId || null,
        userEmail: userEmail || null,
      }

      await adminDb.collection(this.logCollection).add(logEntry)

      // Also log to console in development
      if (process.env.NODE_ENV !== "production") {
        console.log(`[${level.toUpperCase()}] ${message}`, details || "")
      }
    } catch (error) {
      // Log to console if Firestore logging fails
      console.error("Failed to write server log:", error)
      console.log(`[${level.toUpperCase()}] ${message}`, details || "")
    }
  }

  // Media specific operations
  async mediaAccess(mediaId: string, url: string, userId?: string, userEmail?: string): Promise<void> {
    return this.info(`Accessed media: ${mediaId}`, { url }, userId, userEmail)
  }

  async mediaDelete(
    mediaId: string,
    path: string,
    userId?: string,
    userEmail?: string,
    isSoftDelete = false,
  ): Promise<void> {
    return this.warn(
      `${isSoftDelete ? "Soft deleted" : "Deleted"} media: ${mediaId}`,
      { path, isSoftDelete },
      userId,
      userEmail,
    )
  }

  async mediaBulkOperation(
    operation: string,
    count: number,
    details?: any,
    userId?: string,
    userEmail?: string,
  ): Promise<void> {
    return this.warn(`Bulk operation: ${operation} on ${count} items`, details, userId, userEmail)
  }
}

// Export singleton instance
export const serverLogger = new ServerLogger()
