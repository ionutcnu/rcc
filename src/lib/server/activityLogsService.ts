import { admin } from "@/lib/firebase/admin"
import { serverLogger } from "@/lib/utils/server-logger"
import { redis } from "@/lib/redis"
import { Timestamp } from "firebase-admin/firestore"
import type { Query, DocumentData } from "firebase-admin/firestore"
import type { LogEntry, LogFilterOptions } from "@/lib/types/log"

/**
 * Server-side activity logs service for managing cat activity logs
 */
export class ActivityLogsService {
  /**
   * Get cat activity logs with filtering and pagination
   */
  async getCatActivityLogs(options: LogFilterOptions): Promise<{
    logs: LogEntry[]
    cursor: string | null
    hasMore: boolean
  }> {
    try {
      const { pageSize = 25, cursor, startDate, endDate, actionType, search, skipCache = false } = options

      // Generate a cache key based on the query parameters
      const cacheKey = `cat_activity:${startDate || ""}:${endDate || ""}:${actionType || ""}:${cursor || ""}:${pageSize}:${search || ""}`

      // Skip cache for certain conditions
      const useCache = !skipCache && !search

      // Try to get from cache first
      if (useCache) {
        try {
          const cachedData = await redis.get(cacheKey)
          if (cachedData && typeof cachedData === "string") {
            console.log("Cache hit for cat activity logs:", { cacheKey })
            return JSON.parse(cachedData)
          }
        } catch (cacheError) {
          // Only log cache errors
          serverLogger.error("Redis cache error:", { error: cacheError })
          // Continue with database query if cache fails
        }
      }

      console.log("Fetching cat activity logs from activity collection")

      // Get base collection reference for activity logs
      const activityCollection = admin.db.collection("activity")

      // Build query for activity collection - get all activity logs
      let activityQuery = activityCollection.orderBy("timestamp", "desc").limit(pageSize * 3) // Fetch more to account for filtering

      // Apply date range filter if provided
      if (startDate && endDate) {
        try {
          const startDateObj = new Date(startDate)
          const endDateObj = new Date(endDate)

          // Validate dates
          if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
            throw new Error("Invalid date format")
          }

          // Don't allow future dates
          const now = new Date()
          if (startDateObj > now || endDateObj > now) {
            throw new Error("Dates cannot be in the future")
          }

          // Create a new query with date filters
          activityQuery = activityQuery
            .where("timestamp", ">=", Timestamp.fromDate(startDateObj))
            .where("timestamp", "<=", Timestamp.fromDate(endDateObj))
        } catch (error) {
          serverLogger.error("Error adding date filters:", { error })
          throw new Error("Invalid date parameters")
        }
      }

      // Apply cursor-based pagination if cursor is provided
      if (cursor) {
        try {
          // Get the document to use as a starting point
          const cursorDoc = await activityCollection.doc(cursor).get()

          if (cursorDoc.exists) {
            activityQuery = activityQuery.startAfter(cursorDoc)
          }
        } catch (error) {
          serverLogger.error("Error with cursor document:", { error })
          // Continue without the cursor if there's an error
        }
      }

      // Execute query
      console.log("Executing Firestore query for activity logs")
      const activitySnapshot = await activityQuery.get()
      console.log(`Activity query returned ${activitySnapshot.size} documents`)

      // Process results
      const logs: LogEntry[] = []
      let nextCursor = null

      // Process activity logs
      for (const doc of activitySnapshot.docs) {
        const data = doc.data()

        // Debug log to see what's in each document
        console.log("Activity log:", {
          id: doc.id,
          action: data.action,
          catId: data.catId,
          catName: data.catName,
          details: data.details,
        })

        // Check if this is a cat-related activity
        // Look for catId, catName, or cat-related action
        const isCatActivity =
          data.catId !== undefined ||
          data.catName !== undefined ||
          (data.action && typeof data.action === "string" && data.action.toLowerCase().includes("cat"))

        if (!isCatActivity) {
          continue // Skip non-cat activities
        }

        // Apply action type filter if provided
        if (actionType && actionType !== "all" && data.action !== actionType) {
          continue // Skip if action type doesn't match
        }

        // Apply text search filter if provided
        if (search && search.length > 0) {
          const message = `${data.action || ""} ${data.catName || ""} ${data.catId || ""}`.toLowerCase()
          const details = JSON.stringify(data.details || {}).toLowerCase()

          const searchLower = search.toLowerCase()
          if (!message.includes(searchLower) && !details.includes(searchLower)) {
            continue // Skip this log if it doesn't match the search
          }
        }

        // Format timestamp
        const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date()

        // Convert activity log to log entry format
        logs.push({
          id: doc.id,
          message: `${data.action || "Activity"} ${data.catName ? `cat "${data.catName}"` : `(ID: ${data.catId || "unknown"})`}`,
          level: data.status || "info", // Use status as level if available
          timestamp: timestamp,
          details: data.details || {},
          userId: data.userId || "",
          userEmail: data.userEmail || "",
          catId: data.catId || "",
          catName: data.catName || "",
          actionType: data.action || "", // Use action as actionType
        })

        // Stop once we have enough logs
        if (logs.length >= pageSize) {
          nextCursor = doc.id
          break
        }
      }

      console.log(`Returning ${logs.length} cat activity logs`)

      const responseData = {
        logs,
        cursor: nextCursor,
        hasMore: activitySnapshot.size > logs.length,
      }

      // Cache the results if applicable
      if (useCache) {
        try {
          await redis.set(cacheKey, JSON.stringify(responseData), {
            ex: 3600, // 1 hour cache
          })
          console.log("Cached cat activity logs data for:", { cacheKey })
        } catch (cacheError) {
          serverLogger.error("Redis cache set error:", { error: cacheError })
          // Continue even if caching fails
        }
      }

      return responseData
    } catch (error: any) {
      serverLogger.error("Error fetching cat activity logs:", { error })
      throw error
    }
  }

  /**
   * Get activity log statistics
   */
  async getActivityStats(options: {
    startDate?: string
    endDate?: string
    skipCache?: boolean
  }): Promise<{
    stats: {
      total: number
      add: number
      update: number
      delete: number
      view: number
      other: number
    }
  }> {
    try {
      const { startDate, endDate, skipCache = false } = options

      // Generate a cache key based on the query parameters
      const cacheKey = `activity_stats:${startDate || ""}:${endDate || ""}`

      // Try to get from cache first if not explicitly skipped
      if (!skipCache) {
        try {
          const cachedData = await redis.get(cacheKey)
          if (cachedData && typeof cachedData === "string") {
            console.log("Cache hit for activity stats:", { cacheKey })
            return JSON.parse(cachedData)
          }
        } catch (cacheError) {
          serverLogger.error("Redis cache error for stats:", { error: cacheError })
          // Continue with database query if cache fails
        }
      }

      // Initialize counters
      const stats = {
        total: 0,
        add: 0,
        update: 0,
        delete: 0,
        view: 0,
        other: 0,
      }

      // Get base collection reference
      const activityCollection = admin.db.collection("activity")

      // Build query based on date range
      let activityQuery: Query<DocumentData> = activityCollection

      if (startDate && endDate) {
        const startDateObj = new Date(startDate)
        const endDateObj = new Date(endDate)

        activityQuery = activityQuery
          .where("timestamp", ">=", Timestamp.fromDate(startDateObj))
          .where("timestamp", "<=", Timestamp.fromDate(endDateObj))
      }

      // Get all activity logs and filter for cat-related ones
      const snapshot = await activityQuery.limit(1000).get()

      // Count cat-related activities
      let catActivities = 0
      let addCount = 0
      let updateCount = 0
      let deleteCount = 0
      let viewCount = 0

      snapshot.forEach((doc) => {
        const data = doc.data()

        // Check if this is a cat-related activity
        const isCatActivity =
          data.catId !== undefined ||
          data.catName !== undefined ||
          (data.action && typeof data.action === "string" && data.action.toLowerCase().includes("cat"))

        if (isCatActivity) {
          catActivities++

          // Count by action type
          const action = (data.action || "").toLowerCase()
          if (action.includes("add") || action.includes("create")) {
            addCount++
          } else if (action.includes("update") || action.includes("edit")) {
            updateCount++
          } else if (action.includes("delete") || action.includes("remove")) {
            deleteCount++
          } else if (action.includes("view") || action.includes("read")) {
            viewCount++
          }
        }
      })

      stats.total = catActivities
      stats.add = addCount
      stats.update = updateCount
      stats.delete = deleteCount
      stats.view = viewCount
      stats.other = catActivities - addCount - updateCount - deleteCount - viewCount
      if (stats.other < 0) stats.other = 0

      const responseData = { stats }

      // Cache the results
      if (!skipCache) {
        try {
          await redis.set(cacheKey, JSON.stringify(responseData), {
            ex: 900, // 15 minutes
          })
          console.log("Cached activity stats data for:", { cacheKey })
        } catch (cacheError) {
          serverLogger.error("Redis cache set error for stats:", { error: cacheError })
          // Continue even if caching fails
        }
      }

      return responseData
    } catch (error: any) {
      serverLogger.error("Error fetching activity stats:", { error })
      throw error
    }
  }
}

// Create and export a singleton instance
export const activityLogsService = new ActivityLogsService()
