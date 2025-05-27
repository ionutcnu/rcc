"use client"

import { logService } from "@/lib/services/logService"

// Media logger functions - client-side wrapper around logService
export const mediaLogger = {
    async log(level: "info" | "warn" | "error" | "debug", message: string, details?: any, userId?: string | null): Promise<void> {
        return logService.log(level, message, details, userId)
    },

    info: (message: string, details?: any, userId?: string | null) => 
        logService.info(message, details, userId),

    warn: (message: string, details?: any, userId?: string | null) => 
        logService.warn(message, details, userId),

    error: (message: string, error?: any, userId?: string | null) => 
        logService.error(message, error, userId),

    debug: (message: string, details?: any, userId?: string | null) => {
        if (process.env.DEBUG) {
            logService.debug(message, details, userId)
        }
    },

    // Media specific operations - use logService directly
    mediaAccess: (mediaId: string, url: string, userId?: string | null) =>
        logService.mediaAccess(mediaId, url, userId),

    mediaDelete: (mediaId: string, path: string, userId?: string | null, isSoftDelete = false) =>
        logService.mediaDelete(mediaId, path, userId, null, isSoftDelete),

    mediaBulkOperation: (operation: string, count: number, details?: any, userId?: string | null) =>
        logService.mediaBulkOperation(operation, count, details, userId),
}
