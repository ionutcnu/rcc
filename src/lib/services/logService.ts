"use client"

// Client-side logging service that uses API routes instead of direct Firebase access

type LogLevel = "info" | "warn" | "error" | "debug"

interface LogRequest {
  level: LogLevel
  message: string
  details?: any
  userId?: string | null
  userEmail?: string | null
}

export const logService = {
  async log(level: LogLevel, message: string, details?: any, userId?: string | null, userEmail?: string | null): Promise<void> {
    try {
      // In development, also log to console
      if (process.env.NODE_ENV !== "production") {
        console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
          `[${level.toUpperCase()}] ${message}`,
          details || ""
        )
      }

      // Send log to API
      await fetch("/api/logs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          level,
          message,
          details,
          userId,
          userEmail,
        } as LogRequest),
      })
    } catch (error) {
      // Fallback to console if API call fails
      console.error("Failed to send log to API:", error)
      console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](message, details || "")
    }
  },

  info: (message: string, details?: any, userId?: string | null, userEmail?: string | null) => 
    logService.log("info", message, details, userId, userEmail),

  warn: (message: string, details?: any, userId?: string | null, userEmail?: string | null) => 
    logService.log("warn", message, details, userId, userEmail),

  error: (message: string, error?: any, userId?: string | null, userEmail?: string | null) => 
    logService.log("error", message, error, userId, userEmail),

  debug: (message: string, details?: any, userId?: string | null, userEmail?: string | null) => {
    if (process.env.DEBUG) {
      logService.log("debug", message, details, userId, userEmail)
    }
  },

  // Media specific operations
  mediaAccess: (mediaId: string, url: string, userId?: string | null, userEmail?: string | null) =>
    logService.info(`Accessed media: ${mediaId}`, { url }, userId, userEmail),

  mediaDelete: (mediaId: string, path: string, userId?: string | null, userEmail?: string | null, isSoftDelete = false) =>
    logService.warn(
      `${isSoftDelete ? "Soft deleted" : "Deleted"} media: ${mediaId}`,
      { path, isSoftDelete },
      userId,
      userEmail
    ),

  mediaBulkOperation: (operation: string, count: number, details?: any, userId?: string | null, userEmail?: string | null) =>
    logService.warn(`Bulk operation: ${operation} on ${count} items`, details, userId, userEmail),
}