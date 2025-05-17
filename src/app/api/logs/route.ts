import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase/admin"
import { getAuth } from "firebase-admin/auth"
import { Timestamp, type Query, type DocumentData } from "firebase-admin/firestore"
import { redis } from "@/lib/redis"

// Number of logs to load at once
const PAGE_SIZE = 10

// Cache TTL in seconds (15 minutes)
const CACHE_TTL = 900

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const filter = searchParams.get("filter") || "all"
    const actionTypeFilter = searchParams.get("actionType") || null
    const searchQuery = searchParams.get("search") || ""
    const cursor = searchParams.get("cursor") || null
    const skipCache = searchParams.get("skipCache") === "true"

    // IMPORTANT: Force page size to be no more than the configured PAGE_SIZE
    const pageSize = Math.min(Number.parseInt(searchParams.get("pageSize") || String(PAGE_SIZE), 10), PAGE_SIZE)

    console.log("API Request:", { filter, actionTypeFilter, cursor, pageSize, startDateParam, endDateParam, skipCache })

    // Generate a cache key based on the query parameters
    const cacheKey = `logs:${filter}:${startDateParam || ""}:${endDateParam || ""}:${actionTypeFilter || ""}:${cursor || ""}:${pageSize}:${searchQuery || ""}`

    // Skip cache for certain conditions
    const useCache = !skipCache && !searchQuery

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

    // Verify session
    const sessionCookie = request.cookies.get("session")?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      // Verify the session cookie
      const auth = getAuth()
      const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)

      // Check if user is admin
      const userRecord = await auth.getUser(decodedClaims.uid)
      const isAdmin = userRecord.customClaims?.admin === true

      if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
      }
    } catch (error) {
      console.error("Session verification failed:", error)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get base collection reference
    const logsCollection = adminDb.collection("logs")

    // Start with a basic query - ALWAYS include limit to prevent excessive reads
    let logsQuery: Query<DocumentData>

    // Build query based on filter type
    if (filter === "cat-activity") {
      // For cat activity, we need to check for actionType
      // First try root level actionType
      try {
        logsQuery = logsCollection
          .where("actionType", "!=", null)
          .orderBy("actionType")
          .orderBy("timestamp", "desc")
          .limit(pageSize)
      } catch (error) {
        console.error("Error with root actionType query:", error)

        // Try details.actionType instead
        try {
          logsQuery = logsCollection
            .where("details.actionType", "!=", null)
            .orderBy("details.actionType")
            .orderBy("timestamp", "desc")
            .limit(pageSize)
        } catch (detailsError) {
          console.error("Error with details.actionType query:", detailsError)

          // Fallback to basic query and filter client-side
          logsQuery = logsCollection.orderBy("timestamp", "desc").limit(pageSize)
        }
      }
    } else if (filter !== "all") {
      // For regular level filters
      logsQuery = logsCollection.where("level", "==", filter).orderBy("timestamp", "desc").limit(pageSize)
    } else {
      // Default query for "all" filter
      logsQuery = logsCollection.orderBy("timestamp", "desc").limit(pageSize)
    }

    // Apply date range filter if provided
    if (startDateParam && endDateParam) {
      try {
        const startDate = new Date(startDateParam)
        const endDate = new Date(endDateParam)

        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
        }

        // Don't allow future dates
        const now = new Date()
        if (startDate > now || endDate > now) {
          return NextResponse.json({ error: "Dates cannot be in the future" }, { status: 400 })
        }

        // Create a new query with date filters
        logsQuery = logsQuery
          .where("timestamp", ">=", Timestamp.fromDate(startDate))
          .where("timestamp", "<=", Timestamp.fromDate(endDate))
      } catch (error) {
        console.error("Error adding date filters:", error)
        return NextResponse.json({ error: "Invalid date parameters" }, { status: 400 })
      }
    }

    // Apply cursor-based pagination if cursor is provided
    if (cursor) {
      try {
        // Get the document to use as a starting point
        const cursorDoc = await logsCollection.doc(cursor).get()

        if (cursorDoc.exists) {
          logsQuery = logsQuery.startAfter(cursorDoc)
        }
      } catch (error) {
        console.error("Error with cursor document:", error)
        // Continue without the cursor if there's an error
      }
    }

    // Execute query
    console.log("Executing Firestore query...")
    const snapshot = await logsQuery.get()
    console.log(`Query returned ${snapshot.size} documents`)

    // Process results
    const logs: any[] = []
    let nextCursor = null

    snapshot.forEach((doc) => {
      const data = doc.data()

      // For cat-activity filter, check if the document has actionType
      if (filter === "cat-activity") {
        const hasActionType = data.actionType || data.details?.actionType
        if (!hasActionType) {
          return // Skip this log if it doesn't have an actionType
        }
      }

      // Apply action type filter if provided
      if (actionTypeFilter && actionTypeFilter !== "all") {
        const docActionType = data.actionType || data.details?.actionType
        if (docActionType !== actionTypeFilter) {
          return // Skip if action type doesn't match
        }
      }

      // Apply text search filter if provided
      if (searchQuery && searchQuery.length > 0) {
        const message = (data.message || "").toLowerCase()
        const details = JSON.stringify(data.details || {}).toLowerCase()
        const catName = (data.catName || data.details?.catName || "").toLowerCase()

        const searchLower = searchQuery.toLowerCase()
        if (!message.includes(searchLower) && !details.includes(searchLower) && !catName.includes(searchLower)) {
          return // Skip this log if it doesn't match the search
        }
      }

      // Format timestamp
      const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date()

      logs.push({
        id: doc.id,
        timestamp: timestamp.toISOString(),
        level: data.level || "info",
        message: data.message || "",
        details: data.details || {},
        userId: data.userId || data.details?.userId || "",
        userEmail: data.userEmail || data.details?.userEmail || "",
        catId: data.catId || data.details?.catId || "",
        catName: data.catName || data.details?.catName || "",
        actionType: data.actionType || data.details?.actionType || "",
      })

      // Update the cursor for pagination
      nextCursor = doc.id
    })

    console.log(`Returning ${logs.length} filtered logs`)

    const responseData = {
      logs,
      cursor: nextCursor,
      hasMore: logs.length === pageSize,
    }

    // Cache the results if applicable
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
    console.error("Error fetching logs:", error)
    return NextResponse.json(
      {
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
