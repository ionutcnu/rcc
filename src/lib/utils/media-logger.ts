import { db } from "@/lib/firebase/firebaseConfig"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { auth } from "@/lib/firebase/firebaseConfig"

// Define log levels
type LogLevel = "info" | "warn" | "error" | "debug"

// Define log entry structure
interface LogEntry {
    timestamp: any // Firestore timestamp
    level: LogLevel
    message: string
    details?: any
    userId?: string
    userEmail?: string // Added email field
}

// Media logger functions
export const mediaLogger = {
    async log(level: LogLevel, message: string, details?: any, userId?: string | null): Promise<void> {
        try {
            // Ensure level is one of the valid types
            const validLevel = ["info", "warn", "error", "debug"].includes(level) ? level : "info"

            // Get current user information - use the provided userId if available
            const currentUser = auth.currentUser

            // Get the actual email - don't default to unknown@email.com
            const userEmail = currentUser?.email || undefined

            // Use the actual user ID if available
            const actualUserId = userId || currentUser?.uid || undefined

            // Create a new details object that includes the email
            const enhancedDetails = {
                ...details,
                // Only add userEmail if it's not already in details
                ...(userEmail && !details?.userEmail && { userEmail }),
            }

            const logEntry: LogEntry = {
                timestamp: serverTimestamp(),
                level: validLevel,
                message,
                details: enhancedDetails,
            }

            // Only add user information if available
            if (actualUserId) {
                logEntry.userId = actualUserId
            }

            if (userEmail) {
                logEntry.userEmail = userEmail
            }

            // Add to Firestore logs collection
            await addDoc(collection(db, "logs"), logEntry)

            // Also output to console in development
            if (process.env.NODE_ENV !== "production") {
                const userInfo = userEmail ? `User: ${userEmail}` : actualUserId ? `UID: ${actualUserId}` : "No user info"
                console[validLevel === "error" ? "error" : validLevel === "warn" ? "warn" : "log"](
                    `[${validLevel.toUpperCase()}] ${message} - ${userInfo}`,
                    enhancedDetails || "",
                )
            }
        } catch (error) {
            // Fallback to console if logging fails
            console.error("Failed to write log:", error)
            console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](message, details || "")
        }
    },

    info: (message: string, details?: any, userId?: string | null) => mediaLogger.log("info", message, details, userId),

    warn: (message: string, details?: any, userId?: string | null) => mediaLogger.log("warn", message, details, userId),

    error: (message: string, error?: any, userId?: string | null) => mediaLogger.log("error", message, error, userId),

    debug: (message: string, details?: any, userId?: string | null) => {
        if (process.env.DEBUG) {
            mediaLogger.log("debug", message, details, userId)
        }
    },

    // Media specific operations - ensure these use the correct log levels
    mediaAccess: (mediaId: string, url: string, userId?: string | null) =>
        mediaLogger.info(`Accessed media: ${mediaId}`, { url }, userId),

    mediaDelete: (mediaId: string, path: string, userId?: string | null, isSoftDelete = false) =>
        mediaLogger.warn(`${isSoftDelete ? "Soft deleted" : "Deleted"} media: ${mediaId}`, { path, isSoftDelete }, userId),

    mediaBulkOperation: (operation: string, count: number, details?: any, userId?: string | null) =>
        mediaLogger.warn(`Bulk operation: ${operation} on ${count} items`, details, userId),
}
