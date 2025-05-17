import { type NextRequest, NextResponse } from "next/server"
import { admin } from "@/lib/firebase/admin"
import { adminCheck } from "@/lib/auth/admin-check"
import { serverLogger } from "@/lib/utils/server-logger"
import { redis } from "@/lib/redis"
import type { FirebaseFirestore } from "@firebase/firestore-types"
import type { LogEntry } from "@/lib/types"

// Cache TTL in seconds (1 hour)
const CACHE_TTL = 3600

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "25")
    const cursor = searchParams.get("cursor")
    const filter = searchParams.get("filter") || "all"
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const actionType = searchParams.get("actionType")
    const search = searchParams.get("search")
    const skipCache = searchParams.get("skipCache") === "true"

    // Generate a cache key based on the query parameters
    const cacheKey = `archived_logs:${filter}:${startDateParam || ""}:${endDateParam || ""}:${actionType || ""}:${cursor || ""}:${pageSize}`

    // Skip cache for search queries or if explicitly requested
    const useCache = !search && !skipCache

    // Try to get from cache first
    if (useCache) {
      try {
        const cachedData = await redis.get(cacheKey)
        if (cachedData && typeof cachedData === "string") {
          console.log("Cache hit for:", cacheKey)
          return NextResponse.json(JSON.parse(cachedData))
        }
      } catch (cacheError) {
        console.error("Redis cache error:", cacheError)
        // Continue with database query if cache fails
      }
    }

    // Parse dates if provided
    const startDate = startDateParam ? new Date(startDateParam) : null
    const endDate = endDateParam ? new Date(endDateParam) : null

    // Build query
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = admin.db.collection("logs_archived")

    // Apply date filters
    if (startDate) {
      query = query.where("timestamp", ">=", startDate)
    }
    if (endDate) {
      query = query.where("timestamp", "<=", endDate)
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
          ex: CACHE_TTL,
        })
        console.log("Cached data for:", cacheKey)
      } catch (cacheError) {
        console.error("Redis cache set error:", cacheError)
        // Continue even if caching fails
      }
    }

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error("Error fetching archived logs:", error)

    await serverLogger.error("Error fetching archived logs", {
      error: error.message,
    })

    return NextResponse.json({ error: "Failed to fetch archived logs", details: error.message }, { status: 500 })
  }
}
