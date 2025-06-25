import { admin } from "@/lib/firebase/admin"
import { serverLogger } from "@/lib/utils/server-logger"
import { redis } from "@/lib/redis"
import { v4 as uuidv4 } from "uuid"
import { FieldValue, Timestamp } from "firebase-admin/firestore"
import type { Query, DocumentData } from "firebase-admin/firestore"
import type { LogEntry, LogLevel, LogFilterOptions } from "@/lib/types/log"

/**
 * Server-side logs service for managing application logs
 */
export class LogsService {
  /**
   * Get logs with filtering and pagination
   */
  async getLogs(options: LogFilterOptions): Promise<{
    logs: LogEntry[]
    cursor: string | null
    hasMore: boolean
  }> {
    try {
      // Force filter to be "cat-activity" if the tab is "catActivity"
      if (options.tab === "catActivity") {
        options.filter = "cat-activity"
        serverLogger.infoOperational("Setting filter to cat-activity based on tab parameter")
      }

      const {
        pageSize = 25,
        cursor,
        filter = "all",
        startDate,
        endDate,
        actionType,
        search,
        skipCache = false,
        tab,
      } = options

      serverLogger.debug(`getLogs called with filter: ${filter}, tab: ${tab}`)

      // Generate a cache key based on the query parameters
      const cacheKey = `logs:${filter}:${startDate || ""}:${endDate || ""}:${actionType || ""}:${cursor || ""}:${pageSize}:${search || ""}`

      // Skip cache for certain conditions
      const useCache = !skipCache && !search

      // Try to get from cache first
      if (useCache) {
        try {
          const cachedData = await redis.get(cacheKey)
          if (cachedData && typeof cachedData === "string") {
            // Reduced logging - only log cache hits in development
            if (process.env.NODE_ENV !== "production") {
              console.log("Cache hit for logs:", { cacheKey })
            }
            return JSON.parse(cachedData)
          }
        } catch (cacheError) {
          // Only log cache errors
          serverLogger.error("Redis cache error:", { error: cacheError })
          // Continue with database query if cache fails
        }
      }

      // Process results
      const logs: LogEntry[] = []
      let nextCursor = null

      // For cat-activity filter or catActivity tab, we need to check the activity collection
      if (filter === "cat-activity" || tab === "catActivity") {
        serverLogger.infoOperational("Fetching logs from activity collection")

        // Get base collection reference for activity logs
        const activityCollection = admin.db.collection("activity")

        // Build query for activity collection
        let activityQuery = activityCollection.orderBy("timestamp", "desc").limit(pageSize)

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
        if (cursor && cursor.startsWith("activity:")) {
          try {
            // Extract the actual document ID from the cursor
            const docId = cursor.replace("activity:", "")

            // Get the document to use as a starting point
            const cursorDoc = await activityCollection.doc(docId).get()

            if (cursorDoc.exists) {
              activityQuery = activityQuery.startAfter(cursorDoc)
            }
          } catch (error) {
            serverLogger.error("Error with cursor document:", { error })
            // Continue without the cursor if there's an error
          }
        }

        // Execute query
        serverLogger.infoOperational("Executing Firestore query for activity logs")
        const activitySnapshot = await activityQuery.get()
        serverLogger.infoOperational(`Activity query returned ${activitySnapshot.size} documents`)

        // Process activity logs
        for (const doc of activitySnapshot.docs) {
          const data = doc.data()

          // Debug log to see what's in each document
          serverLogger.debug("Activity log:", {
            id: doc.id,
            action: data.action,
            target: data.target,
            targetId: data.targetId,
            details: data.details,
          })

          // Apply action type filter if provided
          if (actionType && actionType !== "all" && data.action !== actionType) {
            continue // Skip if action type doesn't match
          }

          // Apply text search filter if provided
          if (search && search.length > 0) {
            const message = `${data.action || ""} ${data.target || ""} ${data.targetId || ""}`.toLowerCase()
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
            id: `activity:${doc.id}`, // Prefix with 'activity:' to distinguish from regular logs
            message: `${data.action || ""} ${data.target || ""} ${data.targetId || ""}`,
            level: "info", // Activity logs are always info level
            timestamp: timestamp,
            details: data.details || {},
            userId: data.userId || "",
            userEmail: data.userEmail || "",
            catId: data.targetId || "", // For cat activities, targetId is the catId
            catName: data.details?.name || "",
            actionType: data.action || "", // Use action as actionType
          })

          // Update the cursor for pagination
          nextCursor = `activity:${doc.id}`
        }
      } else {
        // For non-cat-activity filters, use the regular logs collection

        // Get base collection reference
        const logsCollection = admin.db.collection("logs")

        // Build query based on filter type
        let logsQuery: Query<DocumentData>

        if (filter !== "all") {
          // For regular level filters
          logsQuery = logsCollection.where("level", "==", filter).orderBy("timestamp", "desc").limit(pageSize)
        } else {
          // Default query for "all" filter
          logsQuery = logsCollection.orderBy("timestamp", "desc").limit(pageSize)
        }

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
            logsQuery = logsQuery
              .where("timestamp", ">=", Timestamp.fromDate(startDateObj))
              .where("timestamp", "<=", Timestamp.fromDate(endDateObj))
          } catch (error) {
            serverLogger.error("Error adding date filters:", { error })
            throw new Error("Invalid date parameters")
          }
        }

        // Apply cursor-based pagination if cursor is provided
        if (cursor && !cursor.startsWith("activity:")) {
          try {
            // Get the document to use as a starting point
            const cursorDoc = await logsCollection.doc(cursor).get()

            if (cursorDoc.exists) {
              logsQuery = logsQuery.startAfter(cursorDoc)
            }
          } catch (error) {
            serverLogger.error("Error with cursor document:", { error })
            // Continue without the cursor if there's an error
          }
        }

        // Execute query - reduced logging
        serverLogger.debug("Executing Firestore query for logs:", filter)
        const snapshot = await logsQuery.get()
        serverLogger.infoOperational(`Query returned ${snapshot.size} documents`)

        // Process all documents
        for (const doc of snapshot.docs) {
          const data = doc.data()

          // Apply action type filter if provided
          if (actionType && actionType !== "all") {
            const docActionType = data.actionType || data.details?.actionType
            if (docActionType !== actionType) {
              continue // Skip if action type doesn't match
            }
          }

          // Apply text search filter if provided
          if (search && search.length > 0) {
            const message = (data.message || "").toLowerCase()
            const details = JSON.stringify(data.details || {}).toLowerCase()
            const catName = (data.catName || data.details?.catName || "").toLowerCase()

            const searchLower = search.toLowerCase()
            if (!message.includes(searchLower) && !details.includes(searchLower) && !catName.includes(searchLower)) {
              continue // Skip this log if it doesn't match the search
            }
          }

          // Format timestamp
          const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date()

          logs.push({
            id: doc.id,
            message: data.message || "",
            level: data.level || "info",
            timestamp: timestamp,
            details: data.details || {},
            userId: data.userId || data.details?.userId || "",
            userEmail: data.userEmail || data.details?.userEmail || "",
            catId: data.catId || data.details?.catId || "",
            catName: data.catName || data.details?.catName || "",
            actionType: data.actionType || data.details?.actionType || "",
          })

          // Update the cursor for pagination
          nextCursor = doc.id
        }
      }

      serverLogger.infoOperational(`Returning ${logs.length} filtered logs for filter: ${filter}`)

      const responseData = {
        logs,
        cursor: nextCursor,
        hasMore: logs.length === pageSize,
      }

      // Cache the results if applicable
      if (useCache) {
        try {
          await redis.set(cacheKey, JSON.stringify(responseData), {
            ex: 3600, // 1 hour cache
          })
          // Reduced logging - only log cache operations in development
          if (process.env.NODE_ENV !== "production") {
            console.log("Cached logs data for:", { cacheKey })
          }
        } catch (cacheError) {
          serverLogger.error("Redis cache set error:", { error: cacheError })
          // Continue even if caching fails
        }
      }

      return responseData
    } catch (error: any) {
      serverLogger.error("Error fetching logs:", { error })
      throw error
    }
  }

  /**
   * Get archived logs with filtering and pagination
   */
  async getArchivedLogs(options: LogFilterOptions): Promise<{
    logs: LogEntry[]
    cursor: string | null
    hasMore: boolean
  }> {
    try {
      const {
        pageSize = 25,
        cursor,
        filter = "all",
        startDate,
        endDate,
        actionType,
        search,
        skipCache = false,
      } = options

      // Generate a cache key based on the query parameters
      const cacheKey = `archived_logs:${filter}:${startDate || ""}:${endDate || ""}:${actionType || ""}:${cursor || ""}:${pageSize}`

      // Skip cache for search queries or if explicitly requested
      const useCache = !search && !skipCache

      // Try to get from cache first
      if (useCache) {
        try {
          const cachedData = await redis.get(cacheKey)
          if (cachedData && typeof cachedData === "string") {
            serverLogger.debug("Cache hit for archived logs:", { cacheKey })
            return JSON.parse(cachedData)
          }
        } catch (cacheError) {
          serverLogger.error("Redis cache error:", { error: cacheError })
          // Continue with database query if cache fails
        }
      }

      // Parse dates if provided
      const startDateObj = startDate ? new Date(startDate) : null
      const endDateObj = endDate ? new Date(endDate) : null

      // Build query
      let query: Query<DocumentData> = admin.db.collection("logs_archived")

      // Apply date filters
      if (startDateObj) {
        query = query.where("timestamp", ">=", Timestamp.fromDate(startDateObj))
      }
      if (endDateObj) {
        query = query.where("timestamp", "<=", Timestamp.fromDate(endDateObj))
      }

      // Apply level/type filters
      if (filter === "info") {
        query = query.where("level", "==", "info")
        // Explicitly exclude logs with actionType
        query = query.where("actionType", "==", null)
      } else if (filter === "warn") {
        query = query.where("level", "==", "warn")
        // Explicitly exclude logs with actionType
        query = query.where("actionType", "==", null)
      } else if (filter === "error") {
        query = query.where("level", "==", "error")
        // Explicitly exclude logs with actionType
        query = query.where("actionType", "==", null)
      } else if (filter === "cat-activity") {
        query = query.where("actionType", "!=", null)
      }

      // Apply action type filter if specified
      if (actionType) {
        query = query.where("actionType", "==", actionType)
      }

      // Order by timestamp descending
      query = query.orderBy("timestamp", "desc")

      // Apply cursor if provided
      if (cursor) {
        const cursorDoc = await admin.db.collection("logs_archived").doc(cursor).get()
        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc)
        }
      }

      // Limit results
      query = query.limit(pageSize + 1) // Get one extra to check if there are more

      // Execute query
      const snapshot = await query.get()

      // Process results
      const logs: LogEntry[] = []
      let lastDoc = null
      let hasMore = false

      if (snapshot.size > pageSize) {
        // We have more results
        hasMore = true
        snapshot.docs.pop() // Remove the extra document
      }

      if (snapshot.size > 0) {
        lastDoc = snapshot.docs[snapshot.docs.length - 1]
      }

      // Process logs and filter by search term if provided
      for (const doc of snapshot.docs) {
        const logData = doc.data()
        const log: LogEntry = {
          id: doc.id,
          message: logData.message || "",
          level: logData.level || "info",
          timestamp: logData.timestamp?.toDate() || new Date(),
          details: logData.details,
          userId: logData.userId,
          userEmail: logData.userEmail,
          catId: logData.catId,
          catName: logData.catName,
          actionType: logData.actionType,
          archivedAt: logData.archivedAt?.toDate(),
        }

        // Apply search filter if provided
        if (search) {
          const searchLower = search.toLowerCase()
          const messageMatch =
            log.message && typeof log.message === "string" && log.message.toLowerCase().includes(searchLower)
          const detailsMatch = log.details && JSON.stringify(log.details).toLowerCase().includes(searchLower)
          const userMatch =
            (log.userEmail && typeof log.userEmail === "string" && log.userEmail.toLowerCase().includes(searchLower)) ||
            (log.details?.userEmail &&
              typeof log.details.userEmail === "string" &&
              log.details.userEmail.toLowerCase().includes(searchLower))

          if (!(messageMatch || detailsMatch || userMatch)) {
            continue // Skip this log if it doesn't match search
          }
        }

        logs.push(log)
      }

      // Prepare response data
      const responseData = {
        logs,
        cursor: lastDoc ? lastDoc.id : null,
        hasMore,
      }

      // Cache the results if not a search query
      if (useCache) {
        try {
          await redis.set(cacheKey, JSON.stringify(responseData), {
            ex: 3600, // 1 hour cache
          })
          serverLogger.debug("Cached archived logs data for:", { cacheKey })
        } catch (cacheError) {
          serverLogger.error("Redis cache set error:", { error: cacheError })
          // Continue even if caching fails
        }
      }

      return responseData
    } catch (error: any) {
      serverLogger.error("Error fetching archived logs:", { error })
      throw error
    }
  }

  /**
   * Get log statistics
   */
  async getLogStats(options: {
    startDate?: string
    endDate?: string
    filter?: string
    skipCache?: boolean
  }): Promise<{
    stats: {
      total: number
      info: number
      warn: number
      error: number
      catActivity: number
      other: number
    }
  }> {
    try {
      const { startDate, endDate, filter = "all", skipCache = false } = options

      // Generate a cache key based on the query parameters
      const cacheKey = `logs_stats:${filter}:${startDate || ""}:${endDate || ""}`

      // Try to get from cache first if not explicitly skipped
      if (!skipCache) {
        try {
          const cachedData = await redis.get(cacheKey)
          if (cachedData && typeof cachedData === "string") {
            serverLogger.debug("Cache hit for stats:", { cacheKey })
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
        info: 0,
        warn: 0,
        error: 0,
        catActivity: 0,
        other: 0,
      }

      // Get base collection reference
      const logsCollection = admin.db.collection("logs")
      const activityCollection = admin.db.collection("activity")

      // Build query based on date range
      let logsQuery: Query<DocumentData> = logsCollection
      let activityQuery: Query<DocumentData> = activityCollection

      if (startDate && endDate) {
        const startDateObj = new Date(startDate)
        const endDateObj = new Date(endDate)

        logsQuery = logsQuery
          .where("timestamp", ">=", Timestamp.fromDate(startDateObj))
          .where("timestamp", "<=", Timestamp.fromDate(endDateObj))

        activityQuery = activityQuery
          .where("timestamp", ">=", Timestamp.fromDate(startDateObj))
          .where("timestamp", "<=", Timestamp.fromDate(endDateObj))
      }

      // Get total count for logs
      try {
        // Use AggregateQuery for efficient counting
        const totalSnapshot = await logsQuery.count().get()
        stats.total = totalSnapshot.data().count
      } catch (error) {
        serverLogger.error("Error getting total count:", { error })
        // Fallback to a less efficient method if count() is not available
        const totalSnapshot = await logsQuery.limit(1000).get()
        stats.total = totalSnapshot.size
      }

      // Get activity count from activity collection
      try {
        // Count all activities
        const activitySnapshot = await activityQuery.count().get()
        stats.catActivity = activitySnapshot.data().count

        // Add to total
        stats.total += stats.catActivity
      } catch (error) {
        serverLogger.error("Error getting activity count:", { error })
        // If it fails, we'll have to estimate
        stats.catActivity = Math.round(stats.total * 0.1) // Estimate 10% are activities
      }

      // If filter is specified, we only need to get the count for that filter
      if (filter !== "all") {
        if (filter === "cat-activity") {
          // We already have the activity count
          // No need to do anything else
        } else {
          // For regular level filters
          try {
            const levelQuery = logsQuery.where("level", "==", filter)
            const levelSnapshot = await levelQuery.count().get()
            stats[filter as keyof typeof stats] = levelSnapshot.data().count
          } catch (error) {
            serverLogger.error(`Error getting ${filter} count:`, { error })
            // If it fails, we'll have to estimate
            stats[filter as keyof typeof stats] = Math.round(stats.total * 0.2) // Estimate 20% are this level
          }
        }
      } else {
        // If no filter is specified, get counts for all types
        // This is more efficient than making separate queries for each type

        // Get info count
        try {
          const infoQuery = logsQuery.where("level", "==", "info")
          const infoSnapshot = await infoQuery.count().get()
          stats.info = infoSnapshot.data().count
        } catch (error) {
          serverLogger.error("Error getting info count:", { error })
          stats.info = Math.round(stats.total * 0.6) // Estimate 60% are info
        }

        // Get warn count
        try {
          const warnQuery = logsQuery.where("level", "==", "warn")
          const warnSnapshot = await warnQuery.count().get()
          stats.warn = warnSnapshot.data().count
        } catch (error) {
          serverLogger.error("Error getting warn count:", { error })
          stats.warn = Math.round(stats.total * 0.2) // Estimate 20% are warn
        }

        // Get error count
        try {
          const errorQuery = logsQuery.where("level", "==", "error")
          const errorSnapshot = await errorQuery.count().get()
          stats.error = errorSnapshot.data().count
        } catch (error) {
          serverLogger.error("Error getting error count:", { error })
          stats.error = Math.round(stats.total * 0.1) // Estimate 10% are error
        }

        // Calculate other
        stats.other = stats.total - stats.info - stats.warn - stats.error - stats.catActivity
        if (stats.other < 0) stats.other = 0 // Ensure we don't have negative counts
      }

      const responseData = { stats }

      // Cache the results
      if (!skipCache) {
        try {
          await redis.set(cacheKey, JSON.stringify(responseData), {
            ex: 900, // 15 minutes
          })
          serverLogger.debug("Cached stats data for:", { cacheKey })
        } catch (cacheError) {
          serverLogger.error("Redis cache set error for stats:", { error: cacheError })
          // Continue even if caching fails
        }
      }

      return responseData
    } catch (error: any) {
      serverLogger.error("Error fetching log stats:", { error })
      throw error
    }
  }

  /**
   * Archive logs older than the specified date
   */
  async archiveLogs(targetDate: Date): Promise<{
    success: boolean
    message: string
    operationId: string
  }> {
    try {
      // Generate a unique operation ID
      const operationId = uuidv4()
      serverLogger.info(`Starting archive operation ${operationId} with date: ${targetDate.toISOString()}`)

      // Start the archiving process in the background
      this.processArchiveLogs(targetDate, operationId).catch((error) => {
        serverLogger.error("Error in background archiving process:", { error })
        this.updateArchiveProgress(operationId, {
          inProgress: false,
          error: true,
          message: error.message,
          completed: true,
        })
      })

      // Return immediately with the operation ID
      return {
        success: true,
        message: "Archiving process started",
        operationId,
      }
    } catch (error: any) {
      serverLogger.error("Error archiving logs:", { error })
      throw error
    }
  }

  /**
   * Process archiving logs in the background
   * @private
   */
  private async processArchiveLogs(targetDate: Date, operationId: string): Promise<void> {
    try {
      const logsRef = admin.db.collection("logs")
      const activityRef = admin.db.collection("activity")

      // Debug: Check total logs in both collections
      const totalLogsCountSnapshot = await logsRef.count().get()
      const totalLogsInCollection = totalLogsCountSnapshot.data().count
      
      const totalActivityCountSnapshot = await activityRef.count().get()
      const totalActivityInCollection = totalActivityCountSnapshot.data().count
      
      serverLogger.infoOperational(`Total logs in logs collection: ${totalLogsInCollection}`)
      serverLogger.infoOperational(`Total logs in activity collection: ${totalActivityInCollection}`)

      // Convert to Firestore Timestamp for proper comparison
      const targetTimestamp = Timestamp.fromDate(targetDate)
      serverLogger.infoOperational(`Archive target: ${targetDate.toISOString()} (Timestamp: ${targetTimestamp.toDate().toISOString()})`)

      // Count logs to be archived from both collections
      const logsCountSnapshot = await logsRef.where("timestamp", "<", targetTimestamp).count().get()
      const logsToArchive = logsCountSnapshot.data().count

      const activityCountSnapshot = await activityRef
        .where("timestamp", "<", targetTimestamp)
        .where("action", "!=", "view") // Exclude view logs from count
        .count()
        .get()
      const activityToArchive = activityCountSnapshot.data().count

      const totalLogs = logsToArchive + activityToArchive
      
      serverLogger.infoOperational(`Found ${logsToArchive} system logs to archive`)
      serverLogger.infoOperational(`Found ${activityToArchive} activity logs to archive (excluding view logs)`)
      serverLogger.infoOperational(`Total logs to archive: ${totalLogs}`)

      if (totalLogs === 0) {
        await this.updateArchiveProgress(operationId, {
          inProgress: false,
          total: 0,
          processed: 0,
          percentage: 100,
          completed: true,
          message: "No logs found to archive",
        })
        return
      }

      // Initialize progress
      await this.updateArchiveProgress(operationId, {
        inProgress: true,
        total: totalLogs,
        processed: 0,
        percentage: 0,
      })

      let processed = 0
      const batchSize = 250 // Reduced batch size to handle two collections

      // First, process system logs
      serverLogger.infoOperational("Starting to archive system logs...")
      let systemLogsProcessed = 0
      while (systemLogsProcessed < logsToArchive) {
        const snapshot = await logsRef.where("timestamp", "<", targetTimestamp).limit(batchSize).get()

        if (snapshot.empty) {
          break
        }

        const batch = admin.db.batch()

        snapshot.docs.forEach((doc) => {
          const logData = doc.data()
          const archivedRef = admin.db.collection("logs_archived").doc(doc.id)
          batch.set(archivedRef, {
            ...logData,
            archivedAt: FieldValue.serverTimestamp(),
            sourceCollection: "logs", // Track original collection
          })
          batch.delete(doc.ref)
        })

        await batch.commit()
        systemLogsProcessed += snapshot.size
        processed += snapshot.size

        const percentage = Math.round((processed / totalLogs) * 100)
        serverLogger.infoOperational(`Archived ${snapshot.size} system logs. Progress: ${processed}/${totalLogs} (${percentage}%)`)

        await this.updateArchiveProgress(operationId, {
          inProgress: true,
          total: totalLogs,
          processed,
          percentage,
        })
      }

      // Second, process activity logs (excluding view logs to preserve analytics)
      serverLogger.infoOperational("Starting to archive activity logs (excluding view logs)...")
      let activityLogsProcessed = 0
      while (activityLogsProcessed < activityToArchive) {
        const snapshot = await activityRef
          .where("timestamp", "<", targetTimestamp)
          .where("action", "!=", "view") // Exclude view logs from archiving
          .limit(batchSize)
          .get()

        if (snapshot.empty) {
          break
        }

        const batch = admin.db.batch()

        snapshot.docs.forEach((doc) => {
          const logData = doc.data()
          const archivedRef = admin.db.collection("logs_archived").doc(doc.id)
          batch.set(archivedRef, {
            ...logData,
            archivedAt: FieldValue.serverTimestamp(),
            sourceCollection: "activity", // Track original collection
          })
          batch.delete(doc.ref)
        })

        await batch.commit()
        activityLogsProcessed += snapshot.size
        processed += snapshot.size

        const percentage = Math.round((processed / totalLogs) * 100)
        serverLogger.infoOperational(`Archived ${snapshot.size} activity logs. Progress: ${processed}/${totalLogs} (${percentage}%)`)

        await this.updateArchiveProgress(operationId, {
          inProgress: true,
          total: totalLogs,
          processed,
          percentage,
        })
      }

      // Mark operation as complete
      await this.updateArchiveProgress(operationId, {
        inProgress: false,
        total: totalLogs,
        processed,
        percentage: 100,
        completed: true,
        message: `Successfully archived ${processed} logs`,
      })

      serverLogger.infoOperational(`Archive operation completed. System logs: ${systemLogsProcessed}, Activity logs: ${activityLogsProcessed}, Total: ${processed}`)
    } catch (error) {
      serverLogger.error("Error in archiving process:", { error })
      throw error
    }
  }

  /**
   * Update archive progress in Redis
   * @private
   */
  private async updateArchiveProgress(operationId: string, data: any): Promise<void> {
    const progressKey = `archive_progress:${operationId}`
    await redis.set(progressKey, JSON.stringify(data), { ex: 3600 }) // Expire after 1 hour
    serverLogger.debug(`Updated progress for ${operationId}:`, data)
  }

  /**
   * Get archive progress
   */
  async getArchiveProgress(operationId: string): Promise<any> {
    try {
      // Get progress data from Redis
      const progressKey = `archive_progress:${operationId}`
      const progressData = await redis.get(progressKey)

      if (!progressData) {
        return {
          inProgress: false,
          error: "No progress data found for this operation",
        }
      }

      // Parse progress data
      try {
        // Check if progressData is a string before parsing
        const progress = typeof progressData === "string" ? JSON.parse(progressData) : progressData
        return progress
      } catch (error) {
        serverLogger.error("Error parsing progress data:", { error })
        return {
          inProgress: false,
          error: "Invalid progress data",
        }
      }
    } catch (error: any) {
      serverLogger.error("Error checking archive progress:", { error })
      throw error
    }
  }

  /**
   * Get archive final result
   */
  async getArchiveFinalResult(operationId: string): Promise<any> {
    try {
      // Get progress data from Redis
      const progressKey = `archive_progress:${operationId}`
      const progressData = await redis.get(progressKey)

      serverLogger.debug(`Final result data for ${operationId}:`, progressData)

      if (!progressData) {
        throw new Error("No progress data found for this operation")
      }

      // Parse progress data
      try {
        // Check if progressData is a string before parsing
        const progress = typeof progressData === "string" ? JSON.parse(progressData) : progressData
        return progress
      } catch (error) {
        serverLogger.error(`Error parsing progress data: ${error}`)
        throw new Error("Invalid progress data")
      }
    } catch (error: any) {
      serverLogger.error(`Error checking archive final result: ${error}`)
      throw error
    }
  }

  /**
   * Delete archived logs
   */
  async deleteArchivedLogs(options: {
    beforeDate?: string
    deleteAll?: boolean
  }): Promise<{
    success: boolean
    message: string
    operationId: string
  }> {
    try {
      const { beforeDate, deleteAll = false } = options

      if (!beforeDate && !deleteAll) {
        throw new Error("Missing beforeDate parameter or deleteAll flag")
      }

      // Generate a unique operation ID
      const operationId = uuidv4()
      serverLogger.infoOperational(`Starting delete operation ${operationId} with params:`, { beforeDate, deleteAll })

      // Start the deletion process in the background
      this.processDeleteArchivedLogs(beforeDate, deleteAll, operationId).catch((error) => {
        serverLogger.error("Error in background deletion process:", { error })
        this.updateDeleteProgress(operationId, {
          inProgress: false,
          error: error.message,
          completed: true,
        })
      })

      // Return immediately with the operation ID
      return {
        success: true,
        message: "Deletion process started",
        operationId,
      }
    } catch (error: any) {
      serverLogger.error("Error deleting archived logs:", { error })
      throw error
    }
  }

  /**
   * Process deleting archived logs in the background
   * @private
   */
  private async processDeleteArchivedLogs(
    beforeDate: string | null | undefined,
    deleteAll: boolean,
    operationId: string,
  ): Promise<void> {
    try {
      const logsRef = admin.db.collection("logs_archived")

      // Build the query based on parameters
      let query: Query<DocumentData>

      if (deleteAll) {
        query = logsRef
        serverLogger.infoOperational("Query: Delete ALL archived logs")
      } else if (beforeDate) {
        const date = new Date(beforeDate)
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date format")
        }
        query = logsRef.where("timestamp", "<", date)
        serverLogger.infoOperational(`Query: Delete logs older than ${date.toISOString()}`)
      } else {
        throw new Error("Either beforeDate or deleteAll must be provided")
      }

      // Count total logs to delete
      const countSnapshot = await query.count().get()
      const totalLogs = countSnapshot.data().count
      serverLogger.infoOperational(`Found ${totalLogs} logs to delete`)

      if (totalLogs === 0) {
        await this.updateDeleteProgress(operationId, {
          inProgress: false,
          total: 0,
          processed: 0,
          percentage: 100,
          completed: true,
          message: "No logs found to delete",
        })
        return
      }

      // Initialize progress
      await this.updateDeleteProgress(operationId, {
        inProgress: true,
        total: totalLogs,
        processed: 0,
        percentage: 0,
      })

      let processed = 0
      const batchSize = 500 // Firestore batch limit

      // Process logs in batches
      while (processed < totalLogs) {
        // Get a batch of logs to delete
        const batchQuery = query.limit(batchSize)
        const snapshot = await batchQuery.get()

        if (snapshot.empty) {
          break
        }

        // Create a batch operation
        const batch = admin.db.batch()

        // Add delete operations to batch
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref)
        })

        // Commit the batch
        await batch.commit()

        // Update progress
        processed += snapshot.size
        const percentage = Math.round((processed / totalLogs) * 100)
        serverLogger.infoOperational(
          `Deleted batch of ${snapshot.size} logs. Progress: ${processed}/${totalLogs} (${percentage}%)`,
        )

        await this.updateDeleteProgress(operationId, {
          inProgress: true,
          total: totalLogs,
          processed,
          percentage,
        })
      }

      // Clear all cache entries for archived logs
      try {
        const keys = await redis.keys("archived_logs:*")
        if (keys.length > 0) {
          await redis.del(...keys)
          serverLogger.infoOperational(`Cleared ${keys.length} cache entries after log deletion`)
        }
      } catch (cacheError) {
        serverLogger.error("Error clearing cache:", { error: cacheError })
        // Continue even if cache clearing fails
      }

      // Mark operation as complete
      await this.updateDeleteProgress(operationId, {
        inProgress: false,
        total: totalLogs,
        processed,
        percentage: 100,
        completed: true,
        message: `Successfully deleted ${processed} archived logs`,
      })

      serverLogger.infoOperational(`Delete operation ${operationId} completed. Deleted ${processed} logs.`)
    } catch (error: any) {
      serverLogger.error("Error in background deletion process:", { error })
      throw error
    }
  }

  /**
   * Update delete progress in Redis
   * @private
   */
  private async updateDeleteProgress(operationId: string, data: any): Promise<void> {
    const progressKey = `delete_progress:${operationId}`
    await redis.set(progressKey, JSON.stringify(data), { ex: 3600 }) // Expire after 1 hour
    serverLogger.debug(`Updated delete progress for ${operationId}:`, data)
  }

  /**
   * Get delete progress
   */
  async getDeleteProgress(operationId: string): Promise<any> {
    try {
      // Get progress data from Redis
      const progressKey = `delete_progress:${operationId}`
      const progressData = await redis.get(progressKey)

      if (!progressData) {
        return {
          inProgress: false,
          error: "No progress data found for this operation",
        }
      }

      // Parse progress data
      try {
        // Check if progressData is a string before parsing
        const progress = typeof progressData === "string" ? JSON.parse(progressData) : progressData
        return progress
      } catch (error) {
        serverLogger.error(`Error parsing progress data: ${error}`, progressData)
        return {
          inProgress: false,
          error: "Invalid progress data",
        }
      }
    } catch (error: any) {
      serverLogger.error(`Error checking delete progress: ${error}`)
      throw error
    }
  }

  /**
   * Get delete final result
   */
  async getDeleteFinalResult(operationId: string): Promise<any> {
    try {
      // Get progress data from Redis
      const progressKey = `delete_progress:${operationId}`
      const progressData = await redis.get(progressKey)

      serverLogger.debug(`Final result data for ${operationId}:`, progressData)

      if (!progressData) {
        throw new Error("No progress data found for this operation")
      }

      // Parse progress data
      try {
        // Check if progressData is a string before parsing
        const progress = typeof progressData === "string" ? JSON.parse(progressData) : progressData
        return progress
      } catch (error) {
        serverLogger.error(`Error parsing progress data: ${error}`)
        throw new Error("Invalid progress data")
      }
    } catch (error: any) {
      serverLogger.error(`Error checking delete final result: ${error}`)
      throw error
    }
  }

  /**
   * Fix log levels for logs without a level
   */
  async fixLogLevels(): Promise<{
    success: boolean
    updated: number
    message: string
  }> {
    try {
      // Get logs without a level
      const snapshot = await admin.db.collection("logs").where("level", "==", null).limit(500).get()

      if (snapshot.empty) {
        return { success: true, updated: 0, message: "No logs need fixing" }
      }

      // Batch updates for better performance
      const batch = admin.db.batch()
      let updatedCount = 0

      snapshot.docs.forEach((doc) => {
        const data = doc.data()

        // Determine the appropriate level
        let level: LogLevel = "info" // Default level

        // Check message content for error indicators
        const message = (data.message || "").toLowerCase()
        if (message.includes("error") || message.includes("fail") || message.includes("exception")) {
          level = "error"
        } else if (message.includes("warn") || message.includes("caution") || message.includes("attention")) {
          level = "warn"
        }

        // Check if this is a cat activity log
        if (data.details?.actionType || data.actionType) {
          // Don't change level for cat activity logs
          // Just ensure they have a level set
          if (!data.level) {
            batch.update(doc.ref, { level: "info" })
            updatedCount++
          }
        } else {
          // Update the level
          batch.update(doc.ref, { level })
          updatedCount++
        }
      })

      // Commit the batch
      await batch.commit()

      return {
        success: true,
        updated: updatedCount,
        message: `Fixed ${updatedCount} log entries`,
      }
    } catch (error: any) {
      serverLogger.error("Error fixing log levels:", { error })
      throw error
    }
  }

  /**
   * Export logs as CSV
   */
  async exportLogs(options: {
    startDate?: string
    endDate?: string
    filter?: string
    actionType?: string
    search?: string
  }): Promise<string> {
    try {
      const { startDate, endDate, filter = "all", actionType, search } = options

      // Build query based on filters
      let logsRef = admin.db.collection("logs").orderBy("timestamp", "desc")

      // Apply date range filter if provided
      if (startDate && endDate) {
        const startDateObj = new Date(startDate)
        const endDateObj = new Date(endDate)

        logsRef = logsRef
          .where("timestamp", ">=", Timestamp.fromDate(startDateObj))
          .where("timestamp", "<=", Timestamp.fromDate(endDateObj))
      }

      // Apply level filter if not "all"
      if (filter === "cat-activity") {
        logsRef = logsRef.where("details.actionType", "!=", null)
      } else if (filter !== "all") {
        logsRef = logsRef.where("level", "==", filter)
      }

      // Get logs
      const snapshot = await logsRef.limit(10000).get() // Limit to prevent huge exports

      // Convert to array of log entries
      const logs = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString(),
          level: data.level || "info",
          message: data.message || "No message",
          details: data.details || {},
          userId: data.userId || data.details?.userId || "",
          userEmail: data.userEmail || data.details?.userEmail || "",
          catId: data.catId || data.details?.catId || "",
          catName: data.catName || data.details?.catName || "",
          actionType: data.actionType || data.details?.actionType || "",
        }
      })

      // Apply client-side filters that can't be done in Firestore
      let filteredLogs = logs

      // Filter by action type if provided
      if (actionType && actionType !== "all") {
        filteredLogs = filteredLogs.filter((log) => log.actionType === actionType)
      }

      // Apply search filter if provided
      if (search) {
        const searchLower = search.toLowerCase()
        filteredLogs = filteredLogs.filter(
          (log) =>
            log.message.toLowerCase().includes(searchLower) ||
            (log.details && JSON.stringify(log.details).toLowerCase().includes(searchLower)) ||
            (log.catName && log.catName.toLowerCase().includes(searchLower)),
        )
      }

      // Convert to CSV
      const header = [
        "Timestamp",
        "Level",
        "Message",
        "User ID",
        "User Email",
        "Cat ID",
        "Cat Name",
        "Action Type",
        "Details",
      ]

      const rows = filteredLogs.map((log) => [
        log.timestamp,
        log.level,
        this.escapeCsvField(log.message),
        log.userId,
        log.userEmail,
        log.catId,
        this.escapeCsvField(log.catName),
        log.actionType,
        this.escapeCsvField(JSON.stringify(log.details)),
      ])

      const csv = [header, ...rows].map((row) => row.join(",")).join("\n")
      return csv
    } catch (error: any) {
      serverLogger.error("Error exporting logs:", { error })
      throw error
    }
  }

  /**
   * Helper function to escape CSV fields
   * @private
   */
  private escapeCsvField(field: string): string {
    if (!field) return ""

    // If the field contains commas, quotes, or newlines, wrap it in quotes
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      // Double up any quotes
      return `"${field.replace(/"/g, '""')}"`
    }

    return field
  }
}

// Create and export a singleton instance
export const logsService = new LogsService()
